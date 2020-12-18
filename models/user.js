var mongoose = require('mongoose');

const http = require('http');
const nconf = require('nconf');

nconf.argv().env().file('keys.json');

const mongoUser = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
const dbname = nconf.get('mongoDbname');

//let uri = 'mongodb://'+mongoUser+':'+pass+'@'+host+':'+port+'/'+dbname;
let uri = 'mongodb+srv://'+mongoUser+':'+pass+'@'+host+'/'+dbname+'?retryWrites=true&w=majority';

mongoose.connect(uri, { useNewUrlParser: true }).catch(function(err){
  if (err) throw err;
});

var db = mongoose.connection;

//User Schema
var UserSchema = mongoose.Schema({
  discordId: {
    type: String,
  }
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.getUserById = function(user, callback){
  if(user){
    User.findById(user._id).exec(callback);
  }
}

module.exports.getByDiscordId = function(user, callback){
  User.findOne({discordId: user.discordId}).exec(callback);
}

module.exports.getUserByUsername = function(username, callback){
  User.findOne({username: username}, callback);
}

module.exports.add = function(user, callback){
  console.log(user.discordId)
  User.count({discordId: user.discordId}, function(err, count){
    console.log(count)
    if(count == 0){
      user.save(callback);
    }
  }).exec(callback);
}

