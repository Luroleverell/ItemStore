/*var mongoose = require('mongoose');
var Scoreboard = require('../public/javascripts/match.js');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var https = require('https');
var zlib = require('zlib');
var request= require('request');
var SHARD_PC_EU = "pc-eu";
var API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjYjU1OGQyMC0xOTJiLTAxMzYtZTgzYi0wMzMxODI1NzdmN2YiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNTIyNzMyNDYyLCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImN1c3RvbXNlcnZlcmluZm8iLCJzY29wZSI6ImNvbW11bml0eSIsImxpbWl0IjoxMH0.nwJ14akD9h9NrCIMEJk57qdkaYCB-hoGXMZnxlc3zNw";

mongoose.connect('mongodb://localhost/pubg');

var db = mongoose.connection;

//TourMatch Schema
var PlayerSchema = mongoose.Schema({
  playername: {
    type: String
  },
  kills: {
    type: Number
  }
})
var MatchSchema = mongoose.Schema({
  matchId: {
    type: String,
    index: true
  },
  rank: {
    type: Number
  },
  teamId: {
    type: Number
  },
  teamName: {
    type: String
  },
  player: {
    type: [PlayerSchema]
  }
});
/*var TourMatchSchema = mongoose.Schema({
  tournamentId: {
    type: String
  },
  match:{
    type: [MatchSchema]
  }
});*/

/*var TourMatch = module.exports = mongoose.model('TourMatch', TourMatchSchema);
var Match = module.exports = mongoose.model('Match', MatchSchema);
var Player = module.exports = mongoose.model('Player', PlayerSchema);

module.exports.addTourMatch = function(newTourMatch, matchId callback){
  if(matchId){
    getMatchById(matchId, function(match){
      newTourMatch.save(callback);
    })
  };
}

module.exports.getTourMatchesById = function(id){
  if(id)
    return new Promise(function(resolve, reject){
      TourMatch.find({tournamentId: id}).exec(function(err, doc){
        if (err) return reject(err)
        else return resolve(doc)
      });
    })
}

module.exports.remove = function(tourId, matchId, callback){
  return new Promise(function(resolve, reject){
    TourMatch.deleteOne({matchId: matchId, tournamentId: tourId}).exec(function(err){
      if (err) return reject(err)
      else return resolve()
    })
  })
}

function getMatchById(matchId, callback){
  let url= `https://api.playbattlegrounds.com/shards/${SHARD_PC_EU}/matches/${matchId}`;
  fetchData(url, function(res){
    let match = new Match(res);
    //match.scoreboard(document.body);
    //callback(res);
  });
}

function fetchData(url, callback){
  let options = {
    url: url,
    headers: {
      'Authorization': API_KEY,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate'
    },
    encoding: null
  };
  
  request.get(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      let encoding = res.headers['content-encoding']
      if(encoding && encoding.indexOf('gzip')>=0){
        zlib.gunzip(body, function(err, dezipped){
          let json_string = dezipped.toString('utf-8');
          let json = JSON.parse(json_string);
          callback(json);
        });
      }
    }
  }); 
}*/