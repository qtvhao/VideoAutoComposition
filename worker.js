let Queue = require('bull');
let fs = require('fs');
let { spawn } = require('child_process');
console.log('Worker started');
let queueName = process.env.QUEUE_NAME || 'video-auto-composition';
let destinateQueueName = process.env.DESTINATE_QUEUE || 'video-auto-composition-result';
let opts = {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  }
};
let queue = new Queue(queueName, opts);
let destinateQueue = new Queue(destinateQueueName, opts);
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
            return {
              ...videoScript,
              sequence_result_path: job.returnvalue.caption,
            };
          }),
        },
        opts: {
          jobId: jobIds.reduce((acc, jobId) => acc + Number(jobId), 0),
        }
      };
      if (!await destinateQueue.getJob(destinateJob.opts.jobId)) {
        console.log('Adding destinate job')
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
      }
    }
  }
}
let Processor = (async (job) => {
  console.log('Processing job', job.id);
  if (process.env.DEBUG && 0) {
    await new Promise(r => setTimeout(r, Math.random() * 2_000));
    mergeToQueue(job);
    return {
      caption: 'captionPath'
    }
  }
  if (job.data.compositeEngine !== 'merge') {
      let jobIds = job.data.videoScript.map((videoScript) => videoScript.jobId);
      let jobs = await Promise.all(jobIds.map((jobId) => queue.getJob(jobId)));
      let isAllJobsExists = jobs.every(job => job);
      job.log('isAllJobsExists: ' + isAllJobsExists + '. Non-exists jobs: ' + jobIds.filter((jobId, i) => !jobs[i]).join(', '));
      let attemptsMade = job.attemptsMade;
      if (isAllJobsExists) {
        //break;
        let existsJobs = jobs.filter(job => job);
        for (let existsJob of existsJobs) {
            if (await existsJob.getState() === 'failed') {
                try{
                  await existsJob.retry();
                }catch(e){
                  job.log('Failed to retry job ' + existsJob.id + ' with error ' + e.message);
                }
            }
        }
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
          addedLogs.push('Ancestors states: ' + ancestorsStates.join(', ') + ' for ' + ancestorsQueue.name);
        }
        throw new Error('Attempts made ' + attemptsMade + '. Some jobs under ' + job.data.articleId + ' are missing. Retry in 60 seconds. Non-exists jobs: ' + missingJobsIds.join(', ') + '. Ancestors states: ' + addedLogs.join(', '));
      }
  }
  
  console.log('Processing job', job.id);

  let jobJson = '/tmp/job-' + job.id + '.json'
  fs.writeFileSync(jobJson, JSON.stringify(job.data));
  let compositeEngine = job.data.compositeEngine ?? 'composite';
  if (compositeEngine) {
    console.log('Composite engine', compositeEngine);
  }
  if (fs.existsSync('/tmp/returnvalue.json')) {
    fs.unlinkSync('/tmp/returnvalue.json');
  }
  // 
  let script = 'app.py'
  let stdout = '';
  let stderr = '';
  await job.log(`python3 ${script} composite ${jobJson}`);
  await new Promise((resolve, reject) => {
    let process = spawn('python3', [script, compositeEngine, jobJson]);
    process.stdout.on('data', (data) => {
      stdout += data.toString();
      job.log(data.toString());
      console.log(data.toString());
    });
    let progress = 0
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      if (data.toString().indexOf('%') !== -1) {
        let percentage = data.toString().match(/\d+/)[0];
        if (percentage === progress) {
          return;
        }
        progress = percentage;
        console.log('Progress', percentage);
        job.progress(Number(percentage));
      }else{
        job.log(data.toString());
        console.error(`stderr: ${data}`);
      }
    });
    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`child process exited with code ${code}`);
        return setTimeout(() => {
          return reject(stderr);
        }, 10_000);
      }
      console.log(`child process exited with code ${code}`);
      resolve(stdout);
    });
  });
  //
  let returnValue = JSON.parse(fs.readFileSync('/tmp/returnvalue.json'));
  console.log('Stdout', stdout);
  console.log('Stderr', stderr);
  if (job.data.compositeEngine === 'merge') {
    await destinateQueue.add({
      ...job.data,
      merged: returnValue,
    }, {
      lockDuration: 60_000, // lock duration is used to prevent the job from being processed by multiple workers
      maxStalledCount: 0,
    });
  }else{
    mergeToQueue(job);
  }

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
