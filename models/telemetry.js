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
var TelemetrySchema = mongoose.Schema({
  matchId: {type:String},
  telemetry: {type:String}
});

var Telemetry = module.exports = mongoose.model('Telemetry', TelemetrySchema);

module.exports.add = function(matchId, url, callback){
  fetchData(url, function(res){
    let urlArr = url.split(res, '/')
    let name = urlArr[urlArr.length-1];
    let newUrl = '../uploads/telemetry/' + name;
    
    fs.writeFile(newUrl, res, function(err){
      if(err) return err;
      else{
        telemetry = new Telemetry({
          matchId: matchId,
          telemetry: newUrl
        });
        telemetry.save(callback);
      }
    })
    
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
}
