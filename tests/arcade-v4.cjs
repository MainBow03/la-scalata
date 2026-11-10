'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const main=fs.readFileSync('index.html','utf8');
const src=main.match(/<script>([\s\S]*?)<\/script>/);
assert(src,'Script principale assente');
const mainCode=src[1].replace(/\brender\(\);\s*(?:loadPortraits\(\);)?\s*$/,'');
const versions=['arcade-v3.js','arcade-v4.js'];
const element={addEventListener(){},innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},style:{}};
const app={...element,listeners:[],addEventListener(type,fn,capture){this.listeners.push({type,fn,capture})}};
const document={querySelector(q){return q==='#app'?app:element},getElementById(){return element},querySelectorAll(){return []}};
const stubStore={getItem(){return null},setItem(){}};
const context={console,document,navigator:{},location:{href:'https://example.test/'},localStorage:stubStore,sessionStorage:stubStore,
 setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},performance:{now(){return 100}},Math};
context.window=context;context.scrollTo=()=>{};
// The current production base defines botRandom; keep a seed-compatible fallback for older local fixtures.
context.botRandom=(p,g,r)=>{let v=123456+String(p.uid+g.id+r.turn).length*171;return ()=>{v=(Math.imul(1664525,v)+1013904223)|0;return (v>>>0)/4294967296}};
vm.createContext(context);
vm.runInContext(mainCode,context,{filename:'index.html'});
for(const name of versions)vm.runInContext(fs.readFileSync(name,'utf8'),context,{filename:name});
const t=vm.runInContext('({games,state,home,chooseMini,rawForBot,botNames,player,roomBase,outcomeForRoom,nextPhase})',context);
assert(t.home().includes('data-catalog="open"'),'Catalogo non disponibile nella home');
const active=t.games.filter(g=>g.version===4||['garden','clockwork','market','dive','meteor','guardians','heartbeat','echo','cipher'].includes(g.id));
assert.equal(active.length,16);
assert.equal(active.filter(g=>g.version===4).length,7);
const click=app.listeners.find(x=>x.type==='click'&&x.capture);
assert(click,'Nessun evento per aprire il catalogo');
let stopped=0;
click.fn({target:{closest(){return {dataset:{catalog:'open'}}}},preventDefault(){},stopImmediatePropagation(){stopped++}});
assert.equal(t.state.view,'catalog');
assert(app.innerHTML.includes('IL CATALOGO DEI MINIGIOCHI'));
assert.equal((app.innerHTML.match(/data-catalog-game=/g)||[]).length,16);
click.fn({target:{closest(){return {dataset:{catalog:'back'}}}},preventDefault(){},stopImmediatePropagation(){}});
assert.equal(t.state.view,'home');
assert(stopped===1);
for(let n=0;n<40;n++){
 const r=t.roomBase('TEST'+n,'human',[t.player('human','Giocatore',0,false)]);
 const selected=[];
 for(let i=0;i<36;i++){r.round=i;const id=t.chooseMini(r);selected.push(id);assert(active.some(g=>g.id===id),'Gioco fuori rotazione: '+id)}
 for(let i=0;i<36;i+=12){const part=selected.slice(i,i+12);assert.equal(new Set(part).size,12,'Ripetizioni nella rotazione');assert.equal(part.filter(id=>active.find(g=>g.id===id)?.version===4).length,7)}
 for(let i=1;i<selected.length;i++)assert.notEqual(selected[i],selected[i-1]);
}
for(const level of ['easy','normal','hard'])for(const game of active.filter(g=>g.version===4)){
 const r=t.roomBase('TEST123','u',[]);r.difficulty=level;
 for(let i=0;i<30;i++){r.turn=i;const raw=t.rawForBot({uid:'bot'+i,avatar:4,bot:true},game,r);assert(Number.isFinite(raw)&&raw>=0&&raw<=100,'Punteggio NPC invalido: '+game.id)}
}
const humans=Array.from({length:8},(_,i)=>t.player('p'+i,'Player'+i,i,false));
const room=t.roomBase('ROOM12','p0',humans);room.phase='playing';room.round=1;room.miniId='railcraft';
const submitted=Object.fromEntries(humans.map((p,i)=>[p.uid,100-i*12]));
const results=t.outcomeForRoom(room,submitted);
assert.deepEqual(Array.from(results,x=>x.points),[14,11,9,7,5,4,3,1]);
for(const x of results)assert(x.raw>=0&&x.raw<=100);
let seasons=0;
for(let k=0;k<40;k++){
 let r=t.roomBase('LOCAL','human',[t.player('human','Hero',0,false),...t.botNames([],7)]);
 r=t.nextPhase(r);let safety=0;
 while(r.phase!=='champion'&&safety++<100){if(r.phase==='playing')r=vm.runInContext('resolveRound',context)(r,{human:60});else r=t.nextPhase(r)}
 assert.equal(r.phase,'champion');seasons++;
}
console.log('OK: catalogo, menu, 7 nuove prove, 40 rotazioni×36, NPC, premi, '+seasons+' partite complete.');