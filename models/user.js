var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

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

//mongoose.connect('mongodb://localhost/pubg');

var db = mongoose.connection;

var GameConnectionSchema = mongoose.Schema({
  game: {
    type: String
  },
  username:{
    type: String
  }
});

//User Schema
var UserSchema = mongoose.Schema({
  username: {
    type: String,
    index: true
  },
  password: {
    type: String
  },
  email: {
    type: String
  },
  games: [GameConnectionSchema]
});

var User = module.exports = mongoose.model('User', UserSchema);
var GameConnection = module.exports = mongoose.model('GameConnection', GameConnectionSchema);

module.exports.getUserById = function(id, callback){
  User.findById(id).exec(callback);
}

module.exports.getUserByUsername = function(username, callback){
  User.findOne({username: username}, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
  bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    callback(null, isMatch);
  });
}

module.exports.addGameConnection = function(id, gameConnection, callback){
  User.findOne({'games.game': gameConnection.game}).exec(function(err, doc){
    if(doc)
      callback({message: 'This record allready exists'})
    else{
      User.updateOne({_id:id}, {$push: {games: gameConnection}}).exec(function(err){
        if (err) throw err;
        callback();
      });
    }
  });
}

module.exports.createUser = function(newUser, callback){
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
      newUser.password = hash;
      newUser.save(callback);
    });
  });
}

module.exports.ensureAuthenticated = function(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
};