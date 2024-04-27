let Queue = require('bull');
let fs = require('fs');
let { spawn } = require('child_process');
const path = require('path');

let assetsImageDir = path.join(__dirname, 'assets', 'image');
let queue = new Queue('video-auto-composition', 'redis://redis:6379');


queue.add({
    compositeEngine: 'simple',
    assets: {
        images: fs.readdirSync(assetsImageDir).map(file => path.join(assetsImageDir, file)),
    }
});
setTimeout(r => {
    process.exit();
}, 10_000);
queue.process(async (job) => {
    console.log('Processing job', job.id);
    console.log('Job data', job.data);
    fs.writeFileSync('/tmp/job.json', JSON.stringify(job.data));
    let compositeEngine = job.data.compositeEngine;
    if (compositeEngine) {
        console.log('Composite engine', compositeEngine);
    }
    if (fs.existsSync('/tmp/returnvalue.json')) {
        fs.unlinkSync('/tmp/returnvalue.json');
    }
    // 
    let script = 'app.py'
    await new Promise((resolve, reject) => {
        let process = spawn('python3', [script, 'composite', compositeEngine]);
        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        process.on('close', (code) => {
            if (code !== 0) {
                console.error(`child process exited with code ${code}`);
                reject();
            }
            console.log(`child process exited with code ${code}`);
            resolve();
        });
    });
    //
    let returnValue = JSON.parse(fs.readFileSync('/tmp/returnvalue.json'));
    console.log('Return value', returnValue);

    return returnValue;
});
