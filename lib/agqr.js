'use strict';

const parseString = require('xml2js').parseString;
const request = require('request-promise');

/**
 * @return {string} url of streaming server
 */
module.exports.getStreamUrl = () => {
    return new Promise((resolve, reject) => {
        const streamListUrl =
            'http://www.uniqueradio.jp/agplayerf/getfmsListHD.php';
        request(streamListUrl).then((response) => {
            parseString(response, (parseError, parseResult) => {
                if (parseError) {
                    reject(parseError);
                }

                // return first element of streaming server list
                const serverinfo = parseResult.ag.serverlist[0].serverinfo[0];
                const server = serverinfo.server[0].match(/^.*(rtmp.*)$/)[1];
                const app = serverinfo.app[0];
                const stream = serverinfo.stream[0];
                const streamUrl = server + '/' + app + '/' + stream;
                resolve(streamUrl);
            });
        }).catch((error) => {
            reject(error);
        });
    });
};
