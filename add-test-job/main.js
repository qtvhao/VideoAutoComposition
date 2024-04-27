let amqp = require('amqplib');

let jobData = {
    videoId: '1',
    videoUrl: 'https://www.youtube.com/watch?v=1',
    videoTitle: 'Video Title',
};

let jobDataBuffer = Buffer.from(JSON.stringify(jobData));

amqp.connect('amqp://amqp').then(async (connection) => {
    let channel = await connection.createChannel();
    await channel.assertQueue('video-auto-composition-jobs', {durable: true});
    channel.sendToQueue('video-auto-composition-jobs', jobDataBuffer, {persistent: true});
    console.log('Job sent');
    setTimeout(() => {
        connection.close();
    }, 500);
});