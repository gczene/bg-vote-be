var io = require('./io')(),
  http = require('http');

module.exports = {
  post: function (req, res) {
    io.emit('message', req.body);
    res.send({ok: 1});
  },
  get: function (req, res) {
    return http.get({
      host: 'notmagic.org.uk',
      port: 3000,
      path: '/releases'
    }, function (response) {
      var body = '';
      response.on('data', function (chunk) {
        body += chunk;
      });
      response.on('end', function () {
        var parsed = JSON.parse(body);
        res.send(parsed);
      });
    });
  }
};
