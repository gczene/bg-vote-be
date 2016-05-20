
var _server;

module.exports = function (server) {
  if (server) {
    _server = require('socket.io')(server);
  }
  return _server;
};
