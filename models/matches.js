var mongoose = require('mongoose');

const http = require('http');
const nconf = require('nconf');

nconf.argv().env().file('keys.json');

const mongoUser = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
const dbname = nconf.get('mongoDbname');

//let uri = `mongodb://${user}:${pass}@${host}:${port}/${dbname}`;
let uri = 'mongodb+srv://${mongoUser}:${pass}@${host}/${dbname}?retryWrites=true&w=majority';

mongoose.connect(uri);

var db = mongoose.connection;

//User Schema
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
    type: String;
  },
  player: {
    type: [PlayerSchema]
  }
});

var Match = module.exports = mongoose.model('Match', MatchSchema);
var Player = module.exports = mongoose.model('Player', PlayerSchema);

module.exports.addMatch = function(newMatch, callback){
  newMatch.save(callback);
}