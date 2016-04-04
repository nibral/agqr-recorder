'use strict';

const fs = require('fs');
const path = require('path');

const AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-1';
const s3 = new AWS.S3();
const S3_BUCKET_NAME = 'agqr-recorder';

/**
 * @param {string} filename
 * @return {Object} response from s3
 */
module.exports.putObject = (filename) => {
    return new Promise((resolve, reject) => {
        // prepare buffer from file
        fs.readFile(filename, (err, buffer) => {
            if (err) {
                reject(err);
                return;
            }

            // put buffer
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: path.basename(filename),
                Body: buffer
            };
            s3.putObject(params, (err, response) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(response);
            });
        });
    });
};
