'use strict';

/*
    Express
*/
const express = require('express');
const app = express();

// routing
app.get('/', (request, response) => {
    response.send('agqr-recorder');
});

// start http server
const listenPort = process.env.PORT || 3000;
app.listen(listenPort, () => {
    console.log('start listening at port %d', listenPort);
});
