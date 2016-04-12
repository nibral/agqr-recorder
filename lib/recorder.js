'use strict';

const childprocess = require('child_process');
const fs = require('fs');
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
        ], {
                stdio: 'ignore'
            });
        rtmpdump.on('error', (err) => {
            reject(err);
        });
        rtmpdump.on('close', () => {
            resolve(tempFilePath);
        });
    });
};

/**
 * @param {string} - flvFilePath
 * @return {Object} absolute filepath of encoded file (video,audio.thumbnail)
 */
const encodeByffmpeg = (flvFilePath) => {
    return new Promise((resolve, reject) => {
        // generate name of encoded files
        const dir = path.dirname(flvFilePath);
        const basename = path.basename(flvFilePath, '.flv');
        const videoFilePath = dir + path.sep + basename + '.mp4';
        const audioFilePath = dir + path.sep + basename + '.m4a';
        const thumbnailFilePath = dir + path.sep + basename + '.jpg';

        // call ffmpeg
        const ffmpeg = childprocess.spawn('ffmpeg', [
            '-y',
            '-i', flvFilePath,
            // video
            '-vcodec', 'copy',
            '-acodec', 'aac',
            '-ac', '1',
            '-ab', '32k',
            '-ar', '24000',
            videoFilePath,
            // audio
            '-vn',
            '-acodec', 'aac',
            '-ac', '1',
            '-ab', '32k',
            '-ar', '24000',
            audioFilePath,
            //thumbnail
            '-ss', '20',
            '-vframes', '1',
            '-f', 'image2',
            '-s', '320x180',
            thumbnailFilePath
        ], {
                stdio: 'ignore'
            });
        ffmpeg.on('error', (error) => {
            reject(error);
        });
        ffmpeg.on('close', () => {
            // delete flv file after encode
            fs.unlink(flvFilePath, (err) => {
                if (err) {
                    reject(err);
                }
                resolve({
                    video: videoFilePath,
                    audio: audioFilePath,
                    thumbnail: thumbnailFilePath
                });
            });
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
            return encodeByffmpeg(flvFilePath);
        }).then((encodedFiles) => {
            resolve(encodedFiles);
        }).catch((error) => {
            reject(error);
        });
    });
};
