'use strict';

const express = require('express');
const router = express.Router();    // eslint-disable-line

const fs = require('fs');
const s3 = require('../lib/s3');

const convertDateFormat = (todays8) => {
    const year = todays8.slice(0, 4);
    const month = todays8.slice(4, 6);
    const date = todays8.slice(6, 8);

    return year + '/' + month + '/' + date;
};

/*
    top page
*/
router.get('/', (request, response) => {
    s3.listObjects().then((result) => {
        // format title and links
        const objects = [];
        result.Contents.forEach((element) => {
            if (element.Key.match(/^.*\.mp4/)) {
                const key = element.Key.slice(0, -4);
                objects.unshift({
                    title: key.replace(/_/g, ' ').slice(14),
                    date: convertDateFormat(key.slice(1, 9)),
                    video: './' + key + '.mp4',
                    audio: './' + key + '.m4a',
                    thumbnail: './' + key + '.jpg'
                });
            }
        });
        response.render('index', {
            objects: objects
        });
    }).catch((error) => {
        response.send(error);
    });
});

/*
    video & audio stream
*/
router.get(/\/stream\/(.*\.(mp4|m4a))$/, (request, response) => {
    const key = request.params[0];
    const range = request.headers.range;
    const s3Request = s3.getObjectRequest(key, range);
    s3Request.on('error', (error) => {
        response.send(error);
    });
    s3Request.on('httpHeaders', (statusCode, headers) => {
        response.status(statusCode);
        response.set(headers);
    });
    s3Request.createReadStream().pipe(response);
});

/*
    video & audio player page
*/
router.get(/\/(.*\.(mp4|m4a))$/, (request, response) => {
    const key = request.params[0];
    const type = (request.params[1] === 'mp4') ? 'video' : 'audio';
    response.render('player', {
        title: key.replace(/_/g, ' '),
        stream: './stream/' + key,
        type: type
    });
});

/*
    thumbnail
*/
router.get(/\/(.*\.jpg)$/, (request, response) => {
    const key = request.params[0];
    const s3Request = s3.getObjectRequest(key);
    s3Request.on('error', (error) => {
        response.send(error);
    });
    s3Request.on('httpHeaders', (statusCode, headers) => {
        response.status(statusCode);
        response.set(headers);
    });
    s3Request.createReadStream().pipe(response);
});

/*
    config
*/
router.get('/config', (request, response) => {
    const data = fs.readFileSync('./config.json', 'utf8');

    // JSON.parse does unstable behavior when data has empty string
    const config = JSON.parse(data || 'null');

    response.render('config', {
        programs: config.programs
    });
});

module.exports = router;
