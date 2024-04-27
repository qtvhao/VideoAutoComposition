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
    let stdout = '';
    let stderr = '';
    let outputFile = `/tmp/composite-${compositeEngine}-${job.id}.mp4`;
    await new Promise((resolve, reject) => {
        let process = spawn('python3', [script, 'composite', compositeEngine, outputFile]);
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
