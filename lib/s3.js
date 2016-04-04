'use strict';

const fs = require('fs');
const path = require('path');

const AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-1';
const s3 = new AWS.S3();
const S3_BUCKET_NAME = 'agqr-recorder';

/**
 * @return {Object} list of objects in bucket
 */
module.exports.listObjects = () => {
    const params = {
        Bucket: S3_BUCKET_NAME
    };
    return s3.listObjects(params).promise();
};

/**
 * @param {string} key
 * @param {string} [range]
 * @return {ReadStream} Data stream from specified file
 */
module.exports.getObjectAsStream = (key, range) => {
    return new Promise((resolve, reject) => {
        let params = {
            Bucket: S3_BUCKET_NAME,
            Key: key
        };
        if (range) {
            params.Range = range;
        }

        const s3Request = s3.getObject(params);
        s3Request.on('error', (error) => {
            reject(error);
        });
        s3Request.on('httpHeaders', (statusCode, headers) => {
            resolve({
                statusCode: statusCode,
                headers: headers,
                stream: s3Request.createReadStream()
            });
        });
        s3Request.send();
    });
};

/**
 * @param {string} filename
 * @return {Object} informations of putted object
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
