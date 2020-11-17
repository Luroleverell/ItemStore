var mongoose = require('mongoose');

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var https = require('https');
var zlib = require('zlib');
var request= require('request');
var SHARD_PC_EU = "pc-na";

const http = require('http');
const nconf = require('nconf');

var User = require('../models/user');
var Tournament = require('../models/tournament');

nconf.argv().env().file('keys.json');

const mongoUser = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
const API_KEY = nconf.get('apiKey');
const dbname = nconf.get('mongoDbname');

//let uri = 'mongodb://'+mongoUser+':'+pass+'@'+host+':'+port+'/'+dbname;
let uri = 'mongodb+srv://'+mongoUser+':'+pass+'@'+host+'/'+dbname+'?retryWrites=true&w=majority';

mongoose.connect(uri, { useNewUrlParser: true }).catch(function(err){
  if (err) throw err;
});

var db = mongoose.connection;

//EventSchema
var EventSchema = mongoose.Schema({
  event: {
    type: String,
    index: true
  },
  username: {
    type: String
  },
  settings: {
    placementPoints: [],
    killPoints: 0,
    public: false,
    teamList: [],
    keepTeamId: false,
    eventStatus: false
  },
  tournaments: []
});

var Event = module.exports = mongoose.model('Event', EventSchema);

module.exports.createEvent = function(newEvent, callback){
  if (newEvent.event)
    newEvent.save(callback);
}

module.exports.getEventByUsername = function(username){
  if(username){
    return new Promise(function(resolve, reject){
      Event.find({username: username}).exec(function(err, doc){
        if (err) return reject(err)
        else return resolve(doc)
      });
    });  
  }
}

module.exports.getEventById = function(id){
  if(id){
    return new Promise(function(resolve, reject){
      Event.findOne({_id: id}).exec(function(err, doc){
        if (err) return reject(err)
        else return resolve(doc)
      });
    })
  }
}

module.exports.addTournaments = function(eventId, tournamentIds){
  if(eventId && tournamentIds){
    return new Promise(function(resolve, reject){
      Event.updateOne(
        {_id: eventId},
        {$push: {tournaments: {$each: tournamentIds}}}).exec(function(err){
          if(err) return reject(err)
          else return resolve();
        });
    });
  }
}

module.exports.removeTournament = function(eventId, tournamentId){
  return new Promise(function(resolve, reject){
    Event.updateOne({_id:eventId}, {$pull: {tournament: tournamentId}}).exec(function(err){
      Tournament.changeEventStatus(tournamentId, false).then(function(err){
        if (err) return reject(err);
        else return resolve();
      });
    });
  });
}
