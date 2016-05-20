io = require('./io')(),

module.exports = {
  post: function (req, res) {
    io.emit('message', req.body);
    res.send({ok: 1});
  }
};
