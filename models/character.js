var mongoose = require('mongoose');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var https = require('https');
var request= require('request');

const http = require('http');
const nconf = require('nconf');

nconf.argv().env().file('keys.json');

const mongoUser = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
const API_KEY = nconf.get('apiKey');
const dbname = nconf.get('mongoDbname');
const fs = require('fs');

//let uri = 'mongodb://'+mongoUser+':'+pass+'@'+host+':'+port+'/'+dbname;
let uri = 'mongodb+srv://'+mongoUser+':'+pass+'@'+host+'/'+dbname+'?retryWrites=true&w=majority';

mongoose.connect(uri, { useNewUrlParser: true }).catch(function(err){
  if (err) throw err;
});

var db = mongoose.connection;

//Tournament Schema
var CharacterSchema = mongoose.Schema({
  name: {type:String},
  class: {type:String},
  server: {type:String},
  discordId: {type:String}
});

var Character = module.exports = mongoose.model('Character', CharacterSchema);

module.exports.add = function(character, callback){
  Character.count({name: character.name}, function(err, count){
    if(count == 0){
      character.save(callback);
    }else{
      callback('Charactername is taken for this server','');
    }
  })
}

module.exports.getCharacters = function(user, callback){
  if(user){
    Character.find({
      discordId: user.discordId
    }).exec(callback);
  }
}

