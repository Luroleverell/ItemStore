var mongoose = require('mongoose');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var https = require('https');
var request= require('request');
var Guild = require('../models/guild')
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
var GuildPriceSchema = mongoose.Schema({
  guildId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Guild'},
  itemId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Item'},
  price: {type:Number}
});

var GuildPrice = module.exports = mongoose.model('GuildPrice', GuildPriceSchema);

module.exports.add = function(guildName, server, itemNr, startPrice, callback){
  Guild.findOne({guildName:guildName}, function(err, guild){
    Item.findOne({id:itemNr}, function(error, item){
      new GuildPrice({
        guildId: guild._id,
        itemId: item._id,
        price: startPrice}).save(callback);
    });
  });
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


module.exports.getItems = function(callback){
  GuildPrice.find()
    .populate('guildId')
    .populate('itemId').exec(callback);
}
