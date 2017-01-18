'use strict';

const config = require('../config/config');

process.env.XRAY_DEBUG_MODE = 1;
process.env.XRAY_TRACING_NAME = 'xray-bug-poc';
process.env.XRAY_TRACING_DEFAULT_NAME = 'xray-bug-poc';

const AWSXRay = require('aws-xray-sdk');
const http = require('http');

require('aws-xray-sdk/lib/segment_emitter').setDaemonAddressAndPort(
  config.udpserver.hostname,
  config.udpserver.port
);

AWSXRay.captureHTTPs(http);

const express = require('express');
const request = require('request-promise');

const webserver = express();

webserver.use(AWSXRay.express.openSegment());

webserver.get('/1-in', (req, res) => res
  .status(200)
  .end()
);

webserver.get('/1-in-1-out', (req, res, next) => request
  .get('http://httpbin.org/status/200')
  .then(() => res.status(200).end())
  .catch(next)
);

webserver.get('/1-in-2-out', (req, res, next) => request
  .get('http://httpbin.org/status/200')
  .then(() => new Promise(resolve => setTimeout(resolve, 300)))
  .then(() => request.get('http://httpbin.org/status/200'))
  .then(() => res.status(200).end())
  .catch(next)
);

webserver.get('/bug1', (req, res, next) => {
  const req1 = http.request({ hostname: 'httpbin.org', path: '/status/200' }, res1 => {
    res1.on('data', () => {})
    res1.on('end', () => res.status(200).end());
  });

  req1.end();
});

webserver.get('/bug2', (req, res, next) => {
  const req1 = http.request({ host: 'httpbin.org', path: '/delay/3' }, res1 => {
    res1.on('data', () => {
      const req2 = http.request({ host: 'httpbin.org', path: '/status/200' }, res2 => {
        res2.on('data', () => {})
        res2.on('end', () => {
        });
      });
      
      req2.end();
    })
    res1.on('end', () => {
      res.status(200).end();
    });
  });

  req1.end();
});

webserver.use(AWSXRay.express.closeSegment());

const listen = callback => webserver.listen(
  config.webserver.port,
  config.webserver.hostname,
  callback
);

module.exports = {
  listen
};
