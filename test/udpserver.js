'use strict';

const config = require('../config/config');
const dgram = require('dgram');

const udpserver = dgram.createSocket('udp4');
let messageHandler = null;

const getMessageHandler = () => messageHandler;

const setMessageHandler = _messageHandler => (messageHandler = _messageHandler);

udpserver.on('message', message => getMessageHandler()(
  JSON.parse(
    message.toString().slice(
      message.toString().indexOf('}') + 1
    )
  )
));

const listen = callback => udpserver.bind(
  config.udpserver.port,
  config.udpserver.hostname,
  callback
);

module.exports = {
  getMessageHandler,
  setMessageHandler,
  listen
};
