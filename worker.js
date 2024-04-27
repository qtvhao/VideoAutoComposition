let Queue = require('bull');
let fs = require('fs');
let { spawn } = require('child_process');
const path = require('path');

// let assetsImageDir = path.join(__dirname, 'assets', 'image');
let queueName = process.env.QUEUE_NAME || 'video-auto-composition';
let queue = new Queue(queueName, {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  }
});
queue.process(async (job) => {
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
  queue.add({
    compositeEngine: 'simple',
    "numberthOfParagraph": 0,
    "articleId": "article_id",
    "videoScript": [
      {
        "jobId": "",
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
          },
          {
            "part": "Bằng ",
            "start": 6925,
            "end": 7150
          },
          {
            "part": "cách ",
            "start": 7162,
            "end": 7325
          },
          {
            "part": "sử ",
            "start": 7337,
            "end": 7512
          },
          {
            "part": "dụng ",
            "start": 7525,
            "end": 7737
          },
          {
            "part": "nhiều \"",
            "start": 7750,
            "end": 7987
          },
          {
            "part": "phương ",
            "start": 8000,
            "end": 8237
          },
          {
            "part": "pháp ",
            "start": 8250,
            "end": 8450
          },
          {
            "part": "tính ",
            "start": 8462,
            "end": 8662
          },
          {
            "part": "chi ",
            "start": 8675,
            "end": 8850
          },
          {
            "part": "phí\"   ",
            "start": 8862,
            "end": 9187
          },
          {
            "part": "và ",
            "start": 9200,
            "end": 9587
          },
          {
            "part": "phân ",
            "start": 9600,
            "end": 9812
          },
          {
            "part": "tích \"",
            "start": 9825,
            "end": 10012
          },
          {
            "part": "hành ",
            "start": 10025,
            "end": 10262
          },
          {
            "part": "vi ",
            "start": 10275,
            "end": 10425
          },
          {
            "part": "chi ",
            "start": 10437,
            "end": 10637
          },
          {
            "part": "phí\"  , ",
            "start": 10650,
            "end": 11062
          },
          {
            "part": "doanh ",
            "start": 11387,
            "end": 11600
          },
          {
            "part": "nghiệp ",
            "start": 11612,
            "end": 11812
          },
          {
            "part": "có ",
            "start": 11825,
            "end": 11950
          },
          {
            "part": "thể ",
            "start": 11962,
            "end": 12150
          },
          {
            "part": "đưa ",
            "start": 12162,
            "end": 12337
          },
          {
            "part": "ra ",
            "start": 12350,
            "end": 12512
          },
          {
            "part": "quyết ",
            "start": 12525,
            "end": 12712
          },
          {
            "part": "định ",
            "start": 12725,
            "end": 12900
          },
          {
            "part": "sáng ",
            "start": 12912,
            "end": 13137
          },
          {
            "part": "suốt, ",
            "start": 13150,
            "end": 13462
          },
          {
            "part": "nâng ",
            "start": 13787,
            "end": 14000
          },
          {
            "part": "cao \"",
            "start": 14012,
            "end": 14225
          },
          {
            "part": "khả ",
            "start": 14237,
            "end": 14437
          },
          {
            "part": "năng ",
            "start": 14450,
            "end": 14650
          },
          {
            "part": "sinh ",
            "start": 14662,
            "end": 14862
          },
          {
            "part": "lời\"   ",
            "start": 14875,
            "end": 15150
          },
          {
            "part": "và ",
            "start": 15162,
            "end": 15537
          },
          {
            "part": "đạt ",
            "start": 15550,
            "end": 15737
          },
          {
            "part": "được \"",
            "start": 15750,
            "end": 15937
          },
          {
            "part": "lợi ",
            "start": 15950,
            "end": 16125
          },
          {
            "part": "thế ",
            "start": 16137,
            "end": 16325
          },
          {
            "part": "cạnh ",
            "start": 16337,
            "end": 16562
          },
          {
            "part": "tranh\"   ",
            "start": 16575,
            "end": 16875
          },
          {
            "part": "trong ",
            "start": 16887,
            "end": 17137
          },
          {
            "part": "thời ",
            "start": 17150,
            "end": 17312
          },
          {
            "part": "đại ",
            "start": 17325,
            "end": 17475
          },
          {
            "part": "ngày ",
            "start": 17487,
            "end": 17675
          },
          {
            "part": "nay ",
            "start": 17687,
            "end": 17912
          },
          {
            "part": "thị ",
            "start": 17925,
            "end": 18112
          },
          {
            "part": "trường ",
            "start": 18125,
            "end": 18350
          },
          {
            "part": "năng ",
            "start": 18362,
            "end": 18550
          },
          {
            "part": "động.",
            "start": 18562,
            "end": 18825
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
}
