let Queue = require('bull');


let queue = new Queue('video-auto-composition', 'redis://redis:6379');

queue.process(async (job) => {
    console.log('Processing job', job.id);
    console.log('Job data', job.data);
    fs.writeFileSync('/tmp/job.json', JSON.stringify(job.data));

    return 'done';
});
