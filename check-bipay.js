var f=require('fs').readFileSync('C:\\Users\\woo\\Desktop\\프젝\\11_bipays\\server.js','utf8');

// Find all route-like patterns
var routes=f.match(/\.(get|post|put|delete)\s*\(\s*['"][^'"]+/g);
if(routes){
  console.log('=== ROUTES ===');
  routes.forEach(function(r){console.log(r)});
}

// Find URL patterns
var urls=f.match(/['"]\/[a-z][a-z0-9\-_\/\:]+['"/]/gi);
if(urls){
  var seen={};
  console.log('\n=== URL PATTERNS ===');
  urls.forEach(function(u){
    if(!seen[u]&&u.length>4){
      seen[u]=1;
      console.log(u);
    }
  });
}

// Check if webhook exists
console.log('\n=== KEY FEATURES ===');
console.log('webhook:', f.includes('webhook'));
console.log('deposit:', f.includes('deposit'));
console.log('withdraw:', f.includes('withdraw'));
console.log('company:', f.includes('company'));
console.log('tronweb:', f.includes('TronWeb'));
console.log('HD wallet:', f.includes('bip32'));
console.log('file length:', f.length);
