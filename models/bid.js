var mongoose = require('mongoose');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var https = require('https');
var request= require('request');
var GuildPrice = require('../models/guildPrice')
var Guild = require('../models/guild');
var Item = require('../models/item')
var Character = require('../models/character')

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
var BidSchema = mongoose.Schema({
  guildId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Guild'},
  itemId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Item'},
  characterId:{
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Character'},
  date: { type: Date},
  bid: {type: Number},
  completed: {type: Date}
});

var Bid = module.exports = mongoose.model('Bid', BidSchema);

module.exports.add = function(guildId, itemId, characterId, bid, callback){
  let query = {guildId: guildId, itemId: itemId, characterId: characterId};
  if(bid == 0) {
    Bid.deleteOne(query).exec(callback);
  }else{
    let update = {bid: bid, date: new Date()};
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };
    Bid.findOneAndUpdate(query, update, options).exec(callback);
  }
}

module.exports.update = function(guildId, itemId, newPrice, callback){
  GuildPrice.updateOne(
    {guildId: guildId, itemId: itemId},
    {price: newPrice}
  ).exec(callback);
}

module.exports.addList = function(itemList, callback){
  itemList.forEach(function(item){
    item.save(callback);
  });
}


module.exports.get = function(guildId, itemId, callback){
  Bid.find({guildId: guildId, itemId: itemId})
    .populate('guildId')
    .populate('itemId')
    .populate('characterId').exec(callback);
}

module.exports.getAll = function(characterId, callback){
  Bid.find({characterId:characterId})
    .populate('guildId')
    .populate('itemId')
    .populate('characterId').exec(callback);
}

