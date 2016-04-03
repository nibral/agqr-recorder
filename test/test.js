'use strict';

/*
    ./lib/agqr.js
*/
const agqr = require('../lib/agqr');
agqr.getStreamUrl().then((streamUrl) => {
    console.log('agqr.getstreamUrl()');
    console.log(streamUrl);
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
});

/*
    scheduler
*/
const scheduler = require('../lib/scheduler');
scheduler.start();
