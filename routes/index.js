'use strict';

const express = require('express');
const router = express.Router();

const fs = require('fs');
const s3 = require('../lib/s3');

const convertDateFormat = (todays8) => {
    const year = todays8.slice(0, 4);
    const month = todays8.slice(4, 6);
    const date = todays8.slice(6, 8);

    return `${year}/${month}/${date}`;
};

/*
    root
*/
router.get('/', (request, response) => {
    response.send('it works!');
});

/*
    recorded programs
*/
router.get('/programs', (request, response) => {
    s3.listObjects().then((result) => {
        // format title and links
        const programs = [];
        result.Contents.forEach((element) => {
            if (element.Key.match(/^.*\.mp4/)) {
                const key = element.Key.slice(0, -4);
                // add element to the beginning of an array
                programs.unshift({
                    title: key.replace(/_/g, ' ').slice(14),
                    date: convertDateFormat(key.slice(1, 9)),
                    key,
                    video: `streams/${key}.mp4`,
                    audio: `streams/${key}.m4a`,
                    thumbnail: `thumbnails/${key}.jpg`,
                });
            }
        });
        response.json(programs);
    }).catch((error) => {
        console.error(error);
        response.status(500).send('failed to get programs');
    });
});

/*
    video & audio stream
*/
router.get('/streams/:key', (request, response) => {
    try {
        const key = request.params.key;
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
    } catch (error) {
        console.error(error);
        response.status(500).send('failed to get stream');
    }
});

/*
    thumbnail
*/
router.get('/thumbnails/:key', (request, response) => {
    try {
        const key = request.params.key;
        const s3Request = s3.getObjectRequest(key);
        s3Request.on('error', (error) => {
            response.send(error);
        });
        s3Request.on('httpHeaders', (statusCode, headers) => {
            response.status(statusCode);
            response.set(headers);
        });
        s3Request.createReadStream().pipe(response);
    } catch (error) {
        console.error(error);
        response.status(500).send('failed to get thumbnail');
    }
});

/*
    config
*/
router.get('/config', (request, response) => {
    try {
        const data = fs.readFileSync('./config.json', 'utf8');

        // JSON.parse does unstable behavior when data has empty string
        const config = JSON.parse(data || 'null');

        response.json(config.programs);
    } catch (error) {
        console.error(error);
        response.status(500).send('failed to get config');
    }
});

/*
    delete program
*/
router.delete('/programs/:key', (request, response) => {
    try {
        // delete video,audio and thumbnail
        s3.deleteObject(`${request.params.key}.mp4`);
        s3.deleteObject(`${request.params.key}.m4a`);
        s3.deleteObject(`${request.params.key}.jpg`);

        response.end();
    } catch (error) {
        console.error(error);
        response.status(500).send('failed to delete');
    }
});

module.exports = router;
