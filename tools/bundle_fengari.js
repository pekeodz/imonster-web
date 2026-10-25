const fs=require('fs'),path=require('path');
const SRC='/home/claude/fengari/src';
const mods={};
for(const f of fs.readdirSync(SRC)) if(f.endsWith('.js')) mods['./'+f.replace(/\.js$/,'')]=fs.readFileSync(path.join(SRC,f),'utf8');
for(const k in mods) mods[k]=mods[k].split('process.env.FENGARICONF').join('undefined');
mods['sprintf-js']=fs.readFileSync('/home/claude/sprintfjs/src/sprintf.js','utf8');
let out='(function(){var process=undefined;\nvar __mods={};var __cache={};\nfunction __req(n){n=n.replace(/\\.js$/,"");if(__cache[n])return __cache[n].exports;var f=__mods[n];if(!f){return {};}var m={exports:{}};__cache[n]=m;f(m,m.exports,__req);return m.exports;}\n';
for(const [k,v] of Object.entries(mods)){
  out+=`__mods[${JSON.stringify(k)}]=function(module,exports,require){\n${v}\n};\n`;
}
out+='window.fengari=__req("./fengari");})();\n';
fs.writeFileSync('/home/claude/imonster-web/js/lib/fengari.js',out);
console.log(out.length);
