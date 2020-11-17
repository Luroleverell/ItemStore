var mongoose = require('mongoose');
var Match = require('../public/javascripts/match.js');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var https = require('https');
var zlib = require('zlib');
var request = require('request');
var SHARD = 'steam';

const http = require('http');
const nconf = require('nconf');

var User = require('../models/user');
//var Telemetry = require('../models/telemetry');

nconf.argv().env().file('keys.json');

const mongoUser = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
const API_KEY = nconf.get('apiKey');
const dbname = nconf.get('mongoDbname');

const {Storage} = require('@google-cloud/storage');
const storage = new Storage({
  projectId: 'pubg-leaderboard-207106',
  //credentials: JSON.parse(nconf.get('GCS_KEYFILE'))
});
const myBucket = storage.bucket('pubgleague');

const fs = require('fs');


//let uri = 'mongodb://'+mongoUser+':'+pass+'@'+host+':'+port+'/'+dbname;
let uri = 'mongodb+srv://'+mongoUser+':'+pass+'@'+host+'/'+dbname+'?retryWrites=true&w=majority';

mongoose.connect(uri, { useNewUrlParser: true }).catch(function(err){
  if (err) throw err;
});

//mongoose.connect('mongodb://localhost/pubg');

var db = mongoose.connection;

//Tournament Schema
var TournamentSchema = mongoose.Schema({
  tournament: {
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
    eventStatus: false,
    leaderboardLevel: '',
    individualKills: false
  },
  matches: {}
});

var Tournament = module.exports = mongoose.model('Tournament', TournamentSchema);

module.exports.createTournament = function(newTournament, callback){
  if (newTournament.tournament)
    newTournament.save(callback);
}

module.exports.getTournamentByUsername = function(username){
  if(username)
    return new Promise(function(resolve, reject){
      Tournament.find({username: username}).exec(function(err, doc){
        if (err) return reject(err)
        else return resolve(doc)
      });
    });
}

module.exports.getTournamentById = function(id){
  return new Promise(function(resolve, reject){
    if(id){
      Tournament.find({_id: {$in: id}}).exec(function(err, doc){
        if (err) return reject(err)
        if(doc.length>1){
          return resolve(doc)
        }else{
          return resolve(doc[0])
        }
      });
    }else{
      return resolve([]);
    }
  });
}

module.exports.getPublicTournaments = function(){
  return new Promise(function(resolve, reject){
    Tournament.find({'settings.public': true}).exec(function(err, doc){
      if (err) return reject(err)
      else return resolve(doc)
    })
  })
}

module.exports.changePublic = function(tournamentId, newPublic){
  return new Promise(function(resolve, reject){
    Tournament.updateOne({_id:tournamentId}, {$set: {'settings.public': newPublic}}).exec(function(err){
      if (err) return reject(err)
      else return resolve()
    });
  });
}

module.exports.changeEventStatus= function(tournamentId, newStatus){
  return new Promise(function(resolve, reject){
    Tournament.updateOne({_id:tournamentId}, {$set: {'settings.eventStatus': newStatus}}).exec(function(err){
      if (err) return reject(err)
      else return resolve()
    });
  });
}

module.exports.changeKeepTeamId = function(tournamentId, newValue){
  return new Promise(function(resolve, reject){
    let index;
    if(newValue){
      Tournament.getTournamentById(tournamentId).then(function(tournament){
        tournament.settings.keepTeamId = newValue;
        tournament.matches.forEach(function(m){
          m.team.forEach(function(t){
            if(!(t.teamName == '')){
              index = getIndexByProperty(tournament.settings.teamList, 'teamId', t.teamId)
              if(index = -1){
                tournament.settings.teamList.push({teamId: t.teamId, teamName: t.teamName});
              }else{
                tournament.settings.teamList[index].teamName = t.teamName;
              }
            }
          });
        });
        tournament.matches.forEach(function(m){
          m.team.forEach(function(t){
            index = getIndexByProperty(tournament.settings.teamList, 'teamId', t.teamId);
            t.teamName = tournament.settings.teamList[index].teamName;
          })
        })
        Tournament.replaceOne({_id: tournamentId}, tournament, function(err, doc){
          if(err) return reject(err);
          else return resolve();
        });
      });
    }else{
      Tournament.updateOne({_id: tournamentId}, {$set: {'settings.keepTeamId': newValue}}).exec(function(err, doc){
        if (err) return reject(err)
        else return resolve();
      });
    }
  })
}

module.exports.changeLeaderboardLevel = function(tournamentId, newValue){
  return new Promise(function(resolve, reject){
    Tournament.updateOne({_id: tournamentId}, {$set: {'settings.leaderboardLevel': newValue}}).exec(function(err){
      if (err) return reject(err)
      else return resolve();
    });
  })
}

module.exports.changePoint = function(tournamentId, index, newPoint){
  return new Promise(function(resolve, reject){
    let setter = {};
    if(index == 'killPoints'){
      Tournament.updateOne({_id: tournamentId}, {$set: {'settings.killPoints': newPoint}}).exec(function(err){
        if(err) return reject(err)
        else return resolve();
      })
    }else{
      setter['settings.placementPoints.'+index] = parseInt(newPoint);
      Tournament.updateOne({_id: tournamentId}, {$set: setter}).exec(function(err){
        if(err) return reject(err)
        else return resolve();
      })
    }
  })
}

module.exports.changeTeamName = function(tournamentId, matchId, teamIndex, newTeamName, teamId){
  return new Promise(function(resolve, reject){
    Tournament.getTournamentById(tournamentId).then(function(tournament){
      
      let setter ={};
      setter['matches.$.team.'+teamIndex+'.teamName'] = newTeamName
      Tournament.updateOne(
        {_id: tournamentId, 'matches.matchId': matchId },
        {$set: setter}
      ).exec(function(err){
        if (err) return reject(err)   
        
        if(tournament.settings.keepTeamId){
          let index;
          tournament.matches.forEach(function(match){
            index = getIndexByProperty(match.team, 'teamId', teamId);
            if(index > -1){
              match.team[index].teamName = newTeamName;
            }
          })
          
          index = getIndexByProperty(tournament.settings.teamList, 'teamId', teamId);
          if(index > -1){
            tournament.settings.teamList[index].teamName = newTeamName;
          }else{
            tournament.settings.teamList.push({teamId: teamId, teamName: newTeamName});
          }
          Tournament.replaceOne({_id: tournamentId}, tournament, function(err, doc){
            if(err) return reject(err);
            else return resolve();
          });
        }else{
          return resolve();
        }
      });
    })
  });
}

module.exports.addMatch = function(tournamentId, matchId, callback){
  if(matchId && tournamentId){
    Tournament.getTournamentById(tournamentId).then(function(tournament){
      if(tournament.settings.keepTeamId){
        teamNameList = tournament.settings.teamList;
      }else{
        teamNameList = [''];
      }
      getMatchById(matchId, {teamNameList: teamNameList}, function(match){
        Tournament.findOne({_id:tournamentId , 'matches.matchId': matchId}).exec(function(err, doc){
          if(doc){
            callback(true);
          }else{
            Tournament.updateOne({_id:tournamentId}, {$push: {matches: match}}).exec(function(err){
              if (err) throw err
              //fetchDataApi(match.telemetry, {gzip: true}, function(res){
                //let urlArr = match.telemetry.split('/')
                //let name = urlArr[urlArr.length-1];
                //let file = myBucket.file('telemetry/' + name + '.gz');

                //res.pipe(file.createWriteStream())
                  //.on('finish', function(){
                    callback();
                  //});
              //});
            });
          }
        });
      });
    });
  }
}

module.exports.getTelemetry = function(telemetryUrl, callback){
  /*let url = 'telemetry/'+telemetryUrl+'.json.gz';
  let file = myBucket.file(url);*/
  let data = '';
  
  if(file){
    file.createReadStream()
      .pipe(zlib.createGunzip())
      .on('data', function(chunk){
        data += chunk;
      })
      .on('end', function(){
        let json_string = data.toString('utf-8');
        let json = JSON.parse(json_string);
        callback(json);
      });
  }else{
    callback('Error');
  }
}



function getPublicUrl(filename){
  return 'https://storage.googleapis.com/pubgleague/'+filename;
}

module.exports.removeTourMatch = function(tournamentId, matchId, callback){
  if(tournamentId){
    if(matchId){
      Tournament.getTournamentById(tournamentId).then(function(tournament){
        if (Array.isArray(tournament.matches)){
          tournament.matches.forEach(function(m){
            if(m.matchId == matchId){
              //let urlArr = m.telemetry.split('/');
              //let name = urlArr[urlArr.length-1];
              //let file = myBucket.file('telemetry/' + name + '.gz');
              
              //file.delete(function(err, apiResponse) {
                Tournament.updateOne(
                    {_id: tournamentId}, 
                    {$pull: {matches: {matchId: matchId}}}
                  ).exec(function(err){
                    callback(err);
                  });
              //});
            }
          });
        }          
      });
    }else{
      Tournament.remove(
          {_id: tourId}
        ).exec(function(err){
            callback(err);
        });
    }
  }
}

module.exports.getMatchesByPlayername = function(playername, callback){
  let url = 'https://api.playbattlegrounds.com/shards/steam/players?filter[playerNames]='+playername;
  fetchDataApi(url,{gzip: false}, function(res){
    callback(res);
  });
}

module.exports.getMatch = function(matchId, callback){
  getMatchById(matchId, {pure: true}, function(match){
    callback(match);
  });
}

module.exports.testBucket = function(){
  /*return new Promise(function(resolve, reject){
    let image = getPublicUrl('matchpoint.png')
    resolve(image);
  });*/
  myBucket.getFiles({
    versions: true
  }, function(err, files) {
    files.forEach(function(file){
      console.log(file.metadata.name);
    });
  });
  
  const file = myBucket.file('my-file');
  const contents = 'This is the contents of the file.';

  file.save(contents, function(err) {
    if (!err) {
      console.log('success!');
    }
  });
    
  /*return new Promise(function(res, rej){
    res(myBucket);
  });*/
}

function getMatchById(matchId, options, callback){
  let url= 'https://api.playbattlegrounds.com/shards/steam/matches/'+matchId;
  fetchDataApi(url, {gzip: false}, function(res){
    if(options.pure == true){
      callback(res);
    }else{
      let match = new Match(res, options.teamNameList);
      callback(match.pullMatch);
    }
  });
}

function fetchDataApi(url, inputOptions, callback){
  let options = {
    url: url,
    headers: {
      'Authorization': API_KEY,
      'Accept': 'application/vnd.api+json',
      'Accept-Encoding': 'gzip, deflate'
    },
    encoding: null
  };
  
  if(inputOptions.gzip == true){
    callback(
      request.get(options, function(err, res, body){
        
      })
    );
  }else{
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
}

function getIndexByProperty(data, key, value) {
  for (var i = 0; i < data.length; i++) {
    if (data[i][key] == value) {
      return i;
    }
  }
  return -1;
}


