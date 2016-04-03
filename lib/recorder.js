'use strict';

const childprocess = require('child_process');
const path = require('path');

/**
 * @param {string} streamUrl - URL of recording stream
 * @param {number} length - recoding length (sec.)
 */
const recordByrtmpdump = (streamUrl, length) => {
    return new Promise((resolve, reject) => {
        // generate temporary file named by current time
        const tempFilePath =
            path.join(path.resolve(''), new Date().getTime() + '.flv');

        // call rtmpdump
        const rtmpdump = childprocess.spawn('rtmpdump', [
            '--rtmp', streamUrl,
            '--live',
            '--flv', tempFilePath,
            '-B', length
        ]);
        rtmpdump.on('error', (err) => {
            reject(err);
        });
        rtmpdump.on('close', () => {
            resolve(tempFilePath);
        });
    });
};

/**
 * @param {string} streamUrl - URL of recording stream
 * @param {number} length - recoding length (sec.)
 * @return {string} absolute filepath of recorded flv file
 */
module.exports.record = (streamUrl, length) => {
    return new Promise((resolve, reject) => {
        recordByrtmpdump(streamUrl, length).then((flvFilePath) => {
            resolve(flvFilePath);
        }).catch((error) => {
            reject(error);
        });
    });
};
