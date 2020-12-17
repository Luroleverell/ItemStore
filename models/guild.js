var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId; 
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var https = require('https');
var request= require('request');
var Character = require('../models/character')
var User = require('../models/user')
var GuildPrice = require('../models/guildPrice')
var Item = require('../models/item')

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
var GuildSchema = mongoose.Schema({
  guildName: {type:String},
  server: {type:String},
  admin: [{
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User'}]
});

var Guild = module.exports = mongoose.model('Guild', GuildSchema);

module.exports.add = function(guild, callback){
  Guild.count({guildName: guild.guildName}, function(err, count){
    if(count == 0){
      guild.save(callback);
    }
  });
}

module.exports.addAdmin =  function(guildId, userId, callback){
  Guild.findByIdAndUpdate(
    guildId,
    {$push: {admin: userId}},
    {new: true, useFindAndModify: false}
  ).exec(callback);
}

module.exports.getGuildByAdmin = function(userId, callback){
  Guild.find({admin: userId}).exec(callback);
}

module.exports.getById = function(guildId, callback){
  Guild.findById(guildId).exec(callback);
}
