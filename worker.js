let Queue = require('bull');
let fs = require('fs');
let { spawn } = require('child_process');
const path = require('path');
console.log('Worker started');
let queueName = process.env.QUEUE_NAME || 'video-auto-composition';
let destinateQueueName = process.env.DESTINATE_QUEUE || 'video-auto-composition-result';
let notifyVideoPromptQueueName = 'notify-video-prompt-queue';
let http = require('http');
let lockDuration = 20 * 60 * 1000; // 20 minutes
let opts = {
  settings: {
    lockDuration: lockDuration,
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  }
};
let queue = new Queue(queueName, opts);
let destinateQueues
if (destinateQueueName.indexOf(' | ') === -1) {
  destinateQueues = [
    new Queue(destinateQueueName, opts)
  ];
}else{
  destinateQueues = destinateQueueName.split(';').map((queueName) => {
    return new Queue(queueName.split(' | ')[3], opts);
  })
}
let notifyVideoPromptQueue = new Queue(notifyVideoPromptQueueName, opts);
async function getDestinateQueue (job) {
  if (job) {
    job.log('Getting destinate queue. Job is added by ' + job.data.article.addedBy);
    if (job.data.article.addedBy === "video-prompt-queue") {
      return notifyVideoPromptQueue;
    }
  }
  // 
  if (job && destinateQueueName.indexOf(' | ') !== -1) {
    console.log('Job data', job.data);
    let article = job.data.article;
    let ancestors = article.ancestors;
    let ancestor = ancestors[0];
    console.log('Ancestor', ancestor);
    //
    let destinateQueueIndex = destinateQueueName.split(';').findIndex((queueName) => queueName.split(' | ')[0] === ancestor);
    job.log("Ancestor: " + ancestor + " for queue index " + destinateQueueIndex);
    if (destinateQueueIndex === -1) {
      throw new Error('Ancestor ' + ancestor + ' not found in ' + destinateQueueName);
    }
    return destinateQueues[destinateQueueIndex];
  }

  return destinateQueues[Math.floor(Math.random() * destinateQueues.length)];
}
let ancestorsQueues = (process.env.ANCESTORS_QUEUES || '').split(';').map((queueName) => new Queue(queueName, opts))

async function mergeToQueue(job) {
  let jobIds = job.data.videoScript.map((videoScript) => videoScript.jobId);
  // console.log('Job ids', jobIds);
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    let jobs = await Promise.all(jobIds.map((jobId) => queue.getJob(jobId)));
    let isAllJobsCompleted = jobs.every((job) => job && job.returnvalue);
    console.log('isAllJobsCompleted', isAllJobsCompleted);
    if (isAllJobsCompleted) {
      let destinateJob = {
        data: {
          ...job.data,
          compositeEngine: 'merge',
          videoScript: job.data.videoScript.map((videoScript) => {
            let job = jobs.find((job) => job.id === videoScript.jobId);
            let jobData = job.data;
            let numberthOfParagraph = jobData.numberthOfParagraph;
            if (typeof job.data.videoScript[numberthOfParagraph].searchPhraseAlphaNumeric === 'undefined') {
              console.log("numberthOfParagraph: ", numberthOfParagraph);
              console.log('searchPhrasesAlphaNumeric is undefined', job.data.videoScript[numberthOfParagraph]);
              throw new Error('searchPhrasesAlphaNumeric is undefined');
            }
            return {
              ...videoScript,
              sequence_result_path: job.returnvalue.caption,
              searchPhraseAlphaNumeric: job.data.videoScript[numberthOfParagraph].searchPhraseAlphaNumeric,
            };
          }),
        },
        opts: {
          jobId: jobIds.reduce((acc, jobId) => acc + Number(jobId), 0),
        }
      };
      let destinateQueue = await getDestinateQueue();
      if (!await destinateQueue.getJob(destinateJob.opts.jobId)) {
        console.log('Adding destinate job'); //
        destinateJob.data.videoScript = destinateJob.data.videoScript.map((paragraph) => {
          if (paragraph.subtitle) {
            delete paragraph.subtitle;
          }

          return paragraph;
        });
        destinateJob.data.searchPhrasesAlphaNumeric = destinateJob.data.videoScript.map((videoScript) => videoScript.searchPhraseAlphaNumeric);
        await destinateQueue.add(destinateJob.data, {
          jobId: destinateJob.opts.jobId,
        });
        console.log('Queue stats: ', await destinateQueue.getJobCounts());
      }
      break;
    }else{
      let jobIds = job.data.videoScript.map((videoScript) => videoScript.jobId);
      let jobs = await Promise.all(jobIds.map((jobId) => queue.getJob(jobId)));
      let missingJobsIds = jobIds.filter((jobId) => !jobs.find((job) => job && job.id === jobId));
      // Check if all jobs are present
      let isAllJobsPresent = jobs.every((job) => job);
      console.log('isAllJobsPresent', isAllJobsPresent);
      if (!isAllJobsPresent) {
        job.log('Some jobs are missing. Those are ' + missingJobsIds.join(', '));

        for (let ancestorsQueue of ancestorsQueues) {
          let ancestorsJobs = await Promise.all(missingJobsIds.map((jobId) => ancestorsQueue.getJob(jobId)));
          let ancestorsStates = []
          for (let i = 0; i < ancestorsJobs.length; i++) {
            let job = ancestorsJobs[i];
            ancestorsStates.push(JSON.stringify({
              job: typeof job,
              is_null: job === null,
              state: await job?.getState(),
              jobId: missingJobsIds[i],
            }));
          }
          job.log('Ancestors states: ' + ancestorsStates.join(', ') + ' for ' + ancestorsQueue.name);
        }
      } else {
        job.log('All jobs are present, but not all are completed yet. They are ' + jobIds.filter((jobId, i) => !jobs[i].returnvalue).join(', '));
      }
    }
  }
}
// async function throwsIfAudioFileError(audioFilePath) {
//   // if ffmpeg probe fails, throw error
  
// }
let cacheFolder = '/app/storage/images/video-auto-composition-cached';
if (!fs.existsSync(cacheFolder)) {
  fs.mkdirSync(cacheFolder, { recursive: true });
}
async function retryJobIds(job, jobIds) {
  let jobs = await Promise.all(jobIds.map((jobId) => queue.getJob(jobId)));
  let existsJobs = jobs.filter(job => job);
  for (let existsJob of existsJobs) {
    if (await existsJob.getState() === 'failed') {
      console.log('After processing job', job.id, '. Found failed job that needs to be retried ', existsJob.id);
      job.log('After processing job ' + job.id + '. Found failed job that needs to be retried ' + existsJob.id);
      try {
        await existsJob.retry();
        job.log('Retried job ' + existsJob.id);
        console.log('Retried job ' + existsJob.id);
        break;
      } catch (e) {
        job.log('Failed to retry job ' + existsJob.id + ' with error ' + e.message);
      }
    }
  }
}
function djb2(str) { let hash = 5381; for (let i = 0; i < str.length; i++) { hash = ((hash << 5) + hash) + str.charCodeAt(i); } return hash; }
let Processor = (async (job) => {
  if (job.data.compositeEngine === 'merge') {
    // getDestinateQueue(job);
  }
  // let countCompletedJobs = await queue.getCompletedCount();
  // console.log('Successfully merged: ', countCompletedJobs);
  console.log('Processing job', job.id);
  if (process.env.DEBUG && 0) {
    await new Promise(r => setTimeout(r, Math.random() * 2_000));
    mergeToQueue(job);
    return {
      caption: 'captionPath'
    }
  }
  let destinateQueue;
  if (job.data.compositeEngine === 'merge') {
    destinateQueue = await getDestinateQueue(job);
  }else{
    destinateQueue = await getDestinateQueue();
  }
  // wait destinate queue to have less than 10 jobs waiting
  while (await destinateQueue.getWaitingCount() > 0) {
    job.log('Destinate queue ' + destinateQueue.name + ' has more than 10 jobs waiting. Waiting for 10 seconds');
    console.log('Destinate queue', destinateQueue.name, 'has more than 10 jobs waiting. Waiting for 10 seconds');
    await new Promise(r => setTimeout(r, 10_000));
  }
  if (job.data.compositeEngine !== 'merge') {
      let jobIds = job.data.videoScript.map((videoScript) => videoScript.jobId);
      let jobs = await Promise.all(jobIds.map((jobId) => queue.getJob(jobId)));
      let isAllJobsExists = jobs.every(job => job);
      if (!isAllJobsExists) {
        job.log('isAllJobsExists: ' + isAllJobsExists + '. Non-exists jobs: ' + jobIds.filter((jobId, i) => !jobs[i]).join(', '));
      }
      let attemptsMade = job.attemptsMade;
      if (isAllJobsExists) {
        job.log('All jobs exist. Proceeding with processing.');
      }else{
        let missingJobsIds = jobIds.filter((_jobId, i) => !jobs[i]);
        let addedLogs = [];
        for (let ancestorsQueue of ancestorsQueues) {
          let ancestorsJobs = await Promise.all(missingJobsIds.map((jobId) => ancestorsQueue.getJob(jobId)));
          let ancestorsStates = []
          for (let i = 0; i < ancestorsJobs.length; i++) {
            let job = ancestorsJobs[i];
            ancestorsStates.push(JSON.stringify({
              job: typeof job,
              is_null: job === null,
              state: await job?.getState(),
              jobId: missingJobsIds[i],
            }));
          }
          let ancestorsStatesAllCompleted = ancestorsStates.every((state) => JSON.parse(state).state === 'completed');
          if (ancestorsStatesAllCompleted) {
            ancestorsStates = [
              "All completed"
            ]
          }
          addedLogs.push('Ancestors states: ' + ancestorsStates.join(', ') + ' for ' + ancestorsQueue.name);
        }
        await new Promise(r => setTimeout(r, 6_000));
        let msg = `Attempts made ${attemptsMade}. Some jobs under ${job.data.articleId} are missing. Retry in 60 seconds. Non-exists jobs: ${missingJobsIds.join(', ')}. Ancestors states: ${addedLogs.join(', ')}`;
        job.log(msg);
        console.log(msg);
        throw new Error(msg);
      }
      // retry job if failed
      let thisJob = job;
      let retries = (jobs.filter(job => {
        return job && job.id !== thisJob.id && job.attemptsMade < 2;
      }).map((job) => job.retry()));
      try{
        await Promise.all(retries);
      }catch(e){
        console.error('Failed to retry jobs', e);
        job.log('Failed to retry jobs ' + e.message);
      }
  }
  
  job.log(`Processing job ${job.id}`);
  console.log('Processing job', job.id);

  let jobJson = '/tmp/job-' + job.id + '.json'
  let stdout = '';
  let stderr = '';
  await new Promise((resolve, reject) => {
    let audioFilePath = job.data.videoScript[job.data.numberthOfParagraph].audioFilePath;
    job.log(`ffprobe -i ${audioFilePath}`);
    let process = spawn('ffprobe', ['-i', audioFilePath]);
    process.stdout.on('data', (data) => {
      job.log(data.toString());
      stdout += data.toString();
    });
    process.stderr.on('data', (data) => {
      job.log(data.toString());
      stderr += data.toString();
    });
    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`child process exited with code ${code}`);
        job.log(`child process exited with code 1 ${code}`);
        reject(`child process exited with code ${code}. Stderr: ${stderr} ${stdout}`);
      }else{
        console.log(`child process exited with code ${code}`);
        job.log(`child process exited with code 2 ${code}`);
        resolve(stdout);
      }
    });
  });
  // await throwsIfAudioFileError();
  fs.writeFileSync(jobJson, JSON.stringify(job.data));
  let compositeEngine = job.data.compositeEngine ?? 'composite';
  if (compositeEngine) {
    job.log(`Composite engine: ${compositeEngine}`);
    console.log('Composite 2 engine', compositeEngine);
  }
  if (fs.existsSync('/tmp/returnvalue.json')) {
    fs.unlinkSync('/tmp/returnvalue.json');
  }
  // 
  let script = 'app.py'
  stdout = '';
  stderr = '';
  await job.log(`python3 ${script} composite ${jobJson}`);
  let articleName = job.data.article.name;
  // let articleId = job.data.articleId;
  let secret_key = job.data.secret_key;
  let numberthOfParagraph = job.data.numberthOfParagraph;
  // let articleNameSlug = articleName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  let cacheKey = `${articleName}_${numberthOfParagraph + 1}-out-of-${job.data.videoScript.length}`;
  if (job.data.compositeEngine === 'merge') {
    cacheKey = `${articleName}_merged`;
  }
  cacheKey = djb2(cacheKey);
  let returnValue;
  let returnValueInCacheFile = path.join(cacheFolder, cacheKey + '.json');
  job.log(articleName + ', ' + numberthOfParagraph + ', ' + job.data.videoScript.length);
  job.log('Cache file: ' + returnValueInCacheFile);
  job.log('Cache exists: ' + fs.existsSync(returnValueInCacheFile));
  if (job.data.compositeEngine === 'merge') {
    http.request({
      host: 'distributor-api',
      port: 80,
      path: '/',
      method: 'POST',
      headers: {'Content-Type': 'application/json',},
    }).end(JSON.stringify({ 'status': 'exporting', 'prompt': job.data.article.name, 'secret_key': secret_key,}));
  }else{
    http.request({
      host: 'distributor-api',
      port: 80,
      path: '/',
      method: 'POST',
      headers: {'Content-Type': 'application/json',},
    }).end(JSON.stringify({ 'status': 'final reviewing ' + (numberthOfParagraph + 1) + ' out of ' + job.data.videoScript.length, 'prompt': job.data.article.name, 'secret_key': secret_key,}));
  }

  if (!fs.existsSync(returnValueInCacheFile)) {
    await new Promise((resolve, reject) => {
      job.log(`python3 ${script} ${compositeEngine} ${jobJson}`);
      let process = spawn('python3', [script, compositeEngine, jobJson]);
      process.stdout.on('data', (data) => {
        stdout += data.toString();
        job.log(data.toString());
        console.log(data.toString());
      });
      let progress = 0
      let part
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        if (data.toString().indexOf('%') !== -1) {
          let percentage = data.toString().match(/\d+/)[0];
          if (percentage === progress) {
            // check if the percentage is the same as the previous one
            return;
          }
          // if the percentage is different, update the progress
          progress = percentage;
          job.progress(Number(percentage));
          // 
          let updated_part = Math.min(Math.floor(percentage / 20), 4);
          if (updated_part === part) {
            return;
          }
          part = updated_part;
          // new Regex('final reviewing (\\d+) out of (\\d+) (\\d+)/5')
          if (job.data.compositeEngine === 'merge') {
            fetch('http://distributor-api:80/', { method: 'POST', headers: {'Content-Type': 'application/json',}, body: JSON.stringify({
              'status': 'exporting ' + (part + 1) + '/5',
              'prompt': job.data.article.name,
              'secret_key': secret_key,
            }),});
          }else{
            fetch('http://distributor-api:80/', { method: 'POST', headers: {'Content-Type': 'application/json',}, body: JSON.stringify({
              'status': 'final reviewing ' + (numberthOfParagraph + 1) + ' out of ' + job.data.videoScript.length + ' ' + (part + 1) + '/5',
              'prompt': job.data.article.name,
              'secret_key': secret_key,
            }),});
          }
        }else{
          job.log(data.toString());
          console.error(`stderr: ${data}`);
        }
      });
      process.on('close', (code) => {
        if (code !== 0) {
          job.log(`child process exited with code 3 ${code}`);
          console.error(`child process exited with code ${code}`);
          job.log(`Stderr: ${stderr}`);
          console.log('Stderr', stderr);
          return setTimeout(() => {
            return reject(stderr);
          }, 10_000);
        }
        job.log(`child process exited with code 4 ${code}`);
        console.log(`child process exited with code ${code}`);
        resolve(stdout);
      });
    });
    //
    returnValue = JSON.parse(fs.readFileSync('/tmp/returnvalue.json'));
    fs.writeFileSync(returnValueInCacheFile, JSON.stringify(returnValue));
    console.log('Stdout', stdout);
    console.log('Stderr', stderr);
    job.log('Stdout', stdout);
    job.log('Stderr', stderr);
  }else{
    returnValue = JSON.parse(fs.readFileSync(returnValueInCacheFile));
  }

  if (job.data.compositeEngine === 'merge') {
    job.log('Merged job', job.id, 'completed with return value', returnValue);
    console.log('Merged job', job.id, 'completed with return value', returnValue);
    let destinateQueue = await getDestinateQueue(job);
    job.log('Adding destinate job to ' + destinateQueue.name);
    console.log('Adding destinate job to', destinateQueue.name);
    job.log('Adding destinate job to ' + destinateQueue.name);
    job.data.videoScript = job.data.videoScript.map((paragraph) => {
      if (paragraph.subtitle) {
        delete paragraph.subtitle;
      }

      return paragraph;
    });

    await destinateQueue.add({
      ...job.data,
      merged: returnValue,
    }, {
      lockDuration: 60_000, // lock duration is used to prevent the job from being processed by multiple workers
      maxStalledCount: 0,
    });
  }else{
    await notifyVideoPromptQueue.add({
      ...job.data,
      partial_completed: returnValue,
    });
    console.log('L213: Adding to queue');
    job.log('Adding to queue');
    mergeToQueue(job);
  }
  job.log(`On queue ${queue.name} job ${job.id} completed with return value ${JSON.stringify(returnValue)}`);
  console.log("On queue", queue.name, "job", job.id, "completed with return value", returnValue);
  if (job.data.compositeEngine !== 'merge') {
    let jobIds = job.data.videoScript.map((videoScript) => videoScript.jobId);
    await retryJobIds(job, jobIds)
  }
  job.log('Job completed');

  return returnValue;
});
queue.process(Processor)

if (process.env.DEBUG_MERGE) {
  let jobData2 = require('./job_merge.json').data.data
  queue.add({
    compositeEngine: 'merge',
    ...jobData2
  }, {})
}
if (process.env.DEBUG) {
  let jobData = require('./worker.json').data
  let jobs = [];
  let numberthOfParagraph = jobData.numberthOfParagraph;
  jobData.videoScript[numberthOfParagraph + 1] = JSON.parse(JSON.stringify(jobData.videoScript[numberthOfParagraph]))
  jobData.videoScript[numberthOfParagraph + 1].jobId = '-2000';
  jobs.push(JSON.parse(JSON.stringify(jobData)));
  jobData.numberthOfParagraph = 1;
  // jobs.push(JSON.parse(JSON.stringify(jobData)));
  jobs.map((job, i) => {
    queue.add(job, {
      jobId: jobData.videoScript[i].jobId,
    }).then((job) => {
      console.log('Job added', job.id);
      queue.getJob(job.id).then((job) => {
        console.log('Job', job.id, 'status', job.status);
      });
    });
  });
}
