var speed = 100;
var pubgColor = ['#0042a1', '#15931a', '#e16209', '#2096d1', '#4a148c', '#9f2b14', '#486a00', '#c51a56', '#9c6622', '#820045', 
                  '#d5b115', '#4ab3af', '#6b828d', '#f39700', '#37474f', '#e0648e', '#00736d', '#8a4803', '#7fb017', '#854ba1', 
                  '#38b27e', '#88abda', '#e58b65', '#2c276c', '#988e09'];
var xmlns = "http://www.w3.org/2000/svg";
var ligthVector = {x:0, y:1, z:1};
var mainColor;
var mainCOlorLight;


function loadFunction(){
  let filter = document.getElementById('filter');
  
  mainColor = getComputedStyle(document.documentElement).getPropertyValue('--mainColor');
  mainColorLight = getComputedStyle(document.documentElement).getPropertyValue('--mainColorLight');
  
  updateItemlist();
  
  if(filter){
    filter.addEventListener('input', function(e){
      console.log("--CHANGE--");
      updateItemlist(e.target.value);
    });
  }
}

/*
API_ENDPOINT = 'https://discord.com/api/v6'
CLIENT_ID = '332269999912132097'
CLIENT_SECRET = '937it3ow87i4ery69876wqire'
REDIRECT_URI = 'https://nicememe.website'

def exchange_code(code):
  data = {
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': REDIRECT_URI,
    'scope': 'identify email connections'
  }
  headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  r = requests.post('%s/oauth2/token' % API_ENDPOINT, data=data, headers=headers)
  r.raise_for_status()
  return r.json()


*/


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

function updateItemlist(filter){
  if(!filter) filter='null';
  let url = '/items/'+filter;
  fetchData(url, function(items){
    printItemList(items)
  });
}

function printItemList(items){
  let res = document.getElementById('items');
  res.innerHTML='';
  let list = ce('div',['container','bgMain']);
  items.forEach(function(item){
    let row = ce('div','row');
    let cell = ce('div', 'col-4');
    let a = ce('a')
    a.href = 'https://classic.wowhead.com/item='+item.id;
    //data-wowhead='domain=classic&item=21702', data-entity='item', data-entity-has-icon='true')
    a.setAttribute('data-wowhead','domain=classic&item='+item.id);
    a.setAttribute('data-entity', 'item');
    a.setAttribute('data-entity-has-icon','true');
    //let img = ce('img')
    //img.src = 'https://classic.wowhead.com/item='+item.id;
    //a.appendChild(img);
    a.innerText = item.name;
    cell.appendChild(a);
    row.appendChild(cell);
    
    cell = ce('div', 'col');
    cell.innerText = item.slot;
    row.appendChild(cell);
    
    cell = ce('div', 'col');
    cell.innerText = item.drop;
    row.appendChild(cell);
    
    cell = ce('div', 'col');
    cell.innerText = item.zone;
    row.appendChild(cell);
    
    list.appendChild(row);
  });
  res.appendChild(list);
  $WowheadPower.refreshLinks();
  /*let script = ce('script')
  script.src = 'https://wow.zamimg.com/widgets/power.js';
  res.appendChild(script);*/
}