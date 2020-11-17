var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var expressValidator = require('express-validator');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer({ dest: 'uploads/' })
var flash = require('express-flash-messages');
var bcrypt = require('bcryptjs');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var db = mongoose.connection;
var http = require('http');
var nconf = require('nconf');

var User = require('./models/user');
var index = require('./routes/index');
var users = require('./routes/users');
var tournaments = require('./routes/tournaments');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();
var sessionStore = new session.MemoryStore;

nconf.argv().env().file('keys.json');
//nconf.argv().env().file('custom','PUBG leaderboard-6d7d0557edcd.json');

const user = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
const dbname = nconf.get('mongoDbname');

//let uri = 'mongodb://'+user+':'+pass+'@'+host+':'+port+'/'+dbname;
let uri = 'mongodb+srv://'+user+':'+pass+'@'+host+'/'+dbname+'?retryWrites=true&w=majority';
//mongodb+srv://lirion:<password>@pubg.mbefo.mongodb.net/pubg?retryWrites=true&w=majority

mongoose.connect(uri, { useNewUrlParser: true }).catch(function(err){
  if (err) throw err;
});

//mongoose.connect('mongodb://localhost/pubg');

var db = mongoose.connection;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(expressValidator());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static('public'))
//app.use(express.static('./public'));

//Handle sessions

app.use(cookieParser('secret'));
app.use(session({
  secret: 'that secret',
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({mongooseConnection: mongoose.connection}),
  unset: 'destroy'
  /*,
  cookie: {
    sameSite: 'none'
  }*/
}));

//Handle passport
app.use(passport.initialize());
app.use(passport.session());

//Flash messages
app.use(flash());
app.use(function(req, res, next){
  res.locals.flash = req.session.flash;
  next();
})

app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

app.use('/', index);
app.use('/users', users);
app.use('/tournaments', tournaments);
//app.use('/events', events);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


//Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value){
    var namespace = param.split('.')
    , root = namespace.shift()
    , formParam = root;
    
    while(namespace.length){
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg : msg,
      value : value
    };
  }
}));

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});

module.exports = app;
