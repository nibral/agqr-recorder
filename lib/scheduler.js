'use strict';

const fs = require('fs');
const path = require('path');

let config = null;

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

module.exports.start = () => {
    // load config & watch update
    const configFilename = path.resolve(__dirname, '../config.json');
    loadConfigFromFile(configFilename);
    fs.watch(configFilename, (event) => {
        if (event === 'change') {
            loadConfigFromFile(configFilename);
        }
    });
};
