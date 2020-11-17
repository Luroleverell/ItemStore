var express = require('express');
var router = express.Router();
var Item = require('../models/item');
var multer = require('multer');
var upload = multer();
var fs = require('fs');
var request = require('request');
var fetch = require('node-fetch');


/* GET home page. */
router.get('/', function(req, res, next) {
  Tournament.getPublicTournaments().then(function(tournaments){
    res.render('index', {tournaments: tournaments, buttonActive: 'Tournaments'});
  })
});

router.get('/item', function(req, res){
  res.render('item');
});

router.get('/items/:filter', function(req, res){
  let code = req.query.code;
  if(code){
    
  }
  let filter = req.params.filter;
  Item.getItems(filter, function(err, items){
    res.json(items);
  });
});

router.post('/item', [upload.fields([])], function(req, res){
  let id = req.body.id;
  let name = req.body.name;
  let drop = req.body.drop;
  let slot = req.body.slot;
  
  console.log(id);
  
  var newItem = new Item({
    id:id,
    name:name,
    drop:drop,
    slot:slot
  });
  
  Item.add(newItem, function(){
    Item.getItems(function(err, items){
      res.render('item',{items:items});
    });
  });
});

module.exports = router;

