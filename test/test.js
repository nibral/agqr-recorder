'use strict';

const fs = require('fs');

const target = {
    agqr: false,
    recorder: false,
    s3: false,
    scheduler: false
};

/*
    ./lib/agqr.js
*/
if (target.agqr) {
    const agqr = require('../lib/agqr');
    agqr.getStreamUrl().then((streamUrl) => {
        console.log('agqr.getstreamUrl()');
        console.log(streamUrl);
    }).catch((error) => {
        console.log(error);
    });
}

/*
    ./lib/recorder.js
*/
if (target.recorder) {
    const agqr = require('../lib/agqr');
    const recorder = require('../lib/recorder');
    agqr.getStreamUrl().then((streamUrl) => {
        return recorder.record(streamUrl, 10);
    }).then((encodedFiles) => {
        console.log('recorder.record()');
        console.log(encodedFiles);
    }).catch((error) => {
        console.log(error);
    });
}

/*
    ./lib/s3.js
*/
if (target.s3) {
    const s3 = require('../lib/s3');
    s3.putObject('./test/test.js').then((response) => {
        console.log('s3.putObject()');
        console.log(response);

        return s3.listObjects();
    }).then((response) => {
        console.log('s3.listObjects()');
        console.log(response);

        console.log('s3.getObjectAsStream()');
        const s3Request = s3.getObjectRequest('test.js', 'bytes=100-200');
        s3Request.on('error', (error) => {
            response.send(error);
        });
        s3Request.on('httpHeaders', (statusCode, headers) => {
            console.log(statusCode);
            console.log(headers);
        });
        s3Request.createReadStream().pipe(fs.createWriteStream('test.txt'));
    }).catch((error) => {
        console.log(error);
    });
}

/*
    ./lib/scheduler.js
*/
if(target.scheduler) {
    const scheduler = require('../lib/scheduler');
    scheduler.start('45 */2 * * * *');
}
