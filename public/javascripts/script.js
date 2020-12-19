var speed = 100;
var pubgColor = ['#0042a1', '#15931a', '#e16209', '#2096d1', '#4a148c', '#9f2b14', '#486a00', '#c51a56', '#9c6622', '#820045', 
                  '#d5b115', '#4ab3af', '#6b828d', '#f39700', '#37474f', '#e0648e', '#00736d', '#8a4803', '#7fb017', '#854ba1', 
                  '#38b27e', '#88abda', '#e58b65', '#2c276c', '#988e09'];
var xmlns = "http://www.w3.org/2000/svg";
var ligthVector = {x:0, y:1, z:1};
var mainColor;
var mainCOlorLight;
var itemlist;
var filterActive;
var edit = false;

function loadFunction(){
  let filter = document.getElementById('filter');
  let character = document.getElementById('character');
  let characterClass = document.getElementById('characterClass');
  let server = document.getElementById('server');
  
  mainColor = getComputedStyle(document.documentElement).getPropertyValue('--mainColor');
  mainColorLight = getComputedStyle(document.documentElement).getPropertyValue('--mainColorLight');
  
  updateCharacterList();
  updateGuildList();
  getItemlist();
  
  if(filter){
    filter.addEventListener('input', function(e){
      updateItemlist(e.target.value);
    });
    
    filter.addEventListener('focus', function(e){
      filterActive = true;
    });
    
    filter.addEventListener('focusout', function(e){
      filterActive = false;
    });
  }
  filterActive = false;
  
  document.onkeydown = function(evt) {
    evt = evt || window.event;
    if(filterActive){
      if (evt.keyCode == 27) {
        filter.value = '';
        updateItemlist('');
      }
    }
  };
  
  if(character){
    let c = character;
    let cc = characterClass;
    let s = server;

    
    characterClass.addEventListener('change', function(e){
      addCharacter(c, cc, s);
    })
    
    character.addEventListener('change', function(e){
      addCharacter(c, cc, s);
    })
    
    server.addEventListener('change', function(e){
      addCharacter(c, cc, s);
    })
  }
}

function fetchData(url, callback, type){

  let http = new XMLHttpRequest();
  let res = 0;
  http.open('GET', url, true);
  http.setRequestHeader('Accept','application/vnd.api+json');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.status == 200) {
        if (type == 'html'){
          res = http.responseText;
        }else{
          res = JSON.parse(http.responseText);
        }
        callback(res);
      }
    }
  };
  http.send();
}

function ce(element, classes){
  
  let newElement = document.createElement(element);
  
  if(classes){
    if(Array.isArray(classes)){
      classes.forEach(function(c){
        newElement.classList.add(c);
      });
    }else{
      newElement.classList.add(classes);
    }
  }
  
  return newElement;
}

function addCharacter(character, characterClass, server){
  let c = character.value;
  let cc = characterClass.value;
  let s = server.value;
  
  
  if(c && cc !='..' && cc !='' && s !='..' && s !=''){
    let url = '/user/character/add/'+c+'/'+cc+'/'+s
    fetchData(url, function(){
      character.value = '';
      characterClass.value = '';
      server.value = '';
      
      updateCharacterList();
    });
  }
}

function updateCharacterList(){
  let dropdown = document.getElementById('characters');
  let url = '/user/character/get';
  fetchData(url, function(charList){
    if(!charList){
      charList = [];
    }
    printCharList(charList);
    if(dropdown){
      updateCharacterDropDown(dropdown, charList);
    }
  });
}

function updateCharacterDropDown(parent, characters){
  parent.innerHTML = '';
  characters.forEach(function(character){
    let pbidItem = ce('option')
    pbidItem.value = character._id;
    pbidItem.innerText = character.name;
    parent.appendChild(pbidItem);
  })
}

function printCharList(charList){
  let res = document.getElementById('charList');
  if(res){
    res.innerHTML = '';
    res.classList.add('container');
    
    charList.forEach(function(c){
      let row = ce('div',['row','align-items-center']);
      let cell = ce('div', ['col','divLink']);
      cell.innerText = c.name;
      row.appendChild(cell);
      
      cell = ce('div', 'col');
      cell.innerText = c.class;
      row.appendChild(cell);
      
      cell = ce('div', 'col');
      cell.innerText = c.server;
      row.appendChild(cell);
      
      cell = ce('div', 'col-auto');
      let btnGroup = ce('div', 'btn-group');
      let btn = ce('button', ['btn', 'btn-button'])
      btn.innerText = 'Filter bids';
      btn.addEventListener('click', function(e){
        let url = '/user/bid/get/'+c._id;
        fetchData(url, function(doc){
          getItemlistFromBids(doc);
        });
      });
      btnGroup.appendChild(btn);
      
      btn = ce('button', ['btn', 'btn-button'])
      btn.innerText = 'x';
      btn.addEventListener('click', function(e){
        let url = '/user/character/delete/'+c.name+'/'+c.server;
        fetchData(url, function(){
          updateCharacterList();
        });
      })
      btnGroup.appendChild(btn);
      
      cell.appendChild(btnGroup);
      row.appendChild(cell);
      res.appendChild(row);
    });
  }
}

function updateGuildList(){
  let url = '/user/guild/getByAdmin';
  fetchData(url, function(guildList){
    printGuildList(guildList);
  })
}

function printGuildList(guildList){
  let res = document.getElementById('guildList');
  let filter = document.getElementById('filter');
  if(!filter){
    let filter = {value:''};
  }
  if(res){
    res.innerHTML = '';
    res.classList.add('container');
    //res.classList.add('bgMain');
    
    let row = ce('div','row');
    let cell = ce('div', 'col');
    cell.innerText = 'Guilds you are admin for:';
    row.appendChild(cell);
    
    /*cell = ce('div', 'col');
    let btn = ce('button', ['btn', 'btn-outline-secondary']);
    btn.innerText = '+';
    cell.appendChild(btn);
    row.appendChild(cell);*/
    res.appendChild(row);
    
    guildList.forEach(function(guild){
      row = ce('div','row');
      cell = ce('div', 'col');
      cell.innerText = guild.guildName;
      row.appendChild(cell);
      
      cell = ce('div', 'col-auto');
      let btnGrp = ce('div', 'btn-group')
      btn = ce('button', ['btn', 'btn-button'])
      btn.innerText = 'Edit';
      btn.addEventListener('click', function(e){
        if(edit){
          btn.innerText = 'Edit';
          edit = false;
          getItemlist(filter.value);
        }else{
          btn.innerText = 'Exit edit';
          edit = true;
          updateItemlist(filter.value);
        }
      })
      btn.id = 'editGuild';
      btnGrp.appendChild(btn)
      
      let btnAdmin = ce('button', ['btn', 'btn-button'])
      btnAdmin.innerText = 'Add admin';
      btnAdmin.addEventListener('click', function(e){
        cell.appendChild(addAdminPlate(guild.guildName));
      });
      btnGrp.appendChild(btnAdmin);
      
      cell.appendChild(btnGrp);
      row.appendChild(cell);
      
      res.appendChild(row);
    });
  }
}

function addAdminPlate(guildName){
  let container = ce('div', ['container']);
  let row = ce('div','row');
  let cell = ce('div', 'col');
  let grp = ce('div', 'input-group');
  let input = ce('input', 'form-control');
  let append = ce('div', 'input-group-append');
  let btn = ce('button', ['btn','btn-button']);
  btn.innerText = 'Add';
  btn.addEventListener('click', function(e){
    let url = '/user/guild/admin/add/'+guildName+'/'+input.value;
    fetchData(url, function(){
      container.innerHTML = '';
    });
  });
  append.appendChild(btn);
  grp.appendChild(input);
  grp.appendChild(append);
  
  cell.appendChild(grp);
  row.appendChild(cell);
  container.appendChild(row);
  
  return container;
}


function getItemlist(filter){
  let url = '/items/';
  fetchData(url, function(items){
    itemlist = items;
    updateItemlist(filter);
  });
}

function filterItems(arr, query) {
  return arr.filter(function(el) {
    let name = (el.itemId.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
    let slot = (el.itemId.slot.toLowerCase().indexOf(query.toLowerCase()) !== -1);
    let drop = (el.itemId.drop.toLowerCase().indexOf(query.toLowerCase()) !== -1);
    let zone = (el.itemId.zone.toLowerCase().indexOf(query.toLowerCase()) !== -1);
    
    return (name || slot || drop || zone);
  })
}

function updateItemlist(filter){
  if(!filter) filter = '';
  if(filter == ''){
    printItemlist(itemlist);
  }else{
    let arrFilter = filter.split(';')
    let newList = itemlist.itemlist;
    arrFilter.forEach(function(filt){
      newList = filterItems(newList, filt);
    })
    printItemlist({user: itemlist.user, itemlist: newList});
  }
}

function getItemlistFromBids(bids){
  let newList = [];
  bids.forEach(function(bid){
    let element = itemlist.itemlist.find(function(el){
      return (el.itemId._id == bid.itemId._id);
    });
    if(element){
      newList.push(element);
    }
  });
  
  printItemlist({user: itemlist.user, itemlist: newList});
}


function printItemlist(itemlist){
  let items = itemlist.itemlist;
  let user = itemlist.user;
  let res = document.getElementById('items');
  let itemHeader = document.getElementById('itemHeader');
  let bids = document.getElementById('bids');
  let editGuild = document.getElementById('editGuild');
 
  
  if(res){
    res.innerHTML='';
    res.classList.add('container');
    //res.classList.add('bgMain');
    
    items.forEach(function(i){
      let item = i.itemId;
      let guild = i.guildId;
      if(item){
        let row = ce('div',['row','align-items-center']);
        let cell = ce('div', 'col-5');
        let a = ce('a')
        a.href = 'https://classic.wowhead.com/item='+item.id;
        //data-wowhead='domain=classic&item=21702', data-entity='item', data-entity-has-icon='true')
        a.setAttribute('data-wowhead','domain=classic&item='+item.id);
        a.setAttribute('data-entity', 'item');
        a.setAttribute('data-entity-has-icon','true');
        a.setAttribute('tabindex', '-1')
        //let img = ce('img')
        //img.src = 'https://classic.wowhead.com/item='+item.id;
        //a.appendChild(img);
        a.innerText = item.name;
        cell.appendChild(a);
        row.appendChild(cell);
        
        cell = ce('div', 'col');
        let span = ce('span');
        span.innerText = item.slot;
        cell.appendChild(span);
        row.appendChild(cell);
        
        cell = ce('div', 'col');
        cell.innerText = item.drop;
        row.appendChild(cell);
        
        cell = ce('div', 'col');
        cell.innerText = item.zone;
        row.appendChild(cell);
        
        cell = ce('div', 'col-1');
        let input = ce('input','form-control')
        if(edit){  
          input.value = i.price;
          input.style.textAlign = 'right';
          input.addEventListener('change', function(e){
            let url = '/user/guild/price/update/'+guild._id+'/'+item._id+'/'+e.target.value;
            fetchData(url, function(err, doc){});
          })
          cell.appendChild(input);
        }else{
          cell.innerText = i.price;
          cell.style.textAlign = 'right';
        }  
        row.appendChild(cell);
        
        cell = ce('div', 'col-1');
        
        if(user && i.price > 0){
          let characters = user.characters;
          let button = ce('button', ['btn','btn-button']);
          button.innerText = 'Que';
          button.setAttribute('tabindex', '-1');
          
//============================ BIDS ==============================================
          button.addEventListener('click', function(e){
            res.style.display = 'none'; 
            bids.innerHTML = '';
            bids.style.display = 'block';
            
            let itemRow = ce('div', 'row');
            duplicateChildNodes(row,itemRow);
            
            bids.appendChild(itemRow);
            
            let backRow = ce('div', ['row', 'justify-content-end']);
            let backCell = ce('div', 'col-auto');
            let backBtn = ce('button', ['btn', 'btn-button']);
            backBtn.innerText = 'Back to itemlist';
            backBtn.addEventListener('click', function(e){
              res.style.display = 'block'; 
              bids.innerHTML = '';
              bids.style.display = 'none';
            });
            backCell.appendChild(backBtn);
            backRow.appendChild(backCell);
            bids.appendChild(backRow);
            
            let bidRow = ce('div',['row','align-items-center']);
            updateBidList(bidRow, guild._id, item._id);
            bids.appendChild(bidRow);
            
            let pbidContainer = ce('div', 'container')
            let pbidRow = ce('div',['row','justify-content-center']);
            let pbidCell = ce('div', 'col');
            
            pbidCell.innerText = 'Fill out charactername and bid value to enter que';
            pbidRow.appendChild(pbidCell);
            pbidContainer.appendChild(pbidRow);
            
            pbidRow = ce('div',['row','justify-content-center']);
            pbidCell = ce('div', 'col-2');
            
            let pbidCharDD = ce('select','form-control');
            pbidCharDD.id = 'characters';
            updateCharacterDropDown(pbidCharDD, characters);
            pbidCell.appendChild(pbidCharDD);
            pbidRow.appendChild(pbidCell);
            
            pbidCell = ce('div', 'col-2');
            let newBid = ce('input', 'form-control')
            newBid.value = i.price;
            pbidCell.appendChild(newBid);
            pbidRow.appendChild(pbidCell);
            
            let errRow = ce('div', 'row');
            let errCell = ce('div', ['col', 'err']);
            
            pbidCell = ce('div', 'col-2');
            let btnPlace = ce('button', ['btn','btn-button']);
            btnPlace.innerText = 'Place bid';
            btnPlace.addEventListener('click', function(e){
              let bidVal = parseInt(newBid.value);
              let priceVal = parseInt(i.price);
              if((bidVal >= priceVal || bidVal == 0) && bidVal % (priceVal*0.1) == 0){
                url = '/user/bid/add/'+guild._id+'/'+item._id+'/'+pbidCharDD.value+'/'+newBid.value;
                errCell.style.display = 'none';
                fetchData(url,function(){
                  updateBidList(bidRow, guild._id, item._id);
                });
              }else{
                errCell.style.display = 'block';
                errCell.innerText = 'Bid must be equal or higher then asking price! And must be incremented by 10% of asking price. Your bid is '+bidVal+', asking price is '+priceVal+'. Bids accepted are close to your bid are '+(bidVal - (bidVal % (priceVal*0.1)))+' or '+(bidVal + (priceVal*0.1) - (bidVal % (priceVal*0.1)))+'.';
              }
            });
            pbidCell.appendChild(btnPlace);
            pbidRow.appendChild(pbidCell);
            pbidContainer.appendChild(pbidRow);
            
            errRow.appendChild(errCell);
            pbidContainer.appendChild(errRow);
            
            bids.appendChild(pbidContainer);
          });
          cell.appendChild(button);
        }
        row.appendChild(cell);
        res.appendChild(row);
      }
    });
    $WowheadPower.refreshLinks();
  }
}
var accending = [false,false,false,false];

function updateBidList(parent, guildId, itemId){
  let url = '/user/bid/get/'+guildId+'/'+itemId;
  fetchData(url, function(bidList){
    
    bidList.sort(function(a, b){
      return b.bid - a.bid || new Date(a.date) - new Date(b.date);
    });
    
    parent.innerHTML = '';
    let bidContainer = ce('div', ['container','tableBg'])
    let bidRow = ce('div',['row','justify-content-center']);
    let bidCell = ce('div', 'col-2');
    bidCell.innerText = 'Que order';
    bidRow.appendChild(bidCell);
    
    bidCell = ce('div', 'col-2');
    bidCell.innerText = 'Character name';
    bidRow.appendChild(bidCell);
      
    bidCell = ce('div', 'col-4');
    bidCell.innerText = 'Bid placed';
    bidRow.appendChild(bidCell);
    
    bidCell = ce('div', 'col-2');
    bidCell.innerText = 'Bid amount';
    bidRow.appendChild(bidCell);
    bidContainer.appendChild(bidRow);
    parent.appendChild(bidContainer);   
    
    bidContainer = ce('div', ['container','list'])

    let k = 0;
    let l = 0;
    
    bidList.forEach(function(bid, i){
      l = i-k;
      if(bid.characterId){
        bidRow = ce('div',['row','justify-content-center']);
        bidCell = ce('div', 'col-2');
        bidCell.innerText = l+1;
        bidRow.appendChild(bidCell)
        
        bidCell = ce('div', 'col-2');
        bidCell.innerText = bid.characterId.name;
        bidRow.appendChild(bidCell);
        
        bidCell = ce('div', 'col-4');
        bidCell.innerText = showDateTime(bid.date);
        bidRow.appendChild(bidCell)
        
        bidCell = ce('div', 'col-2');
        bidCell.innerText = bid.bid;
        bidRow.appendChild(bidCell);
        
        bidContainer.appendChild(bidRow);
      }else{
        k++;
      }
    });
    
    parent.appendChild(bidContainer);
  });
}

function sortDiv(parentDiv, column){
  let parent = document.getElementById(parentDiv);
  let toSort = parent.children;
  toSort = Array.prototype.slice.call(toSort,0);
  
  toSort.sort(function(a,b){
    let textA = a.childNodes[column].innerText.toLowerCase();
    let textB = b.childNodes[column].innerText.toLowerCase();
    
    if(isNaN(textA)){
      return textA.localeCompare(textB);
    }else{
      return textB - textA;
    }
  })
  
  if(accending[column]){
    toSort.reverse();
    accending = [false,false,false,false];
  }else{
    accending = [false,false,false,false];
    accending[column] = true;
  }
  
  parent.innerHTML = '';

  for(var i = 0, l = toSort.length; i < l; i++) {
    parent.appendChild(toSort[i]);
  }
}

function clearInput(element){
  let el = document.getElementById(element);
  el.value = '';
  updateItemlist('');
}

function duplicateChildNodes(parent, newParent){
  NodeList.prototype.forEach = Array.prototype.forEach;
  var children = parent.childNodes;
  children.forEach(function(item){
    var cln = item.cloneNode(true);
    newParent.appendChild(cln);
  });
};

function showDateTime(d){
  let date = new Date(d);
  let year = date.getFullYear();
  let month = date.getMonth()+1
  let day = date.getDay();
  let h = date.getHours();
  let m = date.getMinutes();
  let s = date.getSeconds();
  
  if(month<10) month = '0'+month;
  if(day<10) day = '0'+day;
  if(h<10) h = '0'+h;
  if(m<10) m = '0'+m;
  if(s<10) s = '0'+s;
  
  return year+'.'+month+'.'+day+' '+h+':'+m+':'+s;
}
