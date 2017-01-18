'use strict';

const assert = require('assert');
const config = require('../config/config');
const request = require('request-promise');
const udpserver = require('./udpserver');
const util = require('util');

describe('X-Ray bug proof of concept', () => {
  before(callback => udpserver.listen(callback));

  it('1 inbound request', callback => {
    udpserver.setMessageHandler(
      message => {
        assert.ok(util.isUndefined(message.subsegments));
        callback();
      }
    );

    request.get(`http://${config.webserver.hostname}:${config.webserver.port}/1-in`);
  });

  it('1 inbound request, 1 outbound request', callback => {
    udpserver.setMessageHandler(
      message => {
        assert.ok(util.isArray(message.subsegments));
        assert.strictEqual(message.subsegments.length, 1);
        callback();
      }
    );

    request.get(`http://${config.webserver.hostname}:${config.webserver.port}/1-in-1-out`);
  });

  it('1 inbound request, 2 outbound requests', callback => {
    udpserver.setMessageHandler(
      message => {
        assert.ok(util.isArray(message.subsegments));
        assert.strictEqual(message.subsegments.length, 2);
        callback();
      }
    );

    request.get(`http://${config.webserver.hostname}:${config.webserver.port}/1-in-2-out`);
  });

  it('bug 1', function (callback) {
    this.timeout(1000 * 5);

    udpserver.setMessageHandler(
      message => {
        assert.ok(util.isArray(message.subsegments));
        assert.strictEqual(message.subsegments.length, 1);
        assert.strictEqual(message.subsegments[0].name, 'httpbin.org');
        callback();
      }
    );

    request.get(`http://${config.webserver.hostname}:${config.webserver.port}/bug1`);
  });

  it('bug 2', function (callback) {
    this.timeout(1000 * 5);

    udpserver.setMessageHandler(
      message => {
        assert.ok(util.isArray(message.subsegments));
        assert.strictEqual(message.subsegments.length, 2);
        callback();
      }
    );

    request.get(`http://${config.webserver.hostname}:${config.webserver.port}/bug2`);
  });
});
