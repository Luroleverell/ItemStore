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
var scopes = 'identify';
var prompt = 'consent'

var callbackURI = 'https://item-store.herokuapp.com/user/discord';
//var callbackURI = 'http://localhost:3000/user/discord';

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
    'redirect_uri': callbackURI,
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
              req.session.user = {user: doc, characters: characters, admin: false};
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
  req.session.user = null;
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


router.get('/character/add/:character/:characterClass/:server', function(req, res, next){

  if(req.session.user){
    let newCharacter = new Character({
      name: req.params.character,
      class: req.params.characterClass,
      server: req.params.server,
      discordId: req.session.user.user.discordId
    })
    
    Character.add(newCharacter, function(err, charList){
      if(err){
        res.json(err);
      }else{
        req.session.user.characters.push(charList);
        res.send(charList);
      }
    })
  }else{
    res.json([])
  }
});

router.get('/character/delete/:character/:server', function(req, res, next){
  if(req.session.user){
    character = req.session.user.characters.filter(function(el){
      console.log(el.name+' '+req.params.character+' '+el.server+' '+req.params.server)
      return (el.name == req.params.character) && (el.server == req.params.server)
    });
    if(character.length>0){
      Character.delete(character[0]._id, function(err, doc){
        res.json(doc);
      });
    }else{
      console.log('Fant ikke')
    }
  }else{
  }
});

router.get('/character/get', function(req, res, next){
  if(req.session.user){
    Character.getCharacters(req.session.user.user, function(err, charList){
      req.session.user.characters = charList;
      res.json(charList);
    })
  }else{
    res.json([]);
  }
});


router.get('/guild/add/:guildName/:server', function(req, res, next){
  let guildName = req.params.guildName;
  let server = req.params.server;
  if(guildName && req.session.user.user && server){
    let newGuild = new Guild({
      guildName: guildName,
      server: server
    });
    Guild.add(newGuild, function(err, guild){
      if(err){
        next()
      }else{
        Guild.addAdmin(guild._id, req.session.user.user._id, function(err, doc){
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

router.get('/guild/getByAdmin', function(req, res, next){  
  if(req.session.user){
    Guild.getGuildByAdmin(req.session.user.user._id, function(err, doc){
      req.session.user.admin = true;
      res.json(doc);
    });
  }else{
    next;
  }
});

router.get('/guild/admin/add/:guildName/:discordId', function(req, res, next){
  if(req.session.user){
    Guild.getGuildByAdmin(req.session.user.user._id, function(err, guilds){
      guild = guilds.find(function(el){
        return (el.guildName == req.params.guildName);
      });
      User.getByDiscordId(req.params.discordId, function(err, newAdmin){
        if(newAdmin){
          Guild.addAdmin(guild._id, newAdmin._id, function(err, doc){
            res.json(doc);
          })
        }else{
          res.json({error: 'No such user'});
        }
      })
    });
  }
});


router.get('/guild/price/add/:guildName/:server/:itemNr/:price', function(req, res, next){
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

router.get('/guild/price/update/:guildId/:itemId/:price', function(req, res, next){
  let guildId = req.params.guildId;
  if(req.session.user.user){
    Guild.getById(guildId, function(err, guild){
      if(guild){
        let isAdmin = guild.admin.find(function(el){
          return el == req.session.user.user._id;
        });
        if(isAdmin){
          GuildPrice.update(guildId, 
            req.params.itemId, 
            req.params.price, 
            function(err, doc){
              res.json(doc);
          });
        }else{
          res.json([]);
        }
      }else{
        res.json([]);
      }
    });
  }else{
    res.json([]);
  }
});

router.get('/bid/get/:guildId/:itemId', function(req, res, next){
  Bid.get(req.params.guildId, req.params.itemId, function(err, bidList){
    res.json(bidList);
  });
});

router.get('/bid/add/:guildId/:itemId/:characterId/:bid', function(req, res, next){
  Bid.add(req.params.guildId, req.params.itemId, req.params.characterId, req.params.bid, function(err, doc){
    res.json(doc);
  });
});

router.get('/bid/get/:characterId', function(req, res, next){
  Bid.getAll(req.params.characterId, function(err, doc){
    res.json(doc);
  });
});

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
  callbackURL: callbackURI,
  scope: scopes,
  prompt: prompt
}, function(accessToken, refreshToken, profile, done){
    /*console.log('--initial call--')
    return done(err, profile);*/
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
