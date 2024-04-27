let Queue = require('bull');


let queue = new Queue('video-auto-composition', 'redis://redis:6379');

let jobData = {
    videoId: '1',
    videoUrl: 'https://www.youtube.com/watch?v=1',
    videoTitle: 'Video Title',
};

queue.add(jobData, {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 1000
    }
}).then((job) => {
    console.log('Job added', job.id);
    process.exit();
});