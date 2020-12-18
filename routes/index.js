var express = require('express');
var router = express.Router();
var Item = require('../models/item');
var User = require('../models/user');
var GuildPrice = require('../models/guildPrice');
var multer = require('multer');
var session = require('express-session')
var upload = multer();
var fs = require('fs');
var request = require('request');
var fetch = require('node-fetch');


/* GET home page. */
router.get('/', function(req, res, next) {
  let user = req.session.user;
  res.render('item', {user:user});
});

router.get('/item', function(req, res){
  res.render('item');
});

router.get('/items', function(req, res){
  let loggedIn = (req.session.user ? true : false);
  GuildPrice.getItems(function(err, itemList){
    res.json({itemList: itemList, user: req.session.user});
  });
});

router.post('/item', [upload.fields([])], function(req, res){
  let id = req.body.id;
  let name = req.body.name;
  let drop = req.body.drop;
  let slot = req.body.slot;
  
  var newItem = new Item({
    id:id,
    name:name,
    drop:drop,
    slot:slot
  });
  
  Item.add(newItem, function(){
    Item.getItems(function(err, items){
      res.render('item', {items:items});
    });
  });
});

module.exports = router;

