'use strict';

/*
    ./lib/agqr.js
*/
const agqr = require('../lib/agqr');
agqr.getStreamUrl().then((streamUrl) => {
    console.log('agqr.getstreamUrl()');
    console.log(streamUrl);
}).catch((error) => {
    console.log(error);
});

/*
    ./lib/recorder.js
*/
const recorder = require('../lib/recorder');
agqr.getStreamUrl().then((streamUrl) => {
    return recorder.record(streamUrl, 10);
}).then((encodedFiles) => {
    console.log('recorder.record()');
    console.log(encodedFiles);
}).catch((error) => {
    console.log(error);
});

/*
    ./lib/s3.js
*/
const s3 = require('../lib/s3');
s3.putObject('./test/test.js').then((response) => {
    console.log('s3.putObject()');
    console.log(response);
    return s3.listObjects();
}).then((response) => {
    console.log('s3.listObjects()');
    console.log(response);
}).catch((error) => {
    console.log(error);
});

/*
    scheduler
*/
const scheduler = require('../lib/scheduler');
scheduler.start();
