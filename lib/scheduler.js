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
    const data = fs.readFileSync(filename, 'utf8');

    // JSON.parse does unstable behavior when data has empty string
    config = JSON.parse(data || 'null');

    const now = new Date();
    console.log(now.toString());
    console.log('load config:');
    console.log(JSON.stringify(config, null, '  '));
};

/**
 * @return {Object} Information of program which need record
 */
const searchProgramToRecord = () => {
    const MAX_DIFF_IN_SEC = 60;

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDate = now.getDate();
    // convert day number as ISO 8601 format
    const nowDayNo = (now.getDay() === 0) ? 7 : now.getDay();

    // compare time and day number
    let result = null;
    config.programs.forEach((program) => {
        // generate Date object from config
        const time = program.time.split(':');
        const hour = parseInt(time[0]);
        const minute = parseInt(time[1]);
        const dayNo = program.dayNo;

        // advance the date if program scheduled at 0:00 sharp.
        if (time === 0 && hour === 0) {
            nowDate++;
            nowDayNo = (nowDayNo === 7) ? 1 : nowDayNo + 1;
        }

        const scheduledDate =
            new Date(nowYear, nowMonth, nowDate, hour, minute, 0, 0);
        const diff = Math.abs(now.getTime() - scheduledDate.getTime()) / 1000;
        if (diff < MAX_DIFF_IN_SEC && nowDayNo === dayNo) {
            program.startAt = now;
            result = program;
        }
    });

    return result;
};

/**
 * record processes
 */
const record = () => {
    if (!config) {
        return;
    }

    const program = searchProgramToRecord();
    if (program) {
        /*eslint-disable */
        co(function* () {
            const now = new Date();
            console.log(now.toString());

            const streamUrl = yield agqr.getStreamUrl();
            const encodedFiles =
                yield recorder.record(streamUrl, program.length * 60 + 30);
            console.log('recoding:ok');

            // rename
            const dir = path.dirname(encodedFiles.video);
            const basename =
                '[' + formatDate(program.startAt, 'YYYYMMDD') + ']'
                + program.title;
            const basePath = dir + path.sep + basename;
            const video = (basePath + '.mp4').replace(/ /g, '_');
            const audio = (basePath + '.m4a').replace(/ /g, '_');
            const thumbnail = (basePath + '.jpg').replace(/ /g, '_');
            fs.renameSync(encodedFiles.video, video);
            fs.renameSync(encodedFiles.audio, audio);
            fs.renameSync(encodedFiles.thumbnail, thumbnail);
            console.log('rename:ok');

            // upload to s3 (video)
            yield s3.putObject(video);
            yield s3.putObject(audio);
            yield s3.putObject(thumbnail);
            console.log('put to s3:ok');

            // delete flv file
            fs.unlinkSync(video);
            fs.unlinkSync(audio);
            fs.unlinkSync(thumbnail);
            console.log('unlinkFlv:ok');

            console.log('finish:' + basename);
        }).catch((error) => {
            throw error;
        });
        /*eslint-enable */
    }
};

/**
 * @param {String} cronPattern
 */
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
