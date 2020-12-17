var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer(); 
var User = require('../models/user');
var Character = require('../models/character');
var Guild = require('../models/guild');
var GuildPrice = require('../models/guildPrice');
var Item = require('../models/item');
var Bid = require('../models/bid');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var LocalStrategy = require('passport-local').Strategy;
var SteamStrategy = require('passport-steam').Strategy;
var DiscordStrategy = require('passport-discord').Strategy;
var passport = require('passport');
var fetch = require('node-fetch');
var DiscordOauth2 = require('discord-oauth2');
var url = require('url');
var {URLSearchParams} = require('url')
var {check, body, validationResult} = require('express-validator/check');
var nconf = require('nconf');
nconf.argv().env().file('keys.json');

const discordClientId = nconf.get('discordClientId');
const discordClientSecret = nconf.get('discordClientSecret');
var steamKey = nconf.get('steamKey');
var scopes = 'identify';
var prompt = 'consent'

var oauth = new DiscordOauth2({
  clientId: discordClientId,
  clientSecret: discordClientSecret,
  redirectUri: 'https://item-store.herokuapp.com/user/discord'
});

router.get('/', passport.authenticate('discord'), function(req,res){
  //res.json();
})

router.get('/discord', function(req, res, next){

  let headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  let url = 'https://discord.com/api/v6/oauth2/token'
  let data =  new URLSearchParams({
    'client_id': discordClientId,
    'client_secret': discordClientSecret,
    'grant_type': 'authorization_code',
    'code': req.query.code,
    'redirect_uri': 'https://item-store.herokuapp.com/user/discord',
    'scope': 'identify'
  })
  fetch(url, { method: 'POST', body: data, headers:headers })
    .then(function(response){
      return response.json();
    })
    .then(function(json){
      let tokenType = json.token_type;
      let accessToken = json.access_token;
      
      fetch('https://discord.com/api/v6/users/@me', {headers: {
        authorization: `${tokenType} ${accessToken}`
      }})
        .then(function(result){
          return result.json();
        })
        .then(function(r){
          let discordId = null;
          
          if(r.username){
            discordId = r.username+'#'+r.discriminator;
          }
          let user = new User({discordId: discordId})
          User.add(user, function(err, doc){
            Character.getCharacters(doc, function(cErr, characters){
              session.user = {user: doc, characters: characters, admin: false};
              res.location('/');
              res.redirect('/');
            });
          });
        });
    });
});

router.get('/login', function(req, res, next) {
  res.render('login',{title: 'Login', buttonActive: 'Log in'});
});

router.post('/login',
  passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'Invalid username or password'}),
  function(req, res) {
    req.flash('success', 'You are now logged in');
    res.redirect('/');
  });

router.get('/logout', function(req, res) {
  req.logout();
  session.user = null;
  res.redirect('/');
});

router.get('/getUser', function(req, res){
  res.json(req.user || '');
})

router.get('/getAdmin', function(req, res, next){

})

router.get('/profile', function(req, res){
  res.location('/');
  res.redirect('/');
})

router.get('/add/:discordId', function(req, res, next){
  let user = new User({discordId: req.params.discordId});
  
  User.add(user, function(err, doc){
    res.json(doc);
  })
})


router.get('/addCharacter/:character/:characterClass/:server', function(req, res, next){

  if(session.user){
    let newCharacter = new Character({
      name: req.params.character,
      class: req.params.characterClass,
      server: req.params.server,
      discordId: session.user.user.discordId
    })
    
    Character.add(newCharacter, function(err, charList){
      if(err){
        res.json(err);
      }else{
        session.user.characters.push(charList);
        res.send(charList);
      }
    })
  }else{
    
  }
});

router.get('/getCharacters/', function(req, res, next){
  if(session.user.user){
    Character.getCharacters(session.user.user, function(err, charList){
      res.json(charList);
    })
  }else{
    res.json([]);
  }
});


router.get('/addGuild/:guildName/:server', function(req, res, next){
  let guildName = req.params.guildName;
  let server = req.params.server;
  if(guildName && session.user.user && server){
    let newGuild = new Guild({
      guildName: guildName,
      server: server
    });
    Guild.add(newGuild, function(err, guild){
      if(err){
        next()
      }else{
        Guild.addAdmin(guild._id, session.user.user._id, function(err, doc){
          Item.getAll(function(itemErr, allItems){
            let itemPriceList = [];
            allItems.forEach(function(item){
              itemPrice = new GuildPrice({itemId: item._id, guildId: guild._id, price: 0})
              itemPriceList.push(itemPrice);
            });
            
            GuildPrice.addList(itemPriceList, function(listErr, list){
              next();
            });
          });
        });
      }
    })
  };
});

router.get('/getGuildList', function(req, res, next){  
  if(session.user){
    Guild.getGuildByAdmin(session.user.user._id, function(err, doc){
      session.user.admin = true;
      res.json(doc);
    });
  }else{
    next;
  }
});


router.get('/addPrice/:guildName/:server/:itemNr/:price', function(req, res, next){
  GuildPrice.add(
    req.params.guildName, 
    req.params.server, 
    req.params.itemNr, 
    req.params.price, 
    function(err, doc){
      res.next(doc);
    }
  )
})

router.get('/updatePrice/:guildId/:itemId/:price', function(req, res, next){
  let guildId = req.params.guildId;
  if(session.user.user){
    console.log('gid:' +guildId)
    Guild.getById(guildId, function(err, guild){
      guild.admin.forEach(function(admin){
        if(admin == session.user.user._id.toString()) {
          GuildPrice.update(
            guildId,  
            req.params.itemId, 
            req.params.price, 
            function(err, doc){
              res.json(doc);
            }
          )
        }
      });
    });
  }else{
    res.location('/');
    res.redirect('/');
  }
});

router.get('/bid/:guildId/:itemId', function(req, res, next){
  Bid.get(req.params.guildId, req.params.itemId, function(err, bidList){
    res.json(bidList);
  });
});

router.get('/bid/add/:guildId/:itemId/:characterId/:bid', function(req, res, next){
  Bid.add(req.params.guildId, req.params.itemId, req.params.characterId, req.params.bid, function(err, doc){
    res.json(doc);
  });
})


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  done(null, id);
  /*User.getUserById(id, function(err, user) {
    done(null, user);
  });*/
});

passport.use(new DiscordStrategy({
  clientID: discordClientId,
  clientSecret: discordClientSecret,
  callbackURL: 'https://item-store.herokuapp.com/user/discord',
  scope: scopes,
  prompt: prompt
}, function(accessToken, refreshToken, profile, done){
    return done(err, profile);
}));

function findUserByUsername(username){
  if(username){
    return new Promise(function(resolve, reject){
      User.findOne({username: username}).exec(function(err, doc){
        if (err) return reject(err)
        if (doc) return reject(new Error('This username is allready taken!'))
        else return resolve(username)
      })
    })
  }
}

function findUserByEmail(email){
  if(email){
    return new Promise(function(resolve, reject){
      User.findOne({email: email}).exec(function(err, doc){
        if (err) return reject(err)
        if (doc) return reject(new Error('This email is allready taken!'))
        else return resolve(email)
      })
    })
  }
}    

function checkAuth(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}



module.exports = router;
