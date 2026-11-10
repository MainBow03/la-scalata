/* LA SCALATA — Arcade Lab v4: nuove meccaniche e catalogo */
(function(){
'use strict';
const ADDITIONS=[
 {id:'railcraft',name:'Binari del Caos',desc:'Ruota gli scambi e costruisci un percorso ferroviario funzionante.',symbol:'🚂',kind:'strategy',duration:112,how:'Ruota i binari toccandoli: unisci il treno a sinistra con la stazione a destra. Quattro mappe, diverse soluzioni possibili.',mechanic:'Costruzione di percorsi',version:4,reborn:true},
 {id:'maze',name:'Labirinto Cangiante',desc:'Esplora, raccogli chiavi e raggiungi il portale prima del tempo.',symbol:'🗝️',kind:'strategy',duration:112,how:'Muoviti con le frecce o il pad, raccogli tre chiavi e raggiungi l’uscita. Due labirinti generati ogni partita.',mechanic:'Esplorazione e navigazione',version:4,reborn:true},
 {id:'fortress',name:'Assedio al Castello',desc:'Scegli una corsia e difendi le porte dalle ondate nemiche.',symbol:'🏰',kind:'quick',duration:88,how:'Sposta il cannone fra tre corsie e spara ai nemici prima che raggiungano il portone. Alcuni hanno due corazze.',mechanic:'Difesa attiva e mira',version:4,reborn:true},
 {id:'mosaic',name:'Mosaico Smarrito',desc:'Ricostruisci il quadro facendo scorrere le tessere.',symbol:'🧩',kind:'clever',duration:104,how:'Sposta solo le tessere adiacenti allo spazio vuoto: rimetti gli otto simboli nell’ordine originale. Tre mosaici sempre risolvibili.',mechanic:'Puzzle scorrevole',version:4,reborn:true},
 {id:'elevator',name:'Ascensore Impazzito',desc:'Trasporta passeggeri tra sei piani senza perdere tempo.',symbol:'🛗',kind:'strategy',duration:97,how:'Guida l’ascensore con SU e GIÙ. I passeggeri salgono automaticamente, ma ci sono solo tre posti: pianifica i tragitti.',mechanic:'Gestione risorse e tragitti',version:4,reborn:true},
 {id:'runner',name:'Fuga sui Tetti',desc:'Corri, salta le casse e scivola sotto le travi.',symbol:'🏃',kind:'quick',duration:78,how:'Usa SALTA per superare le casse e SCIVOLA per passare sotto le travi. Gli ostacoli arrivano sempre più veloci.',mechanic:'Platform runner',version:4,reborn:true},
 {id:'breakout',name:'Flipper del Firmamento',desc:'Muovi la racchetta e distruggi i cristalli con la pallina.',symbol:'🌌',kind:'quick',duration:95,how:'Muovi la racchetta con il mouse, le frecce o il touch. Non lasciare cadere la pallina e distruggi quanti più cristalli puoi.',mechanic:'Fisica e controllo',version:4,reborn:true}
];
for(const g of ADDITIONS)games.unshift(g);
const previousHome=home, previousMini=startMini, previousBot=rawForBot, previousChoose=chooseMini;
const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const cap=n=>Math.round(clamp(n,0,100));
const randomInt=(rng,a,b)=>a+Math.floor(rng()*(b-a+1));
function hashRandom(key){let n=2166136261;for(const c of String(key)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296}}
function roundRng(id){return hashRandom([state.room?.code,state.room?.turn,id].join('~'))}
function delay(s,ms,fn){let id=setTimeout(()=>{if(state.mini===s&&!s.done)fn()},ms);s.timeouts.push(id);return id}
function onCleanup(s,fn){const old=s.cleanup;s.cleanup=()=>{fn();old?.()}}
function mount(){return miniMount()}
function displayFrame(g,s,round,total,score,body,helper){const m=mount();if(!m)return;
 m.innerHTML='<div class="arc-status"><span>FASE <b id="arc-round">'+(round+1)+'</b> / '+total+'</span><span>PRESTAZIONE <b id="arc-points">'+cap(score)+'</b>/100</span></div><div class="arc-timeline"><i id="arc-progress" style="width:'+(round/total*100)+'%"></i></div><div class="arc-stage">'+body+'</div><div id="arc-feedback" class="arc-feedback">'+escapeHTML(helper||g.how)+'</div>';}
function status(msg,good=true){const e=document.querySelector('#arc-feedback');if(e){e.textContent=msg;e.className='arc-feedback '+(good?'arc-good':'arc-bad')}}
function value(score){const e=document.querySelector('#arc-points');if(e)e.textContent=String(cap(score))}
function done(s,raw,note){if(!s.done)finishMini(cap(raw),note)}
function introduce(g,s,go){const m=mount();if(!m)return;let opened=false;
 function launch(){if(opened||s.done)return;opened=true;go()}
 m.innerHTML='<div class="arc-welcome"><div class="arc-welcome-art">'+g.symbol+'</div><span class="arc-kicker">ARCADE LAB · NUOVE REGOLE</span><h3>'+escapeHTML(g.name)+'</h3><p>'+escapeHTML(g.how)+'</p><div class="arc-welcome-tags"><span>🎮 '+escapeHTML(g.mechanic)+'</span><span>⏳ '+g.duration+' SEC MAX</span></div><button type="button" class="arc-main-button" id="arc-ready">INIZIA LA SFIDA</button><small>Il gioco comincia automaticamente dopo 4 secondi.</small></div>';
 m.querySelector('#arc-ready').addEventListener('click',launch);delay(s,4000,launch)
}

// BINARI: griglia di pezzi orientabili, un percorso reale verificato tramite ricerca di connessioni.
const PATHS=[
 [10,11,12,13,14],
 [10,5,6,7,8,9,14],
 [10,15,16,17,18,19,14],
 [10,5,0,1,2,3,4,9,14]
];
const DIRS=[[-1,0],[0,1],[1,0],[0,-1]];
const BASE={straight:[0,2],bend:[0,1],end:[0]};
const svgRail=type=>{const part={straight:'<path d="M50 0V100"/>',bend:'<path d="M50 0V50H100"/>',end:'<path d="M50 0V50"/>'};return '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="rail-outer" d="'+(type==='straight'?'M50 0V100':type==='bend'?'M50 0V50H100':'M50 0V50')+'"/><g class="rail-inner">'+part[type]+'</g><circle cx="50" cy="50" r="8"/></svg>'};
function dirs(tile){return BASE[tile.type].map(x=>(x+tile.rot)%4)}
function railSolved(tiles){const visited=new Set([10]),q=[10];while(q.length){const p=q.shift();if(p===14)return true;const row=Math.floor(p/5),col=p%5;for(const dir of dirs(tiles[p])){const rr=row+DIRS[dir][0],cc=col+DIRS[dir][1];if(rr<0||rr>=5||cc<0||cc>=5)continue;const nb=rr*5+cc;if(visited.has(nb)||!dirs(tiles[nb]).includes((dir+2)%4))continue;visited.add(nb);q.push(nb)}}return false}
function railGame(g,s,rng){let level=0,score=0,blocked=false,deadline=null,railStart=0,rotations=0;
 function setLevel(){if(s.done)return;if(level>=4)return done(s,score,'Ferrovia completata!');
  const path=PATHS[level],tiles=Array.from({length:25},()=>({type:rng()<.4?'straight':'bend',rot:randomInt(rng,0,3)}));
  const direction=(from,to)=>{const delta=to-from;return delta===-5?0:delta===1?1:delta===5?2:3};
  path.forEach((p,i)=>{const needed=[];if(i)needed.push(direction(p,path[i-1]));if(i<path.length-1)needed.push(direction(p,path[i+1]));const type=needed.length===1?'end':(Math.abs(needed[0]-needed[1])===2?'straight':'bend');let correct=0;for(let z=0;z<4;z++)if(BASE[type].map(v=>(v+z)%4).every(v=>needed.includes(v))){correct=z;break}tiles[p]={type,rot:(correct+(p===10||p===14?0:randomInt(rng,1,3)))%4,fixed:p===10||p===14}});
  railStart=performance.now();rotations=0;blocked=false;
  const body='<div class="v4-description">RUOTA I BINARI per collegare 🚂 a 🏁. Nessuna risposta casuale: il treno parte soltanto se il circuito è continuo.</div><div class="v4-rail-grid" id="v4-rails">'+tiles.map((t,p)=>'<button class="v4-rail '+(t.fixed?'fixed':'')+'" data-rail="'+p+'" '+(t.fixed?'disabled':'')+' aria-label="Ruota il binario '+(p+1)+'"><span class="v4-rail-svg" style="transform:rotate('+(t.rot*90)+'deg)">'+svgRail(t.type)+'</span>'+(p===10?'<b>🚂</b>':p===14?'<b>🏁</b>':'')+'</button>').join('')+'</div><div class="v4-progress-text">MAPPA '+(level+1)+'/4 · '+(4-level)*25+' punti ancora possibili</div>';
  displayFrame(g,s,level,4,score,body,'Tocca un binario per ruotarlo di 90°. Puoi fare quanti tentativi vuoi.');
  const grid=mount().querySelector('#v4-rails');
  grid.addEventListener('click',e=>{if(blocked||s.done)return;const el=e.target.closest('[data-rail]');if(!el)return;const p=Number(el.dataset.rail);if(tiles[p].fixed)return;tiles[p].rot=(tiles[p].rot+1)%4;rotations++;el.querySelector('.v4-rail-svg').style.transform='rotate('+(tiles[p].rot*90)+'deg)';
   if(railSolved(tiles)){blocked=true;clearTimeout(deadline);const elapsed=(performance.now()-railStart)/1000;const award=clamp(Math.round(25-elapsed*.17-Math.max(0,rotations-10)*.35),9,25);score+=award;s.raw=cap(score);value(score);status('🚂 Treno in stazione! +'+award+' punti · '+rotations+' rotazioni.');delay(s,1050,()=>{level++;setLevel()})}
  });
  deadline=delay(s,24000,()=>{if(blocked)return;blocked=true;status('⏱ Tempo scaduto, nuova mappa! Non perdere il treno.',false);delay(s,850,()=>{level++;setLevel()})});
 }
 setLevel();
}

// LABIRINTO: generatore DFS che garantisce sempre un percorso attraversabile.
function createMaze(rng){const w=9,h=9,field=Array(w*h).fill('#'),seen=new Set([10]),stack=[[1,1]];field[10]=' ';
 while(stack.length){const [r,c]=stack[stack.length-1],choices=[];for(const [dr,dc] of DIRS){const rr=r+dr*2,cc=c+dc*2;if(rr>0&&rr<8&&cc>0&&cc<8&&!seen.has(rr*9+cc))choices.push([rr,cc,dr,dc])}
  if(choices.length){const [rr,cc,dr,dc]=choices[randomInt(rng,0,choices.length-1)];field[(r+dr)*9+c+dc]=' ';field[rr*9+cc]=' ';seen.add(rr*9+cc);stack.push([rr,cc])}else stack.pop();}
 const options=field.map((x,i)=>x===' '?i:null).filter(i=>i!==null&&i!==10&&i!==70),picked=[];
 for(let j=0;j<3;j++){const ix=randomInt(rng,0,options.length-1);picked.push(options.splice(ix,1)[0]);}
 return {field,keys:picked,exit:70,position:10};
}
function mazeGame(g,s,rng){let level=0,points=0,maze=null,held=0,steps=0,started=0,deadline=null,lock=false;const keysDown=new Set();
 const directions={ArrowUp:-9,ArrowDown:9,ArrowLeft:-1,ArrowRight:1};
 const keyListener=e=>{if(!maze||s.done||lock||!(e.key in directions))return;e.preventDefault();step(directions[e.key])};
 document.addEventListener('keydown',keyListener);onCleanup(s,()=>document.removeEventListener('keydown',keyListener));
 function show(){if(s.done)return;if(level===2)return done(s,points,'Labirinti completati!');maze=createMaze(rng);held=0;steps=0;lock=false;started=performance.now();
  displayFrame(g,s,level,2,points,'<div class="v4-description">Trova <b>tutte e tre le chiavi</b> e raggiungi il portale viola. I muri sono invalicabili.</div><div class="v4-maze" id="v4-maze"></div><div class="v4-maze-controls"><button data-dir="-9" aria-label="Su">▲</button><div><button data-dir="-1" aria-label="Sinistra">◀</button><button data-dir="9" aria-label="Giù">▼</button><button data-dir="1" aria-label="Destra">▶</button></div></div><div class="v4-progress-text" id="v4-maze-status">CHIAVI 0/3 · PASSI 0</div>','Controlli: frecce della tastiera oppure pulsanti sullo schermo.');
  const buttons=mount().querySelector('.v4-maze-controls');buttons.addEventListener('click',e=>{const btn=e.target.closest('[data-dir]');if(btn)step(Number(btn.dataset.dir))});paint();
  deadline=delay(s,45000,()=>end(false));
 }
 function paint(){const box=mount().querySelector('#v4-maze');if(!box||!maze)return;box.innerHTML=maze.field.map((cell,i)=>'<div class="v4-maze-tile '+(cell==='#'?'wall':'path')+' '+(i===maze.position?'player':'')+'">'+(i===maze.position?'🧑‍🚀':maze.keys.includes(i)?'🗝️':i===maze.exit?'🌀':'')+'</div>').join('');const txt=mount().querySelector('#v4-maze-status');if(txt)txt.textContent='CHIAVI '+held+'/3 · PASSI '+steps}
 function step(d){if(!maze||lock||s.done)return;const from=maze.position,to=from+d;if(to<0||to>=81||maze.field[to]==='#')return;if(d===1&&from%9===8||d===-1&&from%9===0)return;
  maze.position=to;steps++;const k=maze.keys.indexOf(to);if(k!==-1){maze.keys.splice(k,1);held++;points+=4;s.raw=cap(points);value(points);status('🗝️ Chiave raccolta! '+held+'/3')}
  paint();if(maze.position===maze.exit&&held===3)end(true);
 }
 function end(win){if(lock||s.done)return;lock=true;clearTimeout(deadline);if(win){const elapsed=(performance.now()-started)/1000;const award=clamp(Math.round(38-elapsed*.35-Math.max(0,steps-32)*.15),22,38);points+=award;s.raw=cap(points);status('🎉 Portale attraversato! +'+award+' punti.')}else status('⏱ Il labirinto cambia! Hai conservato le chiavi raccolte.',false);
  maze=null;delay(s,1250,()=>{level++;show()});
 }
 show();
}

// FORTEZZA: torretta con corsia attiva, mira, cadenza di tiro e nemici multipli.
function fortressGame(g,s,rng){let selected=1,enemies=[],shots=0,kills=0,spawned=0,gate=7,lastShot=0,frameCount=0;const max=36,intervalMs=90;let tick=0;const started=performance.now();
 displayFrame(g,s,0,3,0,'<div class="v4-description">Controlla la <b>corsia del cannone</b>. Rosso = nemici resistenti. Cerca di non perdere le 7 vite del portone.</div><div class="v4-fortress"><div class="v4-fortress-head">🏰 PORTONE <strong id="v4-gate">❤❤❤❤❤❤❤</strong> <span id="v4-kills">0 eliminati</span></div><div id="v4-enemies" class="v4-enemies"></div></div><div class="v4-controls"><button data-fortress="prev">▲ CORSIA SU</button><button data-fortress="fire" class="v4-fire">💥 SPARA</button><button data-fortress="next">▼ CORSIA GIÙ</button></div><div class="v4-progress-text" id="v4-ammo">Cannone centrale · 0/'+max+' nemici</div>','Spostati con ↑ ↓; premi SPAZIO o SPARA. Ogni colpo ha una breve ricarica.');
 const controls=mount().querySelector('.v4-controls');
 function act(type){if(s.done)return;if(type==='prev')selected=Math.max(0,selected-1);if(type==='next')selected=Math.min(2,selected+1);if(type==='fire')fire();paint()}
 controls.addEventListener('click',e=>{const b=e.target.closest('[data-fortress]');if(b)act(b.dataset.fortress)});
 const key=e=>{if(!['ArrowUp','ArrowDown',' ','Spacebar'].includes(e.key)||s.done)return;e.preventDefault();act(e.key==='ArrowUp'?'prev':e.key==='ArrowDown'?'next':'fire')};document.addEventListener('keydown',key);
 function fire(){const now=performance.now();if(now-lastShot<410)return;lastShot=now;shots++;const targets=enemies.filter(a=>a.lane===selected).sort((a,b)=>a.distance-b.distance);if(targets.length){targets[0].hp--;if(targets[0].hp<=0){kills++;enemies=enemies.filter(a=>a!==targets[0]);status('🎯 Nemico abbattuto! '+kills+'/'+max)}}}
 function paint(){const box=mount().querySelector('#v4-enemies');if(!box)return;box.innerHTML=Array.from({length:3},(_,lane)=>'<div class="v4-fortress-lane '+(lane===selected?'selected':'')+'"><span class="v4-cannon">'+(lane===selected?'💥':'◈')+'</span>'+enemies.filter(e=>e.lane===lane).map(e=>'<span class="v4-foe" style="left:'+(85-e.distance*9)+'%">'+(e.hp===2?'🛡️':'👾')+'</span>').join('')+'</div>').join('');const g=mount().querySelector('#v4-gate'),k=mount().querySelector('#v4-kills'),a=mount().querySelector('#v4-ammo');if(g)g.textContent='❤'.repeat(gate)+'♡'.repeat(7-gate);if(k)k.textContent=kills+' abbattuti';if(a)a.textContent='Corsia '+(selected+1)+' · Ondata '+Math.min(3,Math.floor(spawned/11)+1)}
 tick=setInterval(()=>{if(s.done)return;frameCount++;if(spawned<max&&frameCount%15===0){spawned++;enemies.push({lane:randomInt(rng,0,2),distance:8.4,hp:spawned%5===0?2:1})}
  for(const e of enemies)e.distance-=.16+(spawned>22?.03:0);const reached=enemies.filter(e=>e.distance<=0);if(reached.length){gate=Math.max(0,gate-reached.length);enemies=enemies.filter(e=>e.distance>0)}
  s.raw=cap((kills/max*.79+gate/7*.21)*100);value(s.raw);paint();if(gate<=0||spawned===max&&enemies.length===0||performance.now()-started>77000)done(s,s.raw,'Assedio concluso · '+kills+' difensori eliminati');
 },intervalMs);
 onCleanup(s,()=>{clearInterval(tick);document.removeEventListener('keydown',key)});paint();
}

// MOSAICO: classico 8-puzzle ma sempre creato da mosse legali, senza griglie impossibili.
const ICONS=['🌞','🌜','🦋','🔥','💎','🌿','❄️','👑'];
function mosaicGame(g,s,rng){let level=0,points=0,board=[],moves=0,started=0,locked=false,deadline=null;
 function initial(){board=Array.from({length:9},(_,i)=>i===8?0:i+1);let previous=-1;const steps=[12,17,22][level];for(let m=0;m<steps;m++){const blank=board.indexOf(0),x=blank%3,y=Math.floor(blank/3),around=[blank-3,blank+3,blank-1,blank+1].filter(p=>p>=0&&p<9&&((Math.abs(p-blank)===1&&Math.floor(p/3)===y)||Math.abs(p-blank)===3)&&p!==previous);const select=around[randomInt(rng,0,around.length-1)];board[blank]=board[select];board[select]=0;previous=blank;}if(solved())return initial();}
 function solved(){return board.every((v,i)=>v===(i===8?0:i+1))}
 function show(){if(s.done)return;if(level>=3)return done(s,points,'Mosaici ricostruiti: '+level+'/3');locked=false;moves=0;initial();started=performance.now();
  displayFrame(g,s,level,3,points,'<div class="v4-description">Fai scorrere le tessere adiacenti allo spazio libero. Ricomponi l’immagine in ordine <b>da sinistra a destra</b>.</div><div class="v4-mosaic-preview">ORDINE CORRETTO: '+ICONS.join(' ')+'</div><div class="v4-mosaic" id="v4-mosaic"></div><div class="v4-progress-text" id="v4-mosaic-steps">0 mosse · quadro '+(level+1)+'/3</div>','Tocca una tessera vicino alla casella vuota. Le combinazioni sono sempre risolvibili.');paint();deadline=delay(s,30000,()=>finish(false));
 }
 function paint(){const node=mount().querySelector('#v4-mosaic');if(!node)return;node.innerHTML=board.map((v,i)=>'<button '+(v===0?'disabled':'')+' class="v4-mosaic-tile '+(v===0?'blank':'')+'" data-mosaic="'+i+'" aria-label="Tessera '+(v||'vuota')+'">'+(v?'<span>'+ICONS[v-1]+'</span><small>'+v+'</small>':'')+'</button>').join('');const txt=mount().querySelector('#v4-mosaic-steps');if(txt)txt.textContent=moves+' mosse · quadro '+(level+1)+'/3'}
 function finish(win){if(locked||s.done)return;locked=true;clearTimeout(deadline);if(win){const elapsed=(performance.now()-started)/1000;const award=clamp(Math.round(35-elapsed*.3-Math.max(0,moves-15)*.35),20,35);points+=award;s.raw=cap(points);status('🧩 Mosaico completato! +'+award+' punti.')}else status('⏱ Cambia il quadro: prova il prossimo mosaico.',false);delay(s,1000,()=>{level++;show()})}
 mount().addEventListener('click',e=>{if(s.done||locked)return;const btn=e.target.closest('[data-mosaic]');if(!btn)return;const i=Number(btn.dataset.mosaic),b=board.indexOf(0);if(!([i-3,i+3,i-1,i+1].includes(b))||Math.abs(i-b)===1&&Math.floor(i/3)!==Math.floor(b/3))return;board[b]=board[i];board[i]=0;moves++;paint();if(solved())finish(true)});
 show();
}

// ASCENSORE: scelta di traiettorie con coda e capienza, non scelta multipla.
function elevatorGame(g,s,rng){let floor=1,car=[],waiting=[],delivered=0,moves=0,elapsed=0,total=19,locked=false,spawned=0,lastMove=0;const levels=6,capacity=3,goal=12;let ticker;
 function addPassenger(){if(spawned>=total)return;const from=randomInt(rng,1,levels);let to=randomInt(rng,1,levels);if(to===from)to=to===6?1:to+1;waiting.push({from,to,id:spawned});spawned++}
 for(let i=0;i<8;i++)addPassenger();
 displayFrame(g,s,0,goal,0,'<div class="v4-description">Puoi trasportare <b>massimo 3 passeggeri</b>. Fermandoti a un piano fai salire chi aspetta e scendere chi è arrivato.</div><div class="v4-elevator"><div id="v4-floors"></div><div class="v4-car"><span>🛗 PIANO <b id="v4-current">1</b></span><span id="v4-passengers">0/3 a bordo</span></div></div><div class="v4-controls"><button data-elevator="up">▲ SALI</button><button data-elevator="load">🚪 APRI PORTE</button><button data-elevator="down">▼ SCENDI</button></div><div class="v4-progress-text" id="v4-deliveries">0/'+goal+' persone trasportate</div>','I numeri sui passeggeri indicano il piano di destinazione.');
 const controls=mount().querySelector('.v4-controls');controls.addEventListener('click',e=>{const b=e.target.closest('[data-elevator]');if(b)go(b.dataset.elevator)});
 const onKey=e=>{if(!['ArrowUp','ArrowDown','Enter'].includes(e.key)||s.done)return;e.preventDefault();go(e.key==='ArrowUp'?'up':e.key==='ArrowDown'?'down':'load')};document.addEventListener('keydown',onKey);
 function load(){const leaving=car.filter(p=>p.to===floor);delivered+=leaving.length;car=car.filter(p=>p.to!==floor);let ready=waiting.filter(p=>p.from===floor);for(const passenger of ready){if(car.length>=capacity)break;car.push(passenger);waiting=waiting.filter(p=>p!==passenger)}s.raw=cap(delivered/goal*85+(delivered>0?Math.max(0,15-moves*.45-elapsed*.13):0));value(s.raw);if(leaving.length)status('🎉 Consegnati '+leaving.length+' passeggeri al piano '+floor+'!')}
 function paint(){const box=mount().querySelector('#v4-floors');if(!box)return;box.innerHTML=Array.from({length:levels},(_,i)=>{const n=levels-i,queue=waiting.filter(p=>p.from===n).map(p=>'<span class="v4-passenger" title="Vuole il piano '+p.to+'">→'+p.to+'</span>').join('');return '<div class="v4-floor '+(n===floor?'active':'')+'"><b>'+n+'°</b><span class="v4-floor-queue">'+(queue||'—')+'</span><span class="v4-floor-shaft">'+(n===floor?'🛗':'│')+'</span></div>'}).join('');const current=mount().querySelector('#v4-current'),ps=mount().querySelector('#v4-passengers'),count=mount().querySelector('#v4-deliveries');if(current)current.textContent=String(floor);if(ps)ps.textContent=car.length+'/3 · destinazioni: '+(car.map(p=>p.to).join(', ')||'nessuna');if(count)count.textContent=delivered+'/'+goal+' persone trasportate · '+moves+' fermate'}
 function go(act){if(s.done||locked)return;const now=performance.now();if(now-lastMove<330)return;if(act==='up'&&floor<6){floor++;moves++;lastMove=now}else if(act==='down'&&floor>1){floor--;moves++;lastMove=now}else if(act!=='load')return;load();paint();if(delivered>=goal)done(s,s.raw,'Ascensore efficiente! '+delivered+' consegne.');}
 load();paint();ticker=setInterval(()=>{if(s.done)return;elapsed++;if(elapsed%5===0){addPassenger();paint()}if(elapsed>=87)done(s,s.raw,'Viaggio terminato · '+delivered+' consegne')},1000);
 onCleanup(s,()=>{clearInterval(ticker);document.removeEventListener('keydown',onKey)})
}

// RUNNER: collisioni reali tra avatar e ostacoli a terra / sospesi.
function runnerGame(g,s,rng){let phase='run',until=0,obstacles=[],created=0,passed=0,hits=0,elapsed=0,frameTick=0,last=performance.now();const max=32;
 displayFrame(g,s,0,3,0,'<div class="v4-description">🟠 Cassa = <b>SALTA</b> · 🔵 Trave = <b>SCIVOLA</b>. L’accelerazione aumenta gradualmente.</div><div class="v4-runner"><div class="v4-runner-sky">☁️ ✨ ☁️</div><div class="v4-runner-avatar" id="v4-runner-avatar">🏃</div><div class="v4-runner-obstacles" id="v4-runner-obstacles"></div><div class="v4-runner-floor"></div></div><div class="v4-runner-stats">❤ <span id="v4-runner-hearts">♥♥♥♥</span><span id="v4-runner-distance">0 ostacoli superati</span></div><div class="v4-controls"><button data-runner="jump">▲ SALTA</button><button data-runner="duck">▼ SCIVOLA</button></div>','SPACE oppure ↑ per saltare, ↓ per scivolare.');
 function action(which){if(s.done)return;const now=performance.now();if(now<until)return;phase=which;until=now+720;paint()}
 mount().querySelector('.v4-controls').addEventListener('click',e=>{const b=e.target.closest('[data-runner]');if(b)action(b.dataset.runner)});
 const listener=e=>{if(s.done||![' ','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();action(e.key==='ArrowDown'?'duck':'jump')};document.addEventListener('keydown',listener);
 function paint(){const avatar=mount().querySelector('#v4-runner-avatar'),holder=mount().querySelector('#v4-runner-obstacles');if(avatar){avatar.className='v4-runner-avatar '+phase;avatar.textContent=phase==='duck'?'🛝':phase==='jump'?'🤸':'🏃'}if(holder)holder.innerHTML=obstacles.map(o=>'<span class="v4-obstacle '+o.type+'" style="left:'+o.x+'%">'+(o.type==='low'?'📦':'▬')+'</span>').join('');const h=mount().querySelector('#v4-runner-hearts'),d=mount().querySelector('#v4-runner-distance');if(h)h.textContent='♥'.repeat(4-hits)+'♡'.repeat(hits);if(d)d.textContent=passed+' ostacoli superati'}
 const tick=setInterval(()=>{if(s.done)return;const now=performance.now(),delta=Math.min((now-last)/1000,.12);last=now;elapsed+=delta;if(now>=until&&phase!=='run')phase='run';frameTick++;
  if(created<max&&frameTick%Math.max(16,Math.round(25-elapsed/7))===0){obstacles.push({x:110,type:rng()<.52?'low':'high',hit:false});created++}
  const velocity=26+Math.min(19,elapsed*.36);for(const ob of obstacles){const before=ob.x;ob.x-=velocity*delta;if(before>16&&ob.x<=16&&!ob.hit){ob.hit=true;if(ob.type==='low'&&phase!=='jump'||ob.type==='high'&&phase!=='duck'){hits++;status('💥 Ostacolo colpito: cambia movimento!',false)}else{passed++;status('✅ Ostacolo superato!')}}}obstacles=obstacles.filter(o=>o.x>-8);
  s.raw=cap((passed/max*.85+(4-hits)/4*.15)*100);value(s.raw);paint();if(hits>=4||created===max&&obstacles.length===0||elapsed>=72)done(s,s.raw,'Fuga terminata · '+passed+'/'+max+' ostacoli superati');
 },70);onCleanup(s,()=>{clearInterval(tick);document.removeEventListener('keydown',listener)});paint();
}

// FLIPPER: mini-gioco fisico in canvas con collisioni, bersagli e paddle.
function breakoutGame(g,s,rng){const W=480,H=300;let paddle=240,x=235,y=220,vx=2.7,vy=-3.6,lives=3,hit=0,bricks=[],tick=0,raf=0,last=0;
 for(let r=0;r<4;r++)for(let c=0;c<7;c++)bricks.push({x:24+c*62,y:26+r*24,alive:true,color:(r+c)%4});
 displayFrame(g,s,0,1,0,'<div class="v4-description">Sposta la racchetta e rompi i 28 cristalli. Tre palline disponibili!</div><canvas id="v4-breakout" width="'+W+'" height="'+H+'" aria-label="Area flipper delle stelle"></canvas><div class="v4-controls"><button data-paddle="left">◀ SINISTRA</button><button data-paddle="right">DESTRA ▶</button></div><div class="v4-progress-text" id="v4-breakout-info">28 cristalli · ♥ 3 palline</div>','Usa mouse o dito sulla pista; in alternativa tieni premuta una freccia.');
 const canvas=mount().querySelector('#v4-breakout'),ctx=canvas.getContext('2d');const pressed={left:false,right:false};
 function point(e){const rect=canvas.getBoundingClientRect();paddle=clamp((e.clientX-rect.left)/Math.max(1,rect.width)*W,42,W-42)}
 canvas.addEventListener('pointermove',point);canvas.addEventListener('pointerdown',e=>{point(e);canvas.setPointerCapture(e.pointerId)});
 const controls=mount().querySelector('.v4-controls');const down=e=>{const b=e.target.closest('[data-paddle]');if(b){pressed[b.dataset.paddle]=true;e.preventDefault()}},up=()=>{pressed.left=false;pressed.right=false};controls.addEventListener('pointerdown',down);controls.addEventListener('pointerup',up);controls.addEventListener('pointercancel',up);controls.addEventListener('pointerleave',up);
 const keydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();pressed[e.key==='ArrowLeft'?'left':'right']=true}},keyup=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')pressed[e.key==='ArrowLeft'?'left':'right']=false};document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);
 const colors=['#8acbff','#f5bd80','#c59ef3','#81e1c0'];
 function draw(){ctx.fillStyle='#0c1f33';ctx.fillRect(0,0,W,H);ctx.fillStyle='#123754';for(let a=0;a<28;a++){ctx.fillRect((a*67)%W,(a*113)%H,2,2)}
  for(const b of bricks){if(!b.alive)continue;ctx.fillStyle=colors[b.color];ctx.fillRect(b.x,b.y,56,17);ctx.fillStyle='#ffffff55';ctx.fillRect(b.x+4,b.y+2,48,3)}
  ctx.fillStyle='#f9dc9b';ctx.fillRect(paddle-43,H-28,86,12);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6fdcea';ctx.stroke();
  const info=mount().querySelector('#v4-breakout-info');if(info)info.textContent=(28-hit)+' cristalli · ♥ '+lives+' palline'}
 function frame(ts){if(s.done)return;if(!last)last=ts;const dt=Math.min((ts-last)/16.67,2.2);last=ts;
  if(pressed.left)paddle=clamp(paddle-6.5*dt,43,W-43);if(pressed.right)paddle=clamp(paddle+6.5*dt,43,W-43);
  x+=vx*dt;y+=vy*dt;if(x<8||x>W-8){x=clamp(x,8,W-8);vx*=-1}if(y<8){y=8;vy=Math.abs(vy)}
  if(vy>0&&y>=H-36&&y<=H-17&&Math.abs(x-paddle)<50){y=H-36;vy=-Math.abs(vy);vx=clamp(vx+(x-paddle)/15,-5.4,5.4)}
  for(const b of bricks){if(!b.alive)continue;if(x+7>b.x&&x-7<b.x+56&&y+7>b.y&&y-7<b.y+17){b.alive=false;hit++;vy=-vy;s.raw=cap(hit/28*100);value(s.raw);break}}
  if(y>H+8){lives--;if(lives===0){done(s,s.raw,'Cristalli infranti: '+hit+'/28');return}x=paddle;y=200;vx=(rng()<.5?-1:1)*2.7;vy=-3.8}
  draw();if(hit===28)done(s,100,'Tutti i cristalli distrutti!');else raf=requestAnimationFrame(frame);
 }
 raf=requestAnimationFrame(frame);onCleanup(s,()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup)});
}

// CATALOGO: mostra solo giochi selezionabili nelle nuove partite; classici di archivio separati.
const categories=[['all','Tutti'],['quick','Riflessi & Arcade'],['clever','Logica'],['strategy','Strategia']];
let chosenCategory='all',search='',expanded=null;
const RETAINED=new Set(['garden','clockwork','market','dive','meteor','guardians','heartbeat','echo','cipher']);
const activeGames=()=>games.filter(g=>g.version===5);
const archivedGames=()=>games.filter(g=>g.version!==5);
function catalogHtml(){const all=activeGames();const shown=all.filter(g=>(chosenCategory==='all'||g.kind===chosenCategory)&&[g.name,g.desc,g.how,g.mechanic].join(' ').toLowerCase().includes(search.toLowerCase()));
 const card=g=>'<button type="button" class="v4-catalog-card '+(g.id===expanded?'selected':'')+'" data-catalog-game="'+g.id+'"><span class="v4-game-symbol">'+g.symbol+'</span><span class="v4-game-meta">'+(g.version===5?'MISSIONE RINNOVATA':'CLASSICO')+' · '+Math.round(g.duration)+' SEC</span><strong>'+escapeHTML(g.name)+'</strong><small>'+escapeHTML(g.desc)+'</small><span class="v4-game-more">'+(expanded===g.id?'▲ NASCONDI REGOLE':'＋ VEDI REGOLE')+'</span>'+(expanded===g.id?'<span class="v4-game-rules">🎯 '+escapeHTML(g.how)+'<br>🎮 '+escapeHTML(g.mechanic||({quick:'Riflessi',clever:'Logica',strategy:'Strategia'}[g.kind]||'Sfida'))+'</span>':'')+'</button>';
 return '<main class="v4-catalog-page"><header class="v4-catalog-heading"><div><p class="eyebrow">✦ LA SCALATA · SALA DEI GIOCHI</p><h1 class="section-title">IL CATALOGO DEI MINIGIOCHI</h1><p class="lead">Esplora le prove, scopri le regole e preparati alla corsa verso il trono.</p></div><button class="btn btn-ghost" data-catalog="back">← TORNA AL MENU</button></header><section class="v4-catalog-stats"><span>🎮 <b>'+all.length+'</b> MINIGIOCHI NELLA ROTAZIONE</span><span>🧩 <b>'+activeGames().length+'</b> MISSIONI COMPLETAMENTE RIELABORATE</span><span>👑 PREMI DAL 1° ALL’ULTIMO</span></section><div class="v4-catalog-tools"><div class="v4-catalog-filters">'+categories.map(([id,label])=>'<button class="v4-filter '+(chosenCategory===id?'current':'')+'" data-catalog-category="'+id+'">'+label+'</button>').join('')+'</div><input id="v4-catalog-search" type="search" placeholder="🔎 Cerca un minigioco..." value="'+escapeHTML(search)+'" aria-label="Cerca un minigioco"></div><div id="v4-catalog-list"><div class="v4-catalog-grid">'+shown.map(card).join('')+'</div>'+(shown.length?'':'<p class="v4-no-results">Nessun minigioco trovato. Prova un altro nome o categoria.</p>')+'</div><details class="v4-archive"><summary>📦 Archivio dei '+archivedGames().length+' minigiochi classici (non estratti nelle nuove partite)</summary><div class="v4-archive-list">'+archivedGames().map(g=>'<span>'+g.symbol+' '+escapeHTML(g.name)+'</span>').join('')+'</div></details></main>';
}
const priorHome=home;
home=function(){return priorHome().replace('data-action="open-join"', 'data-action="open-join"').replace('</div><p class="small-note">','<button class="btn v4-catalog-launch" type="button" data-catalog="open">📚 CATALOGO MINIGIOCHI ('+activeGames().length+')</button></div><p class="small-note">').replace('🎮 16 MINIGIOCHI NUOVI','🎮 '+activeGames().length+' MINIGIOCHI')};
const app=document.querySelector('#app');
function showCatalog(){state.view='catalog';chosenCategory='all';search='';expanded=null;app.innerHTML=catalogHtml();window.scrollTo({top:0,behavior:'smooth'})}
function redrawCatalog(keepFocus=false){if(state.view!=='catalog')return;let pos=0;if(keepFocus){const x=document.querySelector('#v4-catalog-search');pos=x?.selectionStart||0;}app.innerHTML=catalogHtml();if(keepFocus){const x=document.querySelector('#v4-catalog-search');x?.focus();x?.setSelectionRange(pos,pos)}}
app.addEventListener('click',e=>{const catalog=e.target.closest('[data-catalog],[data-catalog-category],[data-catalog-game]');if(!catalog)return;e.preventDefault();e.stopImmediatePropagation();
 if(catalog.dataset.catalog==='open')return showCatalog();
 if(catalog.dataset.catalog==='back'){state.view='home';return render()}
 if(catalog.dataset.catalogCategory){chosenCategory=catalog.dataset.catalogCategory;expanded=null;return redrawCatalog()}
 if(catalog.dataset.catalogGame){expanded=expanded===catalog.dataset.catalogGame?null:catalog.dataset.catalogGame;return redrawCatalog()}
},true);
app.addEventListener('input',e=>{if(e.target.id==='v4-catalog-search'){search=e.target.value;redrawCatalog(true)}},true);

// Compatibilità con l'attuale sistema stanza/Firestore.
function selectionCycle(room,cycle){
 const rng=hashRandom(room.code+'|v4-cycle|'+cycle),a=ADDITIONS.map(g=>g.id),old=games.filter(g=>RETAINED.has(g.id)).map(g=>g.id);
 function shuffle(xs){for(let i=xs.length-1;i>0;i--){const j=randomInt(rng,0,i),v=xs[i];xs[i]=xs[j];xs[j]=v}return xs}
 const list=shuffle([...shuffle(a),...shuffle(old).slice(0,5)]);
 if(cycle>0){const prev=selectionCycleUnadjusted(room,cycle-1);if(list[0]===prev[prev.length-1]){const v=list[0];list[0]=list[1];list[1]=v;}}
 return list;
}
function selectionCycleUnadjusted(room,cycle){
 const rng=hashRandom(room.code+'|v4-cycle|'+cycle),fresh=ADDITIONS.map(g=>g.id),old=games.filter(g=>RETAINED.has(g.id)).map(g=>g.id);
 function shuffle(xs){for(let i=xs.length-1;i>0;i--){const j=randomInt(rng,0,i),v=xs[i];xs[i]=xs[j];xs[j]=v}return xs}
 return shuffle([...shuffle(fresh),...shuffle(old).slice(0,5)]);
}
chooseMini=function(room,forced){if(forced)return previousChoose(room,forced);const round=Math.max(0,room.round||0),cycle=Math.floor(round/12),order=selectionCycle(room,cycle);return order[round%12]};
rawForBot=function(player,g,room){if(g?.version!==4)return previousBot(player,g,room);const rnd=botRandom(player,g,room),skill=clamp(({easy:.38,normal:.63,hard:.84}[room.difficulty]||.63)+(character(player.avatar).trait===g.kind?.10:0),.22,.96);
 let score=0;
 if(g.id==='railcraft'){for(let i=0;i<4;i++)if(rnd()<.30+skill*.67)score+=12+Math.round(skill*12)}
 else if(g.id==='maze'){for(let i=0;i<2;i++)score+=rnd()<skill?28+20*skill:Math.round(skill*11)}
 else if(g.id==='fortress'){let killed=0;for(let i=0;i<36;i++)if(rnd()<.23+skill*.69)killed++;score=killed/36*79+(4+Math.floor(skill*3))/7*21}
 else if(g.id==='mosaic'){for(let i=0;i<3;i++)if(rnd()<.20+skill*.7)score+=21+Math.round(skill*14)}
 else if(g.id==='elevator'){let delivered=0;for(let i=0;i<12;i++)if(rnd()<.26+skill*.7)delivered++;score=delivered/12*100}
 else if(g.id==='runner'){let dodge=0;for(let i=0;i<32;i++)if(rnd()<.23+skill*.72)dodge++;score=dodge/32*85+skill*15}
 else if(g.id==='breakout'){let broken=0;for(let i=0;i<28;i++)if(rnd()<.24+skill*.67)broken++;score=broken/28*100}
 return cap(score)};
startMini=function(){const room=state.room,g=games.find(x=>x.id===room.miniId);if(!g||g.version!==4)return previousMini();const s=createTimer(g.duration);if(state.online)checkExistingSubmission(s);if(!mount())return;introduce(g,s,()=>{const rng=roundRng(g.id);
 if(g.id==='railcraft')return railGame(g,s,rng);if(g.id==='maze')return mazeGame(g,s,rng);if(g.id==='fortress')return fortressGame(g,s,rng);
 if(g.id==='mosaic')return mosaicGame(g,s,rng);if(g.id==='elevator')return elevatorGame(g,s,rng);if(g.id==='runner')return runnerGame(g,s,rng);if(g.id==='breakout')return breakoutGame(g,s,rng);
})};
if(state.view==='home')render();
})();