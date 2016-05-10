var express = require('express');
var app = express();
var PORT = process.env.BG_VOTE_PORT || 3000;
var bodyParser = require('body-parser');
var db = require('./lib/monk');

app.use(bodyParser.json());

app.use(express.static('public'));

app.post('/api/votes', function (req, res) {
  var vote = db.get('votes');
  vote.insert({label: req.body.vote, registeredAt: new Date(), active: false}, function (err, doc) {
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

  votes.update({_id: req.params.id}, {$inc: inc}, function (err, doc) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(doc);
    }
  });

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

app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT + '!');
});
