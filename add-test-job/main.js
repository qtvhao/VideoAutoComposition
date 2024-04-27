const celery = require('celery-node');

let jobData = {
    videoId: '1',
    videoUrl: 'https://www.youtube.com/watch?v=1',
    videoTitle: 'Video Title',
};

const client = celery.createClient(
  "amqp://",
  "amqp://"
);

const task = client.createTask("tasks.add");
const result = task.applyAsync([1, 2]);
result.get().then(data => {
  console.log(data);
  client.disconnect();
});