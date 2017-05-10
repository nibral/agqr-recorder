'use strict';

/*
    Express
 */
const express = require('express');
const app = express();

// routing
const index = require('./routes');
app.use('/', index);

// start http server
const listenPort = process.env.PORT || 3000;
app.listen(listenPort, () => {
    console.log('start listening at port %d', listenPort);
});

const scheduler = require('./lib/scheduler');
scheduler.start('45 * * * * *');
