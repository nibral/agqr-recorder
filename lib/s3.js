'use strict';

const fs = require('fs');
const path = require('path');

const AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-1';
const s3 = new AWS.S3();
const S3_BUCKET_NAME = 'agqr-recorder';

/**
 * @param {string} key
 * @return {Object} Promise object of delete request
 */
module.exports.deleteObject = (key) => {
    const params = {
        Bucket: S3_BUCKET_NAME,
        Key: key
    };

    const deleteRequest = s3.deleteObject(params);
    deleteRequest.send();

    return deleteRequest.promise();
};

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
 */
module.exports.getObjectRequest = (key, range) => {
    let params = {
        Bucket: S3_BUCKET_NAME,
        Key: key
    };
    if (range) {
        params.Range = range;
    }

    return s3.getObject(params);
};

/**
 * @param {string} filename
 * @return {Object} Information of uploaded file
 */
module.exports.upload = (filename) => {
    return new Promise((resolve, reject) => {
        // read file as Readable Stream
        const fileStream = fs.createReadStream(filename);

        // upload to S3
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: path.basename(filename),
            Body: fileStream
        };
        s3.upload(params, (error, data) => {
            if (error) {
                reject(error);
            }
            resolve(data);
        });
    });
};
