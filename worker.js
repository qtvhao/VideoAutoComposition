let Queue = require('bull');
let fs = require('fs');
let { spawn } = require('child_process');
// const path = require('path');

// let assetsImageDir = path.join(__dirname, 'assets', 'image');
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

queue.process(async (job) => {
  (async function() {
    let jobIds = job.data.videoScript.map((videoScript) => videoScript.jobId);
    console.log('Job ids', jobIds);
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
          console.log('Adding destinate job', destinateJob.data);
          await destinateQueue.add(destinateJob);
        }
        break;
      }
    }
  })();

  // return {
  //   caption: 'captionPath'
  // }
  console.log('Processing job', job.id);
  console.log('Job data', job.data);
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
  await new Promise((resolve, reject) => {
    let process = spawn('python3', [script, 'composite', jobJson]);
    process.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data)
    });
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`stderr: ${data}`);
    });
    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`child process exited with code ${code}`);
        reject(stderr);
      }
      console.log(`child process exited with code ${code}`);
      resolve(stdout);
    });
  });
  //
  let returnValue = JSON.parse(fs.readFileSync('/tmp/returnvalue.json'));
  console.log('Return value', returnValue);
  console.log('Stdout', stdout);
  console.log('Stderr', stderr);

  return returnValue;
});

if (process.env.DEBUG) {
  let jobData = ({
    compositeEngine: 'simple',
    "numberthOfParagraph": 0,
    "articleId": "article_id",
    "videoScript": [
      {
        "jobId": "1000",
        "keywords": [],
        "image_stock_search_phrases": [],
        "keyword": "career opportunities",
        "translated": "",
        "transitionImageFile": "",
        "audioFilePath": "/app/audio/audio.mp3",
        "subtitle": [
          {
            "part": "Tóm ",
            "start": 50,
            "end": 262
          },
          {
            "part": "lại, \"",
            "start": 275,
            "end": 637
          },
          {
            "part": "kế ",
            "start": 912,
            "end": 1062
          },
          {
            "part": "toán ",
            "start": 1075,
            "end": 1337
          },
          {
            "part": "chi ",
            "start": 1350,
            "end": 1525
          },
          {
            "part": "phí\"   ",
            "start": 1537,
            "end": 1875
          },
          {
            "part": "là ",
            "start": 1887,
            "end": 2062
          },
          {
            "part": "một ",
            "start": 2075,
            "end": 2275
          },
          {
            "part": "nguyên ",
            "start": 2287,
            "end": 2500
          },
          {
            "part": "tắc ",
            "start": 2512,
            "end": 2687
          },
          {
            "part": "quan ",
            "start": 2700,
            "end": 2912
          },
          {
            "part": "trọng ",
            "start": 2925,
            "end": 3162
          },
          {
            "part": "giúp ",
            "start": 3175,
            "end": 3350
          },
          {
            "part": "doanh ",
            "start": 3362,
            "end": 3562
          },
          {
            "part": "nghiệp ",
            "start": 3575,
            "end": 3762
          },
          {
            "part": "hiểu ",
            "start": 3775,
            "end": 4062
          },
          {
            "part": "và ",
            "start": 4075,
            "end": 4275
          },
          {
            "part": "quản ",
            "start": 4287,
            "end": 4512
          },
          {
            "part": "lý ",
            "start": 4525,
            "end": 4687
          },
          {
            "part": "chi ",
            "start": 4700,
            "end": 4900
          },
          {
            "part": "phí ",
            "start": 4912,
            "end": 5162
          },
          {
            "part": "của ",
            "start": 5175,
            "end": 5337
          },
          {
            "part": "mình ",
            "start": 5350,
            "end": 5575
          },
          {
            "part": "một ",
            "start": 5587,
            "end": 5775
          },
          {
            "part": "cách ",
            "start": 5787,
            "end": 5962
          },
          {
            "part": "hiệu ",
            "start": 5975,
            "end": 6137
          },
          {
            "part": "quả. ",
            "start": 6150,
            "end": 6562
          }
        ],
        "sanitizedBaseDirectory": "/app/storage/images/0/",
        "sanitizedImages": [
          "0-68-10054691683-68-2021-05-20-at-112325-AM.mp4"
        ]
      }
    ],
    "article": {
      "name": "Public Accounting",
      "priority": 208,
      "titles": [
        "Hé lộ thế giới kế toán công hấp dẫn: Vai trò, lợi ích và con đường sự nghiệp đầy hứa hẹn!"
      ],
      "hashtags": [],
      "description": "",
      "ancestors": [
        "Accounting"
      ]
    },
    "queueName": ""
  });
  let jobs = [];
  jobData.videoScript[1] = JSON.parse(JSON.stringify(jobData.videoScript[0]))
  jobData.videoScript[1].jobId = '-2000';
  jobs.push(JSON.parse(JSON.stringify(jobData)));
  jobData.numberthOfParagraph = 1;
  jobs.push(JSON.parse(JSON.stringify(jobData)));
  jobs.map((job, i) => {
    queue.add(job, {
      jobId: jobData.videoScript[i].jobId,
    });
  });
}
