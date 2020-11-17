var mongoose = require('mongoose');
var Match = require('../public/javascripts/match.js');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var https = require('https');
var zlib = require('zlib');
var request= require('request');

const http = require('http');
const nconf = require('nconf');

var User = require('../models/user');

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

//mongoose.connect('mongodb://localhost/pubg');

var db = mongoose.connection;

//Tournament Schema
var ItemSchema = mongoose.Schema({
  id: {
    type: Number, 
    index: true
  },
  name: {type:String},
  drop: {type:String},
  slot: {type:String}
});

var Item = module.exports = mongoose.model('Item', ItemSchema);

module.exports.add = function(item, callback){
  item.save(callback);
}

module.exports.getItems = function(filter, callback){
  let f = filter;
  if(filter=='null'){
    f = '';
  }
  Item.find({
    $or:[
      {name:{ $regex: f, $options: "i" }},
      {slot:{ $regex: f, $options: "i" }},
      {drop:{ $regex: f, $options: "i" }},
      {zone:{ $regex: f, $options: "i" }}
    ]
  }).exec(callback);
}
