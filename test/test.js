'use strict';

const fs = require('fs');

const target = {
    agqr: false,
    recorder: false,
    s3: false
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

        return s3.getObjectAsStream('test.js', 'bytes=100-200');
    }).then((result) => {
        console.log('s3.getObjectAsStream()');
        console.log(result);
        result.stream.pipe(fs.createWriteStream('test.txt'));
    }).catch((error) => {
        console.log(error);
    });
}
