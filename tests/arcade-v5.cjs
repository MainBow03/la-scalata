'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert(match,'Script principale assente');
const main=match[1].replace(/\brender\(\);\s*(?:loadPortraits\(\);)?\s*$/,'');
const sources=['arcade-v3.js','arcade-v4.js','arcade-v5.js'];
const el={addEventListener(){},innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}}};
const app={...el,listeners:[],addEventListener(type,fn,capture){this.listeners.push({type,fn,capture})}};
const document={querySelector(q){return q==='#app'?app:el},getElementById(){return el},querySelectorAll(){return []},addEventListener(){}};
const storage={getItem(){return null},setItem(){}};
const context={console,document,navigator:{},location:{href:'https://example.test'},localStorage:storage,sessionStorage:storage,
 setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){return 1},cancelAnimationFrame(){},
 performance:{now(){return 100}},Math};
context.window=context;context.scrollTo=()=>{};
vm.createContext(context);
vm.runInContext(main,context,{filename:'index.html'});
for(const file of sources){new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file})}
const t=vm.runInContext('({games,state,home,chooseMini,rawForBot,botNames,player,roomBase,outcomeForRoom,resolveRound,nextPhase,rankPrizes,displayMetric})',context);
const active=t.games.filter(x=>x.version===5);
assert.equal(active.length,5,'Servono cinque missioni attive');
assert.deepEqual(active.map(x=>x.id),['skyline','citadel','stellar','railway','liftmaster']);
assert(t.home().includes('data-catalog="open"'),'Catalogo non raggiungibile dal menu');
const open=app.listeners.find(x=>x.type==='click'&&x.capture);
assert(open,'Manca il tasto catalogo');
open.fn({target:{closest(){return {dataset:{catalog:'open'}}}},preventDefault(){},stopImmediatePropagation(){}});
assert.equal(t.state.view,'catalog');
assert.equal((app.innerHTML.match(/data-catalog-game=/g)||[]).length,5,'Catalogo deve avere 5 giochi attivi');
open.fn({target:{closest(){return {dataset:{catalog:'back'}}}},preventDefault(){},stopImmediatePropagation(){}});
assert.equal(t.state.view,'home');
for(let k=0;k<60;k++){
 const r=t.roomBase('TEST'+k,'human',[t.player('human','Giocatore',0,false)]);
 const picked=[];
 for(let n=0;n<30;n++){r.round=n;const id=t.chooseMini(r);assert(active.some(g=>g.id===id),'Minigioco archiviato nella rotazione: '+id);picked.push(id)}
 for(let start=0;start<30;start+=5)assert.equal(new Set(picked.slice(start,start+5)).size,5,'Ripetizione nel ciclo di 5 missioni');
}
const expected=[14,11,9,7,5,4,3,1];
assert.deepEqual(Array.from(t.rankPrizes(8)),expected);
for(const d of ['easy','normal','hard']){
 for(const g of active)for(let turn=0;turn<40;turn++){
  const room=t.roomBase('ROOM','human',[]);room.turn=turn;room.difficulty=d;
  const raw=t.rawForBot({uid:'bot'+turn,avatar:4,bot:true},g,room);
  assert(Number.isFinite(raw)&&raw>=0&&raw<=100000,'Prestazione NPC fuori scala: '+g.id);
 }
}
const players=Array.from({length:8},(_,i)=>t.player('p'+i,'Player'+i,i,false));
for(const g of active){
 const r=t.roomBase('ROOM','p0',players);r.phase='playing';r.round=1;r.turn=1;r.miniId=g.id;
 const inputs=Object.fromEntries(players.map((p,i)=>[p.uid,(8-i)*137]));
 const o=t.outcomeForRoom(r,inputs);
 assert.deepEqual(o.map(x=>x.points),expected,'Premi errati: '+g.id);
 assert.equal(o[0].raw,1096,'Prestazioni naturali >100 non preservate per '+g.id);
}
assert.equal(t.displayMetric('skyline',843),'843 metri');
assert.equal(t.displayMetric('citadel',217),'21 nemici fermati');
assert.equal(t.displayMetric('stellar',172),'17 cristalli distrutti');
assert.equal(t.displayMetric('railway',3015),'3 rotte completate');
assert.equal(t.displayMetric('liftmaster',714),'7 passeggeri serviti');
let completed=0;
for(let k=0;k<80;k++){
 let r=t.roomBase('LOCAL'+k,'human',[t.player('human','Hero',0,false),...t.botNames([],7)]);
 r=t.nextPhase(r);let steps=0;
 while(r.phase!=='champion'&&steps++<100){
  if(r.phase==='playing'){
   const example={skyline:840,citadel:180,stellar:210,railway:2050,liftmaster:706}[r.miniId]||50;
   r=t.resolveRound(r,{human:example});
  }else r=t.nextPhase(r);
  assert(r,'La fase successiva non esiste');
 }
 assert.equal(r.phase,'champion','Campagna bloccata');
 completed++;
}
console.log('OK Missioni v5: 5 attive, catalogo, 60 rotazioni×30, NPC, metriche naturali, premi 14–1, '+completed+' stagioni complete.');
