'use strict';

const agqr = require('./agqr');
const co = require('co');
const CronJob = require('cron').CronJob;
const fs = require('fs');
const path = require('path');
const s3 = require('./s3');
const recorder = require('./recorder');

let config = null;

/**
 * @param {Date} date - date
 * @param {String} format - format
 * @return {String} formatted date string
 */
const formatDate = (date, format) => {
    format = format.replace(/YYYY/g, date.getFullYear())
        .replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2))
        .replace(/DD/g, ('0' + date.getDate()).slice(-2))
        .replace(/hh/g, ('0' + date.getHours()).slice(-2))
        .replace(/mm/g, ('0' + date.getMinutes()).slice(-2))
        .replace(/ss/g, ('0' + date.getSeconds()).slice(-2));

    return format;
};

/**
 * @param {string} filename - filename of config file
 */
const loadConfigFromFile = (filename) => {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            throw err;
        }
        // JSON.parse does unstable behavior when data has empty string
        config = JSON.parse(data || 'null');
    });
};

/**
 * @return {Object} Information of program which need record
 */
const searchProgramToRecord = () => {
    // generate string of nearest program start time
    let startAt = new Date();
    startAt.setSeconds(0, 0);
    if (startAt.getMinutes() < 30) {
        startAt.setMinutes(30);
    } else {
        startAt = new Date(startAt.getTime() + 30 * 60 * 1000);
        startAt.setMinutes(0);
    }
    const startDayNo = (startAt.getDay() === 0) ? 7 : startAt.getDay();

    // compare time and day number
    let result = null;
    config.programs.forEach((program) => {
        const time = program.time.split(':');
        const hour = parseInt(time[0]);
        const minute = parseInt(time[1]);
        const dayNo = program.dayNo;
        if (startAt.getHours() === hour && startAt.getMinutes() === minute
            && startDayNo === dayNo) {
            program.startAt = startAt;
            result = program;
        }
    });

    return result;
};

const record = () => {
    if (!config) {
        return;
    }

    const program = searchProgramToRecord();
    if (program) {
        /*eslint-disable */
        co(function* () {
            const streamUrl = yield agqr.getStreamUrl();
            const encodedFiles =
                yield recorder.record(streamUrl, program.length * 60 + 30);

            // rename
            const dir = path.dirname(encodedFiles.video);
            const basename =
                '[' + formatDate(program.startAt, 'YYYYMMDD') + ']'
                + program.title;
            const basePath = dir + path.sep + basename;
            const video = (basePath + '.mp4').replace(' ', '_');
            const audio = (basePath + '.m4a').replace(' ', '_');
            const thumbnail = (basePath + '.jpg').replace(' ', '_');
            fs.renameSync(encodedFiles.video, video);
            fs.renameSync(encodedFiles.audio, audio);
            fs.renameSync(encodedFiles.thumbnail, thumbnail);

            // upload to s3 (video)
            yield s3.putObject(video);
            yield s3.putObject(audio);
            yield s3.putObject(thumbnail);

            // delete flv file
            fs.unlinkSync(video);
            fs.unlinkSync(audio);
            fs.unlinkSync(thumbnail);
            
            console.log('complete:' + basename);
        });
        /*eslint-enable */
    }
};

module.exports.start = (cronPattern) => {
    // load config & watch update
    const configFilename = path.resolve(__dirname, '../config.json');
    loadConfigFromFile(configFilename);
    fs.watch(configFilename, (event) => {
        if (event === 'change') {
            loadConfigFromFile(configFilename);
        }
    });

    // register record and upload process
    // 3. nothing to do on complete
    // 4. start immidiately
    // 5. timezone
    const recordJob =
        new CronJob(cronPattern, record, null, false, 'Asia/Tokyo');
    recordJob.start();
};
