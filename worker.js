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
        await destinateQueue.add(destinateJob, {
          jobId: destinateJob.opts.jobId,
        });
        console.log('Queue stats: ', await destinateQueue.getJobCounts());
      }
      break;
    }
  }
}
queue.process(async (job) => {
  console.log('Processing job', job.id);
  if (process.env.DEBUG && 0) {
    await new Promise(r => setTimeout(r, Math.random() * 2_000));
    mergeToQueue(job);
    return {
      caption: 'captionPath'
    }
  }
  console.log('Processing job', job.id);
  // console.log('Job data', job.data);
  let jobJson = '/tmp/job-' + job.id + '.json'
  fs.writeFileSync(jobJson, JSON.stringify(job.data));
  let compositeEngine = job.data.compositeEngine;
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
    let process = spawn('python3', [script, 'composite', jobJson]);
    process.stdout.on('data', (data) => {
      stdout += data.toString();
      job.log(data.toString());
      console.log(data.toString());
    });
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      job.log(data.toString());
      console.error(`stderr: ${data}`);
    });
    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`child process exited with code ${code}`);
        return reject(stderr);
      }
      console.log(`child process exited with code ${code}`);
      resolve(stdout);
    });
  });
  //
  throw new Error('Error');
  let returnValue = JSON.parse(fs.readFileSync('/tmp/returnvalue.json'));
  // console.log('Return value', returnValue);
  console.log('Stdout', stdout);
  console.log('Stderr', stderr);
  mergeToQueue(job);

  return returnValue;
});

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
