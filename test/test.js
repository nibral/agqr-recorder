'use strict';

const fs = require('fs');
const co = require('co');

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
    co(function* () {
        console.log('s3.putObject()');
        console.log(yield s3.putObject('./test/test.js'));

        console.log('s3.listObjects()');
        console.log(yield s3.listObjects());

        const getAndSave = () => {
            return new Promise((resolve, reject) => {
                const s3Request = s3.getObjectRequest('test.js');
                s3Request.on('error', (error) => {
                    reject(error);
                });
                s3Request.on('httpHeaders', (statusCode, headers) => {
                    console.log(statusCode);
                    console.log(headers);
                });
                s3Request.on('complete', (response) => {
                    resolve(response);
                });
                s3Request.createReadStream()
                    .pipe(fs.createWriteStream('test.txt'));
            });
        };
        console.log('s3.getObjectAsStream()');
        console.log(yield getAndSave());

        console.log('s3.deleteObjects()');
        console.log(yield s3.deleteObject('test.js'));

        console.log('s3.listObjects()');
        console.log(yield s3.listObjects());
    }).catch((error) => {
        console.log(error);
    });
}

/*
    ./lib/scheduler.js
*/
if (target.scheduler) {
    const scheduler = require('../lib/scheduler');
    scheduler.start('45 */2 * * * *');
}
