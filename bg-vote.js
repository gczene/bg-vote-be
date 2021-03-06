var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('./lib/io')(server);
var PORT = process.env.NODE_ENV === 'development' ? 3000 : 80;
var bodyParser = require('body-parser');
var db = require('./lib/monk');
var releases = require('./lib/releases');


app.all('*', function (req, res, next) {
  if (req.get('Referrer') !== 'http://localhost:4200/') {
    throw 404;
  }

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  next();

});
app.use(bodyParser.json());

app.use(express.static('public'));

app.post('/api/votes', function (req, res) {
  var vote = db.get('votes');
  vote.insert({label: req.body.vote.label, registeredAt: new Date(), active: false, votes: {yes: 0, no: 0}, type: req.body.vote.type}, function (err, doc) {
    if (err) {
      res.send(err);
    } else {
      res.send(doc);
    }
  });
});

app.get('/api/votes', function (req, res) {
  var votes = db.get('votes'),
    query;
  if (req.query.active) {
    query = {active: true};
  } else {
    query = {};
  }
  votes.find(query, function (err, docs) {
    res.send(docs);
  });
});

app.post('/api/votes/:id/vote/:todo', function (req, res) {
  var inc = req.params.todo === 'inc' ? {'votes.yes': 1} : {'votes.no': 1},
    votes = db.get('votes');

  votes.findAndModify({_id: req.params.id}, {$inc: inc}, function (err, doc) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (req.params.todo === 'inc') {
        doc.votes.yes += 1;
      } else {
        doc.votes.no += 1;
      }
      io.emit('vote', {votes: doc.votes});
      res.send(doc);
    }
  });

});

app.post('/socket.io', function (req, res) {
  res.send({});
});
app.put('/api/votes/:id', function (req, res) {
  var votes = db.get('votes'),
    vote = req.body;
  votes.update({}, {$set: {active: false}}, {multi: true}, function (err, result) {
      if (err) {
        res.status(500).send(err);
      } else {
        votes.update({_id: vote._id}, vote, function (err, doc) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.send(vote);
          }
        });
      }
  });
});

app.post('/releases', releases.post);
app.get('/releases', releases.get);

io.on('connection', function(){
  console.log('---> connection');
});

server.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT + '!');
});
