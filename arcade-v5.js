/* LA SCALATA — Arcade Missions v5: competitive, natural scores. */
(function(){
'use strict';
const V5=[
 {id:'skyline',name:'Fuga sui Tetti · Definitiva',desc:'Runner con salti fisici, scivolate e ostacoli leggibili.',symbol:'🏃',kind:'quick',duration:91,how:'Corri per ottenere più metri degli avversari. Salta gli ostacoli bassi e scivola sotto le travi. Tre cuori: ogni errore conta.',mechanic:'Platform fisico',version:5,reborn:true},
 {id:'citadel',name:'Assedio della Fortezza',desc:'Tre corsie, proiettili reali, più ondate e sette difese.',symbol:'🏰',kind:'quick',duration:91,how:'Seleziona una corsia e spara ai nemici che avanzano. Alcuni hanno armatura: servono più colpi. Vince chi ne ferma di più.',mechanic:'Arcade difesa',version:5,reborn:true},
 {id:'stellar',name:'Cristalli del Firmamento',desc:'Rompimattoni con fisica, combo, tre vite e mira della racchetta.',symbol:'🌌',kind:'quick',duration:100,how:'Controlla la racchetta con dito, mouse o frecce. Distruggi quanti più cristalli possibile senza perdere le tre palline.',mechanic:'Rompimattoni',version:5,reborn:true},
 {id:'railway',name:'Treno del Labirinto',desc:'Ruota binari, pianifica un percorso e fai partire il treno.',symbol:'🚆',kind:'strategy',duration:125,how:'Gira i binari per collegare la locomotiva alla stazione. Controlla la rotta e completa tre mappe: vince chi ne risolve di più.',mechanic:'Puzzle di connessione',version:5,reborn:true},
 {id:'liftmaster',name:'Ascensore Reale',desc:'Trasporta passeggeri veri attraverso sei piani e tre posti.',symbol:'🛗',kind:'strategy',duration:111,how:'Tocca un piano per far partire l’ascensore. Carica fino a tre passeggeri e accompagnali alla destinazione. Conta il numero di consegne.',mechanic:'Gestione e pianificazione',version:5,reborn:true}
];
games.unshift(...V5);
const prevMini=startMini,prevBot=rawForBot,prevChoose=chooseMini;
const get=id=>document.getElementById(id),mount=()=>miniMount();
const rngSeed=s=>{let k=2166136261;for(const ch of String(s)){k^=ch.charCodeAt(0);k=Math.imul(k,16777619)}return()=>{k^=k<<13;k^=k>>>17;k^=k<<5;return(k>>>0)/4294967296}};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const rand=(r,a,b)=>Math.floor(r()*(b-a+1))+a,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const addCleanup=(s,fn)=>{const old=s.cleanup;s.cleanup=()=>{fn();old?.()}};
const delay=(s,ms,fn)=>{const t=setTimeout(()=>{if(state.mini===s&&!s.done)fn()},ms);s.timeouts.push(t);return t};
function gameFrame(s,g,metric,desc,body){
 const m=mount();if(!m)return;
 m.innerHTML='<div class="v5-scorebar"><div><span class="v5-label">'+metric+'</span><strong id="v5-score">0</strong></div><div class="v5-infotag">'+desc+'</div></div>'+
  '<div class="v5-game"><div id="v5-scene">'+body+'</div><div id="v5-message" class="v5-message">Pronto per la sfida!</div></div>';
}
function say(message,positive=true){const e=get('v5-message');if(e){e.textContent=message;e.className='v5-message '+(positive?'v5-positive':'v5-negative')}}
function score(s,value,unit){s.raw=Math.round(Math.max(0,value));const e=get('v5-score');if(e)e.textContent=unit||String(s.raw)}
function finish(s,raw,note){if(!s.done)finishMini(Math.round(Math.max(0,raw)),note)}
function intro(g,s,next){
 const m=mount();if(!m)return;let started=false;function go(){if(started||s.done)return;started=true;next()}
 m.innerHTML='<div class="v5-intro"><span class="v5-overline">MISSIONE DEL PALAZZO</span><div class="v5-intro-art">'+g.symbol+'</div><h3>'+g.name+'</h3><p>'+g.how+'</p>'+
 '<div class="v5-intro-cards"><span>🏁 Risultato: '+(GAME_METRICS[g.id]?.label||'Prestazione')+'</span><span>👑 La classifica premia i piazzamenti, non una soglia di 100</span></div><button type="button" class="v5-primary" id="v5-start">INIZIA LA MISSIONE</button><small>La prova inizia automaticamente tra 4 secondi.</small></div>';
 get('v5-start')?.addEventListener('click',go);delay(s,4000,go);
}
function canvasLoop(s,draw,frame){
 let handle=0,last=0;
 const go=ts=>{if(s.done)return;const dt=last?cl((ts-last)/1000,0,.043):.016;last=ts;frame(dt,ts);if(!s.done){draw();handle=requestAnimationFrame(go)}};
 handle=requestAnimationFrame(go);addCleanup(s,()=>cancelAnimationFrame(handle));
}
function bindKey(s,down,up){
 document.addEventListener('keydown',down);if(up)document.addEventListener('keyup',up);
 addCleanup(s,()=>{document.removeEventListener('keydown',down);if(up)document.removeEventListener('keyup',up)});
}
const canvas=(id)=>get(id).getContext('2d');
function skyline(s,g,r){
 const W=960,H=360,ground=306,contextId='v5-runner-canvas';
 gameFrame(s,g,'METRI PERCORSI','↑ o SPAZIO: SALTA · ↓: SCIVOLA · 3 cuori',
 '<canvas id="'+contextId+'" width="'+W+'" height="'+H+'" class="v5-canvas" aria-label="Corsa a ostacoli con salto e scivolata"></canvas>'+
 '<div class="v5-controls"><button type="button" data-v5="jump">▲ SALTA</button><button type="button" data-v5="duck">▼ SCIVOLA</button></div>');
 const ctx=canvas(contextId),canvasEl=get(contextId);
 let elapsed=0,meters=0,hearts=3,jumpY=0,velY=0,duckUntil=0,invulnerable=0,nextSpawn=2.1,obstacles=[],passed=0,collisions=0,anim=0,finished=false;
 function action(type){
  if(s.done||finished)return;
  if(type==='jump'&&jumpY===0&&performance.now()>duckUntil){velY=590;duckUntil=0}
  if(type==='duck'&&jumpY===0)duckUntil=performance.now()+750;
 }
 const controls=mount().querySelector('.v5-controls');
 controls.addEventListener('click',e=>{const b=e.target.closest('[data-v5]');if(b)action(b.dataset.v5)});
 const key=e=>{if(e.key==='ArrowUp'||e.key===' '||e.key==='ArrowDown'){if(!e.repeat){action(e.key==='ArrowDown'?'duck':'jump')}e.preventDefault()}};
 bindKey(s,key);
 function update(dt,ts){
  elapsed+=dt;anim+=dt;const speed=215+Math.min(130,elapsed*2.1);
  meters+=speed*dt/11;
  invulnerable=Math.max(0,invulnerable-dt);
  if(jumpY>0||velY>0){jumpY+=velY*dt;velY-=1530*dt;if(jumpY<=0){jumpY=0;velY=0}}
  const duck=ts<duckUntil&&jumpY===0;
  nextSpawn-=dt;
  if(nextSpawn<=0){const type=r()<.54?'box':'beam';obstacles.push({x:W+40,type,hit:false,past:false,width:type==='beam'?88:58});nextSpawn=cl(2.1-elapsed*.008,1.28,2.1)+r()*.38}
  for(const o of obstacles){
   o.x-=speed*dt;
   const overlap=o.x<188&&o.x+o.width>135;
   if(overlap&&!o.hit&&!o.past){
     o.hit=true;
     const safe=o.type==='box'?jumpY>57:duck;
     if(!safe&&invulnerable<=0){hearts--;collisions++;invulnerable=1.15;say('Ostacolo colpito! Restano '+hearts+' cuori.',false)}
     else if(safe){passed++;say(o.type==='box'?'Salto riuscito!':'Scivolata riuscita!')}
   }
   if(o.x+o.width<135)o.past=true;
  }
  obstacles=obstacles.filter(o=>o.x>-120);
  score(s,meters,Math.floor(meters)+' m');
  if(hearts<=0||elapsed>=79){finished=true;finish(s,meters,Math.floor(meters)+' metri · '+passed+' ostacoli superati');}
 }
 function draw(){
  const w=W,h=H;ctx.clearRect(0,0,w,h);
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#102d53');sky.addColorStop(1,'#3b4b70');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#e5dca0';ctx.beginPath();ctx.arc(775,66,30,0,Math.PI*2);ctx.fill();
  for(let i=0;i<30;i++){const sx=((i*137-Math.floor(meters*1.6))%1100+1100)%1100;ctx.fillStyle=i%3?'#c2d9ea':'#f9e4ab';ctx.fillRect(sx,(i*71)%155,2,2)}
  ctx.fillStyle='#213750';for(let i=0;i<14;i++){const bx=((i*93-meters*2)%1100+1100)%1100,by=215+(i%4)*8;ctx.fillRect(bx,by,72,ground-by);}
  ctx.fillStyle='#102433';ctx.fillRect(0,ground,960,54);
  ctx.fillStyle='#2b5560';for(let i=0;i<24;i++){let bx=((i*55-meters*8)%1100+1100)%1100;ctx.fillRect(bx,ground+20,28,4)}
  ctx.fillStyle='#f7d9a4';ctx.fillRect(0,ground,960,5);
  const duck=performance.now()<duckUntil&&jumpY===0,pTop=ground-jumpY-(duck?26:66);
  if(invulnerable<=0||Math.floor(anim*12)%2===0){
   ctx.fillStyle='#1d1e36';ctx.fillRect(140,pTop+9,39,duck?17:48);
   ctx.fillStyle='#f9d79f';ctx.beginPath();ctx.arc(160,pTop+(duck?11:12),duck?11:16,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#ffe294';ctx.fillRect(134,pTop+(duck?18:27),51,duck?9:19);
   ctx.fillStyle='#82cbe4';ctx.fillRect(140,pTop+(duck?20:47),17,duck?5:21);
   ctx.fillStyle='#fff';ctx.fillRect(166,pTop+(duck?20:47),17,duck?5:21);
  }
  for(const o of obstacles){
   if(o.type==='box'){ctx.fillStyle='#dc8b5f';ctx.fillRect(o.x,ground-50,58,50);ctx.strokeStyle='#ffe0a6';ctx.lineWidth=4;ctx.strokeRect(o.x+4,ground-46,50,42);ctx.beginPath();ctx.moveTo(o.x+4,ground-46);ctx.lineTo(o.x+54,ground-4);ctx.moveTo(o.x+54,ground-46);ctx.lineTo(o.x+4,ground-4);ctx.stroke();}
   else{ctx.fillStyle='#4bc2e1';ctx.fillRect(o.x,ground-75,88,25);ctx.fillStyle='#c5f6ff';ctx.fillRect(o.x+5,ground-71,78,5);ctx.fillStyle='#ffeaac';ctx.fillText('↓',o.x+38,ground-87)}
  }
  ctx.font='bold 21px Arial';ctx.fillStyle='#ffe2a1';ctx.fillText('❤ '.repeat(hearts)+'♡ '.repeat(3-hearts),22,33);
  ctx.font='bold 19px Arial';ctx.fillText('OSTACOLI SUPERATI: '+passed,600,32);
  ctx.fillStyle='#ffffffcc';ctx.font='15px Arial';ctx.fillText('Sopravvivi, accelera e supera la distanza degli altri concorrenti.',20,346);
 }
 canvasLoop(s,draw,update);
}

// ASSALTO: proiettili viaggiano davvero fra tre corsie, armature e ondate.
function citadel(s,g,r){
 const W=900,H=390,laneY=[92,207,321],ctxId='v5-citadel-canvas';
 gameFrame(s,g,'NEMICI FERMATI','Tre corsie · tieni premuto SPARA · sette difese',
 '<canvas id="'+ctxId+'" class="v5-canvas" width="'+W+'" height="'+H+'" aria-label="Castello e tre corsie di battaglia"></canvas>'+
 '<div class="v5-controls v5-controls-three"><button type="button" data-fort="up">▲ SU</button><button type="button" data-fort="fire" id="v5-fire">● SPARA</button><button type="button" data-fort="down">▼ GIÙ</button></div>');
 const ctx=canvas(ctxId),el=get(ctxId);let selected=1,holding=false,elapsed=0,spawn=0,enemies=[],projectiles=[],killed=0,gates=7,shotWait=0,wave=0,count=0,finished=false;
 const controls=mount().querySelector('.v5-controls');
 function action(type){if(type==='up')selected=Math.max(0,selected-1);if(type==='down')selected=Math.min(2,selected+1);if(type==='fire')holding=true;}
 controls.addEventListener('click',e=>{const b=e.target.closest('[data-fort]');if(b&&b.dataset.fort!=='fire')action(b.dataset.fort)});
 const fireBtn=get('v5-fire'),start=e=>{holding=true;e.preventDefault()},stop=()=>{holding=false};
 fireBtn.addEventListener('pointerdown',start);fireBtn.addEventListener('pointerup',stop);fireBtn.addEventListener('pointerleave',stop);fireBtn.addEventListener('pointercancel',stop);
 const clickLane=e=>{const rect=el.getBoundingClientRect();const y=(e.clientY-rect.top)/rect.height*H;selected=laneY.reduce((best,l,i)=>Math.abs(l-y)<Math.abs(laneY[best]-y)?i:best,0)};
 el.addEventListener('pointerdown',clickLane);
 const keys=new Set(),onKey=e=>{if(['ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();if(e.key===' '){keys.add(' ');holding=true}else if(!e.repeat)action(e.key==='ArrowUp'?'up':'down')}},up=e=>{if(e.key===' '){keys.delete(' ');holding=false}};
 bindKey(s,onKey,up);
 function step(dt){
  elapsed+=dt;shotWait-=dt;spawn-=dt;wave=1+Math.floor(elapsed/23);
  if(holding&&shotWait<=0){shotWait=.31;projectiles.push({x:140,y:laneY[selected],life:2});}
  if(spawn<=0&&count<42){let lane=rand(r,0,2);enemies.push({x:925,y:laneY[lane],lane,hp:count%6===0?3:count%4===0?2:1,speed:40+wave*12+r()*19});count++;spawn=cl(2.1-wave*.23,1.18,2)+r()*.65;}
  for(const b of projectiles){b.x+=630*dt;b.life-=dt;}
  for(const a of enemies){a.x-=a.speed*dt;}
  for(const b of projectiles){if(b.life<=0)continue;const e=enemies.find(a=>Math.abs(a.y-b.y)<13&&Math.abs(a.x-b.x)<24&&a.hp>0);if(e){e.hp--;b.life=0;if(e.hp<=0){killed++;say('Bersaglio abbattuto · '+killed+' nemici!')}}}
  const arrived=enemies.filter(a=>a.x<95&&a.hp>0);if(arrived.length){gates=Math.max(0,gates-arrived.length);if(gates<=2)say('Le porte del castello stanno cedendo!',false)}
  enemies=enemies.filter(a=>a.x>95&&a.hp>0);projectiles=projectiles.filter(b=>b.x<W+20&&b.life>0);
  score(s,killed*10+gates,killed+' nemici');
  if(gates<=0||elapsed>=80||count>=42&&enemies.length===0){finished=true;finish(s,killed*10+gates,killed+' nemici fermati · '+gates+' porte intatte')}
 }
 function draw(){
  ctx.fillStyle='#0d2438';ctx.fillRect(0,0,W,H);
  for(let i=0;i<3;i++){ctx.fillStyle=i===selected?'#274f62':'#18364a';ctx.fillRect(0,laneY[i]-49,W,98);ctx.fillStyle='#5d8b8e';ctx.fillRect(0,laneY[i]+45,W,3);ctx.fillStyle='#a7dfd9';ctx.font='13px Arial';ctx.fillText('CORSIA '+(i+1),152,laneY[i]-30);}
  ctx.fillStyle='#d3aa78';ctx.fillRect(20,23,80,344);ctx.fillStyle='#674c56';for(let i=0;i<3;i++){ctx.fillRect(33,laneY[i]-24,50,48);}
  for(let i=0;i<3;i++){ctx.fillStyle=i===selected?'#ffe2ab':'#6b8aa4';ctx.beginPath();ctx.arc(118,laneY[i],i===selected?25:13,0,Math.PI*2);ctx.fill();if(i===selected){ctx.fillStyle='#343f58';ctx.fillRect(118,laneY[i]-6,40,12)}}
  for(const a of enemies){ctx.fillStyle=a.hp>=3?'#f19b78':a.hp===2?'#f0c37c':'#e67691';ctx.beginPath();ctx.arc(a.x,a.y,21,0,Math.PI*2);ctx.fill();ctx.fillStyle='#172739';ctx.fillRect(a.x-10,a.y-3,6,7);ctx.fillRect(a.x+5,a.y-3,6,7);ctx.fillStyle='#ffe9c0';ctx.font='bold 12px Arial';if(a.hp>1)ctx.fillText('ARM '+a.hp,a.x-20,a.y-26);}
  ctx.fillStyle='#ffecb2';for(const b of projectiles){ctx.beginPath();ctx.arc(b.x,b.y,6,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#ffe5a3';ctx.font='bold 19px Arial';ctx.fillText('❤ '.repeat(gates)+'♡ '.repeat(7-gates),15,18);ctx.fillText('ONDATA '+wave,742,24);ctx.fillText('ABBATTUTI '+killed,725,370);
 }
 canvasLoop(s,draw,step);
}

// ROMPIMATTONI: tre vite, collisioni ad angolo sulla racchetta, tempo e power-up.
function stellar(s,g,r){
 const W=760,H=430,id='v5-stellar-canvas';
 gameFrame(s,g,'CRISTALLI INFRANTI','Spostati con mouse, dito o ← → · 3 vite',
 '<canvas id="'+id+'" class="v5-canvas" width="'+W+'" height="'+H+'" aria-label="Rompimattoni del firmamento"></canvas>'+
 '<div class="v5-controls"><button data-stellar="left" type="button">◀ RACCHETTA</button><button data-stellar="right" type="button">RACCHETTA ▶</button></div>');
 const ctx=canvas(id),cn=get(id);
 let paddle=380,pressed={left:false,right:false},x=380,y=325,vx=180,vy=-245,lives=3,bricks=[],broken=0,pause=.8,elapsed=0,combo=0;
 const colors=['#79c4f3','#c8a4f6','#f6c07e','#89e6bf'];
 for(let row=0;row<4;row++)for(let col=0;col<8;col++)bricks.push({x:25+col*90,y:35+row*32,hp:row===0&&col%3===0?2:1,max:row===0&&col%3===0?2:1,color:(col+row)%4});
 const pos=e=>{const box=cn.getBoundingClientRect();paddle=cl((e.clientX-box.left)/box.width*W,50,W-50)};
 cn.addEventListener('pointerdown',e=>{pos(e);cn.setPointerCapture?.(e.pointerId)});
 cn.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||e.buttons)pos(e);else pos(e)});
 const controls=mount().querySelector('.v5-controls');
 controls.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-stellar]');if(b){pressed[b.dataset.stellar]=true;e.preventDefault()}});
 for(const evt of ['pointerup','pointerleave','pointercancel'])controls.addEventListener(evt,()=>{pressed.left=false;pressed.right=false});
 const key=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){pressed[e.key==='ArrowLeft'?'left':'right']=true;e.preventDefault()}},up=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key))pressed[e.key==='ArrowLeft'?'left':'right']=false};
 bindKey(s,key,up);
 const reset=()=>{x=paddle;y=345;vx=(r()<.5?-1:1)*190;vy=-255;pause=1.15;combo=0;};
 function step(dt){
  elapsed+=dt;if(pressed.left)paddle=cl(paddle-475*dt,50,W-50);if(pressed.right)paddle=cl(paddle+475*dt,50,W-50);
  if(pause>0){pause-=dt;return}
  const subdivisions=3,delta=dt/subdivisions;
  for(let iter=0;iter<subdivisions;iter++){
   const px=x,py=y;x+=vx*delta;y+=vy*delta;
   if(x<=9||x>=W-9){x=cl(x,9,W-9);vx=-vx}
   if(y<=9){y=9;vy=Math.abs(vy)}
   if(vy>0&&py<376&&y>=376&&Math.abs(x-paddle)<59){
    y=376;const impact=cl((x-paddle)/58,-1,1),speed=Math.min(490,Math.hypot(vx,vy)*1.028);vx=impact*speed*.87;vy=-Math.max(170,Math.sqrt(speed*speed-vx*vx));combo=0;
   }
   for(const b of bricks){if(b.hp<=0)continue;if(x+8>b.x&&x-8<b.x+79&&y+8>b.y&&y-8<b.y+24){b.hp--;if(b.hp===0){broken++;combo++;say('Cristalli distrutti: '+broken+'/32 · Combo '+combo)}vy=-vy;break}}
   if(y>H+12){lives--;if(lives<=0){finish(s,broken*10,broken+' cristalli infranti, vite esaurite');return}reset();say('Pallina persa. Restano '+lives+' vite.',false);break}
  }
  score(s,broken*10+lives,broken+' cristalli');
  if(broken===32||elapsed>=88)finish(s,broken*10+lives,broken+' cristalli infranti · '+lives+' vite rimaste');
 }
 function draw(){
  ctx.fillStyle='#0b1e36';ctx.fillRect(0,0,W,H);
  for(let i=0;i<60;i++){ctx.fillStyle='#dae5ff';ctx.fillRect((i*199)%W,(i*73)%H,2,2)}
  for(const b of bricks){if(b.hp<=0)continue;ctx.fillStyle=colors[b.color];ctx.fillRect(b.x,b.y,79,24);ctx.fillStyle='#ffffff77';ctx.fillRect(b.x+4,b.y+3,71,4);if(b.hp===2){ctx.strokeStyle='#ffeab8';ctx.lineWidth=3;ctx.strokeRect(b.x+2,b.y+2,75,20)}}
  ctx.fillStyle='#f6db9d';ctx.fillRect(paddle-58,384,116,15);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffe2ad';ctx.font='bold 18px Arial';ctx.fillText('❤ '.repeat(lives)+'♡ '.repeat(3-lives),18,416);ctx.fillText('CRISTALLI '+broken+'/32',565,416);
 }
 canvasLoop(s,draw,step);
}

// RAILWAY: generate a guaranteed connection then scramble tile rotations.
function railway(s,g,r){
 const W=6,H=5,N=W*H;
 gameFrame(s,g,'ROTTE COMPLETATE','Ruota i binari · verifica il percorso · 3 mappe',
 '<div class="v5-railway-shell"><div class="v5-rail-head"><b id="v5-rail-round">MAPPA 1 / 3</b><span id="v5-rail-check">Collega 🚂 alla 🏁</span></div>'+
 '<div class="v5-track" id="v5-track"></div><button class="v5-primary" id="v5-test-track">▶ INVIA IL TRENO</button></div>');
 let map=0,solved=0,board=[],moves=0,started=performance.now(),ended=false;
 const clockwise={N:'E',E:'S',S:'W',W:'N'},reverse={N:'S',S:'N',E:'W',W:'E'};
 const glyph={NS:'│',EW:'─',EN:'└',ES:'┌',NW:'┘',SW:'┐'};
 const canon=xs=>xs.sort().join('');
 const rotate=(dirs,n)=>{let val=dirs.slice();for(let i=0;i<n;i++)val=val.map(x=>clockwise[x]);return val};
 const key=(x,y)=>y*W+x;
 function create(){
  board=Array.from({length:N},()=>({base:r()<.52?['N','S']:pick(r,[['E','N'],['E','S'],['N','W'],['S','W']]).slice(),rot:rand(r,0,3),route:false}));
  const path=[[0,2]];let cy=2;
  for(let x=1;x<W;x++){
   path.push([x,cy]);const target=x===W-1?2:x===W-2?2:rand(r,1,3);
   while(cy!==target){cy+=Math.sign(target-cy);path.push([x,cy]);}
  }
  path.forEach(([x,y],i)=>{
   if(i===0){board[key(x,y)]={base:['E'],rot:0,route:true};return;}
   if(i===path.length-1){board[key(x,y)]={base:['W'],rot:0,route:true};return;}
   const prev=path[i-1],next=path[i+1];
   function dir(q){return q[0]>x?'E':q[0]<x?'W':q[1]>y?'S':'N'}
   const base=[dir(prev),dir(next)];board[key(x,y)]={base,rot:rand(r,0,3),route:true};
  });
  const begins=board[2*W+0],ends=board[2*W+5];begins.rot=0;ends.rot=0;
 }
 function exits(i){return rotate(board[i].base,board[i].rot)}
 function trace(){
  let cur=key(0,2),entered=null,visited=[],steps=0;
  while(steps++<N){if(visited.includes(cur))return null;visited.push(cur);
   const dirs=exits(cur),out=dirs.find(x=>x!==entered);
   if(cur===key(5,2))return entered==='W'?visited:null;
   if(!out)return null;
   const x=cur%W,y=Math.floor(cur/W),nx=x+(out==='E'?1:out==='W'?-1:0),ny=y+(out==='S'?1:out==='N'?-1:0);
   if(nx<0||nx>=W||ny<0||ny>=H)return null;
   const next=key(nx,ny);if(!exits(next).includes(reverse[out]))return null;
   entered=reverse[out];cur=next;
  }
  return null;
 }
 function draw(checked=null){
  const holder=get('v5-track');if(!holder)return;
  holder.innerHTML=board.map((tile,i)=>{
   const d=exits(i),code=canon(d),label=i===key(0,2)?'🚂':i===key(5,2)?'🏁':glyph[code]||'⌁';
   const color=checked?.includes(i)?' correct':'';
   return '<button class="v5-track-tile'+color+(tile.route?' useful':'')+'" type="button" data-tile="'+i+'" '+(i===key(0,2)||i===key(5,2)?'disabled':'')+' aria-label="Ruota binario '+(i+1)+'">'+label+'</button>';
  }).join('');
  get('v5-rail-round').textContent='MAPPA '+(map+1)+' / 3';
 }
 function next(){
  if(s.done)return;
  if(map>=3){const spare=Math.max(0,Math.round((g.duration-(performance.now()-started)/1000)));finish(s,solved*1000+spare,solved+' rotte completate · '+moves+' rotazioni');return}
  moves=0;create();draw();say('Ruota i binari e invia il treno alla stazione.');
 }
 get('v5-track').addEventListener('click',e=>{const b=e.target.closest('[data-tile]');if(!b)return;const i=Number(b.dataset.tile);board[i].rot=(board[i].rot+1)%4;moves++;draw()});
 get('v5-test-track').addEventListener('click',()=>{
  if(ended||s.done)return;
  const p=trace();if(!p){say('La rotta è interrotta: controlla come si incastrano gli scambi.',false);return}
  ended=true;draw(p);solved++;const spare=Math.max(0,Math.round((g.duration-(performance.now()-started)/1000)));score(s,solved*1000+spare,solved+' / 3 rotte');
  say('Il treno è arrivato alla stazione! Rotta '+solved+' completata.');
  delay(s,1150,()=>{ended=false;map++;next()});
 });
 next();
}

// ASCENSORE: passenger requests, capacity, route planning and floor progression.
function liftmaster(s,g,r){
 const max=14;let floor=0,target=0,running=false,pool=[],boarded=[],delivered=0,elapsed=0,spawnClock=0,created=0,travelTimer=0,finished=false;
 gameFrame(s,g,'PASSEGGERI SERVITI','6 piani · capacità: 3 posti · pianifica le fermate',
 '<div class="v5-lift-header"><span id="v5-lift-count">0/14 consegnati</span><span id="v5-lift-capacity">CABINA 0/3</span></div>'+
 '<div class="v5-lift-building" id="v5-building"></div><div class="v5-lift-note">Tocca il piano di destinazione: l’ascensore farà fermate intermedie.</div>');
 function spawn(){
  if(created>=max)return;
  let origin=rand(r,0,5),destination=rand(r,0,5);while(destination===origin)destination=rand(r,0,5);
  pool.push({id:created,origin,dest:destination,stage:'waiting'});created++;
 }
 function service(){
  for(const p of pool.filter(x=>x.stage==='aboard'&&x.dest===floor)){p.stage='delivered';delivered++;}
  const room=3-pool.filter(x=>x.stage==='aboard').length;
  for(const p of pool.filter(x=>x.stage==='waiting'&&x.origin===floor).slice(0,room))p.stage='aboard';
  let spare=Math.max(0,Math.round(g.duration-elapsed));score(s,delivered*100+spare,delivered+' / '+max+' consegnati');
  if(delivered===max){finished=true;finish(s,delivered*100+spare,'Tutti i '+max+' passeggeri consegnati!')}
 }
 function show(){
  const building=get('v5-building');if(!building)return;
  building.innerHTML=Array.from({length:6},(_,n)=>5-n).map(n=>{
   const wait=pool.filter(x=>x.stage==='waiting'&&x.origin===n),inside=pool.filter(x=>x.stage==='aboard');
   const cab=n===floor?'<span class="v5-lift-cab">🛗 '+inside.length+'/3</span>':'<span class="v5-empty-cab">· · ·</span>';
   return '<button type="button" data-floor="'+n+'" class="v5-floor '+(n===floor?'here ':'')+(n===target&&running?'selected':'')+'"><strong>P'+n+'</strong>'+cab+
    '<span class="v5-passengers">'+(wait.length?wait.map(p=>'<b title="Destinazione piano '+p.dest+'">👤→'+p.dest+'</b>').join(''):'<i>Nessuno in attesa</i>')+'</span><span class="v5-go">VAI QUI</span></button>';
  }).join('');
  const count=get('v5-lift-count'),capacity=get('v5-lift-capacity');
  if(count)count.textContent=delivered+'/'+max+' CONSEGNATI';
  if(capacity)capacity.textContent='CABINA '+pool.filter(p=>p.stage==='aboard').length+'/3';
 }
 get('v5-building').addEventListener('click',e=>{const b=e.target.closest('[data-floor]');if(!b||s.done)return;target=Number(b.dataset.floor);running=target!==floor;if(!running)service();show()});
 const tick=setInterval(()=>{
  if(s.done)return;elapsed+=.72;spawnClock+=.72;
  if(created<max&&(created===0||spawnClock>=3.0)){spawnClock=0;spawn();if(created===1)service();}
  if(running){floor+=Math.sign(target-floor);service();if(floor===target)running=false;}
  else service();
  show();
  if(elapsed>=99){finish(s,delivered*100+Math.max(0,Math.round(g.duration-elapsed)),delivered+' passeggeri consegnati');}
 },720);
 addCleanup(s,()=>clearInterval(tick));show();
}
chooseMini=function(room,forced){
 if(forced)return 'skyline';
 const rng=rngSeed(room.code+'|curated-v5|'+Math.floor((room.round||0)/V5.length)),order=V5.map(x=>x.id);
 for(let i=order.length-1;i>0;i--){let j=rand(rng,0,i);[order[i],order[j]]=[order[j],order[i]]}
 return order[(room.round||0)%order.length];
};
rawForBot=function(p,g,room){
 if(!g||g.version!==5)return prevBot(p,g,room);
 const r=botRandom(p,g,room),base={easy:.4,normal:.63,hard:.82}[room.difficulty]||.63;
 const sk=cl(base+(character(p.avatar).trait===g.kind?.08:0),.25,.95);
 if(g.id==='skyline')return Math.round(600+sk*900+r()*190-90);
 if(g.id==='citadel'){const n=cl(Math.round(14+sk*25+(r()-.5)*9),0,42);return n*10+cl(Math.round(1+sk*6+r()*1.5),0,7)}
 if(g.id==='stellar'){const n=cl(Math.round(6+sk*24+(r()-.5)*8),0,32);return n*10+cl(Math.round(sk*3+r()),0,3)}
 if(g.id==='railway'){const maps=cl(Math.round(sk*3+(r()-.5)*1.6),0,3);return maps*1000+rand(r,0,Math.round(g.duration))}
 if(g.id==='liftmaster'){const served=cl(Math.round(sk*14+(r()-.5)*5),0,14);return served*100+rand(r,0,99)}
 return prevBot(p,g,room);
};
startMini=function(){
 const r=state.room,g=games.find(x=>x.id===r.miniId);
 if(!g||g.version!==5)return prevMini();
 const s=createTimer(g.duration);if(state.online)checkExistingSubmission(s);if(!mount())return;
 intro(g,s,()=>{const rnd=rngSeed(r.code+'|'+r.turn+'|'+g.id);
 if(g.id==='skyline')return skyline(s,g,rnd);
 if(g.id==='citadel')return citadel(s,g,rnd);
 if(g.id==='stellar')return stellar(s,g,rnd);
 if(g.id==='railway')return railway(s,g,rnd);
 if(g.id==='liftmaster')return liftmaster(s,g,rnd);
 });
};
if(state.view==='home')render();
})();