/* LA SCALATA — Arcade Reborn, v3 */
(function () {
'use strict';
const NEW = [
 ['courier','Corriere delle Stelle','Smista carichi nel portale giusto.','🪐','clever',77,'Confronta lo stemma del pacco con il portale corretto. Dodici consegne.'],
 ['alchemy','Laboratorio Alchemico','Mescola elementi e scopri cosa nasce.','⚗️','clever',77,'Ogni ricetta ha due ingredienti: scegli la sostanza ottenuta.'],
 ['balance','Bilancia del Gigante','Scopri il peso misterioso.','⚖️','clever',77,'Risolvi la bilancia usando l’equazione mostrata.'],
 ['impostor','Maschere Intruse','Una maschera è diversa: trovala!','🎭','quick',77,'Osserva gli emblemi e tocca quello diverso dagli altri.'],
 ['runes','Ordini del Sovrano','Segui le rune dettate dal Re.','🔷','clever',77,'Scegli la forma richiesta. Leggi il comando prima di agire.'],
 ['signals','Segnali Contraddittori','La parola non è sempre ciò che sembra.','🎨','quick',77,'In alcuni round conta il colore del testo; in altri conta la parola.'],
 ['garden','Giardino delle Illusioni','Trova il fiore diverso: più sei veloce, più punti ottieni!','🌷','quick',95,'Dodici aiuole, sempre più affollate: trova il fiore con i petali di colore diverso. Ogni risposta corretta dà da 2 a 10 punti in base alla velocità!'],
 ['clockwork','Orologeria Reale','Sblocca dieci ingranaggi.','⚙️','quick',77,'Ferma la lancetta al centro della zona dorata.'],
 ['builders','Costruttori del Trono','Costruisci il monumento più preciso.','🏗️','quick',77,'Ferma il blocco esattamente sopra la base. Ogni piano è più difficile.'],
 ['market','Mercato dei Miracoli','Sicurezza o avidità? Dodici trattative.','🪙','strategy',78,'Scegli tra monete certe e scommesse rischiose. Ogni trattativa conta.'],
 ['dive','Tesoro degli Abissi','Tuffati o torna a respirare.','🌊','strategy',78,'Recupera tesori senza finire l’ossigeno. Riemergere mette al sicuro il bottino.'],
 ['meteor','Tempesta Stellare','Schiva le meteore cambiando corsia.','☄️','quick',79,'Guarda dove cadrà la meteora e spostati con frecce, tasti o tocchi.'],
 ['guardians','Guardiani del Portale','Ferma i ladri e proteggi gli alleati.','🛡️','quick',78,'Colpisci i ladri in rosso. Non toccare i guardiani amici dorati.'],
 ['heartbeat','Il Cuore del Trono','Segui una lunga sequenza ritmica.','🥁','quick',79,'Tocca il tamburo quando l’anello si illumina, una volta per battito.'],
 ['echo','Sala degli Echi','Memorizza sequenze sempre più lunghe.','🔮','clever',91,'Guarda le rune nell’ordine corretto, poi ripeti la sequenza.'],
 ['cipher','Codice del Sovrano','Apri quattro sigilli cifrati.','🔐','clever',90,'Trova quattro codici di tre cifre. Gli indizi rivelano cifre e posizioni.']
].map(([id,name,desc,symbol,kind,duration,how])=>({id,name,desc,symbol,kind,duration,how,reborn:true}));
const NEW_IDS = new Set(NEW.map(g=>g.id));
const legacyStart = startMini, legacyGame = gamePage, legacyBot = rawForBot;
games.unshift(...NEW);
const safe = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = v => Math.max(0, Math.min(100, Math.round(v)));
function randomSeed(key) { let s=2166136261;for(const c of key){s^=c.charCodeAt(0);s=Math.imul(s,16777619)}return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296}; }
const randFor = tag => randomSeed([state.room?.code,state.room?.turn,tag].join(':'));
const dice = (r,min,max) => Math.floor(r()*(max-min+1))+min;
const one = (r,arr) => arr[dice(r,0,arr.length-1)];
const mix = (r,arr) => arr.map(item=>[r(),item]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const el = selector => document.querySelector(selector);
function laterS(session,wait,fn){const t=setTimeout(()=>{if(state.mini===session&&!session.done)fn()},wait);session.timeouts.push(t);return t}
function setPoints(n){const node=el('#arc-points');if(node)node.textContent=String(norm(n))}
function setFeedback(message,good=true){const node=el('#arc-feedback');if(node){node.textContent=message;node.className='arc-feedback '+(good?'arc-good':'arc-bad')}}
function frame(round,total,points){const mount=miniMount();if(!mount)return null;mount.innerHTML=`<div class="arc-status"><span>MANCHE <b id="arc-round">${round+1}</b> / ${total}</span><span>PUNTI <b id="arc-points">${norm(points)}</b> / 100</span></div><div class="arc-timeline"><i id="arc-progress" style="width:${round/total*100}%"></i></div><div id="arc-stage" class="arc-stage"></div><div id="arc-feedback" class="arc-feedback">Osserva la prova e scegli con calma.</div>`;return mount.querySelector('#arc-stage')}
function puzzle(title,category,visual,help=''){return `<div class="arc-puzzle"><div class="arc-question"><span class="arc-kicker">${safe(category)}</span><h3>${safe(title)}</h3></div>${visual}${help?`<p class="arc-help">${safe(help)}</p>`:''}</div>`}
function done(session,points,message){if(!session.done)finishMini(norm(points),message)}
function welcome(game,begin){let started=false;const session=state.mini,m=miniMount();if(!m||!session)return;const launch=()=>{if(started||session.done)return;started=true;begin()};m.innerHTML=`<div class="arc-welcome"><div class="arc-welcome-art">${game.symbol}</div><span class="arc-kicker">ISTRUZIONI · ${safe(game.name)}</span><h3>Come si gioca?</h3><p>${safe(game.how)}</p><div class="arc-welcome-tags"><span>🏁 PIÙ MANCHE</span><span>⭐ FINO A 100 PUNTI</span><span>⏳ ${game.duration} SEC MASSIMI</span></div><button class="arc-main-button" type="button" id="arc-ready">HO CAPITO · GIOCHIAMO!</button><small>Partenza automatica tra 5 secondi · Nessuna scelta obbligatoria prima di iniziare</small></div>`;m.querySelector('#arc-ready').addEventListener('click',launch);laterS(session,5000,launch)}
function question(game,i,random){
 const COLORS=['ROSSO','BLU','VERDE','GIALLO'], HEX=['#f4798e','#58c7e8','#6fd9a9','#f9d675'];
 if(game==='courier'){
  const ICON=['☀️','🌙','⭐','❄️'],GATES=['PORTALE SOLARE','PORTALE LUNARE','PORTALE STELLARE','PORTALE GELATO'];const j=dice(random,0,3),opts=mix(random,GATES);
  return {title:'In quale portale va il pacco?',subtitle:'CONSEGNA '+(i+1),visual:`<div class="arc-big-art">📦 <span>${ICON[j]}</span></div><p class="arc-reference">☀️ SOLARE · 🌙 LUNARE · ⭐ STELLARE · ❄️ GELATO</p>`,opts,answer:opts.indexOf(GATES[j]),hint:'Destinazione: '+GATES[j]};
 }
 if(game==='alchemy'){
  const R=[['🔥 Fuoco','💧 Acqua','VAPORE'],['🌬️ Aria','🔥 Fuoco','FIAMMA VIVA'],['🌍 Terra','💧 Acqua','ARGILLA'],['❄️ Ghiaccio','🔥 Fuoco','ACQUA'],['🌱 Pianta','💧 Acqua','GERMOGLIO'],['⚡ Fulmine','🌍 Terra','MAGNETE'],['☀️ Luce','🌿 Pianta','ENERGIA'],['🌙 Ombra','🌬️ Aria','NEBBIA']];const [a,b,correct]=one(random,R),opts=mix(random,[correct,...mix(random,R.map(x=>x[2]).filter(x=>x!==correct)).slice(0,3)]);
  return {title:'Che cosa nasce dalla ricetta?',subtitle:'FORMULA '+(i+1),visual:`<div class="arc-big-art">${a} <span>+</span> ${b}</div>`,opts,answer:opts.indexOf(correct),hint:'Risultato: '+correct};
 }
 if(game==='balance'){
  const x=dice(random,4,16),a=dice(random,2,12),b=dice(random,1,8),result=x+a+b,opts=mix(random,[x,x+1,x-1,x+2]).map(String);
  return {title:'Quanto pesa il sacco?',subtitle:'BILANCIA '+(i+1),visual:`<div class="arc-equation">🎒 + ${a} + ${b} <span>=</span> ${result}</div><p>Il sacco 🎒 ha un peso segreto.</p>`,opts,answer:opts.indexOf(String(x)),hint:'🎒 pesa '+x};
 }
 if(game==='impostor'){
  const count=8,base=one(random,['💎','🦋','🌸','👑','⭐','🍀']),other=one(random,['🪙','🌼','🍁','☄️','🔱','🌙'].filter(x=>x!==base)),at=dice(random,0,count-1);
  return {title:'Quale emblema è diverso?',subtitle:'OCCHIO DI FALCO '+(i+1),visual:'<div class="arc-symbol-title">🎭 SALONE DELLE MASCHERE</div>',opts:Array.from({length:count},(_,j)=>j===at?other:base),answer:at,hint:'Il simbolo diverso era '+other,grid:true};
 }
 if(game==='runes'){
  const SHAPES=['CERCHIO','TRIANGOLO','QUADRATO','ROMBO'],ICONS=['●','▲','■','◆'],n=dice(random,0,3),opts=mix(random,SHAPES.map((x,j)=>ICONS[j]+' '+x));
  return {title:'Il sovrano ordina: '+SHAPES[n],subtitle:'ORDINE '+(i+1),visual:`<div class="arc-big-art">✦ <span>${SHAPES[n]}</span> ✦</div>`,opts,answer:opts.findIndex(x=>x.endsWith(SHAPES[n])),hint:'Ordine eseguito: '+SHAPES[n]};
 }
 if(game==='signals'){
  const word=dice(random,0,3),paint=dice(random,0,3),mode=dice(random,0,1),target=mode?word:paint,opts=mix(random,COLORS);
  return {title:mode?'Seleziona la PAROLA':'Seleziona il COLORE del testo',subtitle:'ATTENZIONE '+(i+1),visual:`<div class="arc-colorword" style="color:${HEX[paint]}">${COLORS[word]}</div><p class="arc-reference">La parola e il colore possono essere diversi.</p>`,opts,answer:opts.indexOf(COLORS[target]),hint:'Risposta: '+COLORS[target]};
 }
 throw Error('Domanda sconosciuta: '+game);
}
// In questo minigioco la velocità pesa realmente nel punteggio,
// invece di assegnare il medesimo valore a ogni risposta esatta.
function gardenRawPoints(correct,timeMs){
 if(!correct)return 0;
 return Math.max(2,Math.min(10,Math.round((10-8*Math.min(1,Math.max(0,timeMs)/5200))*10)/10));
}
function gardenFlower(hue){
 const petals=Array.from({length:6},(_,k)=>'<ellipse cx="40" cy="20" rx="14" ry="20" transform="rotate('+(k*60)+' 40 40)" fill="hsl('+hue+' 83% 62%)" stroke="hsl('+hue+' 78% 39%)" stroke-width="1.5"/>').join('');
 return '<svg class="garden-flower" viewBox="0 0 80 80" aria-hidden="true"><path d="M40 54 Q38 67 45 74" stroke="#4ba86c" stroke-width="3" fill="none"/>'+petals+'<circle cx="40" cy="40" r="11" fill="#ffe18b" stroke="#dca64f" stroke-width="2"/><circle cx="37" cy="36" r="2.3" fill="#c07c4c"/></svg>';
}
function gardenGame(game,session,random){
 const rounds=12;let index=0,total=0,correct=0,misses=0,combinedTime=0;
 const startedAt=performance.now();
 function draw(){
  if(session.done)return;
  if(index>=rounds){
   const average=correct?Math.round(combinedTime/correct)/1000:0;
   done(session,total/120*100,'Giardino completato · '+correct+'/'+rounds+' fiori · media '+average.toFixed(2)+' s');return;
  }
  const count=index<4?9:index<8?12:16,cols=count===9?3:4;
        base=dice(random,0,359),delta=(index<4?70:index<8?42:26)*(random()<.5?-1:1),
        hue=(base+delta+360)%360,odd=dice(random,0,count-1),
        started=performance.now(),limit=5200;
  const stage=frame(index,rounds,total/120*100);
  stage.innerHTML=puzzle('Trova il fiore con petali diversi','AIUOLA '+(index+1)+' / '+rounds,
   '<div class="garden-banner"><span>🌷 GIARDINO DELLE ILLUSIONI</span><b id="garden-remaining">5.2 s</b></div>',
   'Più rapidamente lo trovi, più punti guadagni. Errore o tempo scaduto: zero punti per questa aiuola.')
   +'<div class="garden-grid" style="--garden-columns:'+cols+'">'+Array.from({length:count},(_,i)=>
     '<button class="garden-tile" data-flower="'+i+'" aria-label="Fiore '+(i+1)+'">'+gardenFlower(i===odd?hue:base)+'</button>').join('')+'</div>'
   +'<div class="garden-legend"><span>⚡ Rapido: 10 punti</span><span>🐢 Lento: 2 punti</span><span>✕ Errore: 0 punti</span></div>'
   +'<div class="garden-timer"><i id="garden-timebar" style="width:100%"></i></div>';
  let locked=false;
  const interval=setInterval(()=>{
   if(session.done||locked)return;
   const timeLeft=Math.max(0,limit-(performance.now()-started));
   const label=stage.querySelector('#garden-remaining'),bar=stage.querySelector('#garden-timebar');
   if(label)label.textContent=(timeLeft/1000).toFixed(1)+' s';
   if(bar)bar.style.width=(timeLeft/limit*100)+'%';
  },55);
  const originalCleanup=session.cleanup;
  session.cleanup=()=>{clearInterval(interval);originalCleanup?.()};
  const pending=laterS(session,limit,()=>answer(-1));
  function answer(selected){
   if(locked||session.done)return;
   locked=true;clearInterval(interval);clearTimeout(pending);
   const elapsed=Math.min(limit,performance.now()-started),ok=selected===odd;
   const gained=gardenRawPoints(ok,elapsed);
   if(ok){correct++;combinedTime+=elapsed}else misses++;
   total+=gained;index++;session.raw=norm(total/120*100);setPoints(session.raw);
   stage.querySelectorAll('[data-flower]').forEach(btn=>{
    btn.disabled=true;
    if(Number(btn.dataset.flower)===odd)btn.classList.add('arc-correct');
    if(Number(btn.dataset.flower)===selected&&!ok)btn.classList.add('arc-wrong');
   });
   const spent=(elapsed/1000).toFixed(2);
   setFeedback(ok?'⚡ '+spent+' s · +'+gained+' punti per la velocità!':
    (selected===-1?'⏱ Tempo scaduto · +0 punti':'Fiore sbagliato · +0 punti'),ok);
   laterS(session,850,draw);
  }
  stage.querySelector('.garden-grid').addEventListener('click',e=>{
   const b=e.target.closest('[data-flower]');if(b)answer(Number(b.dataset.flower));
  });
 }
 draw();
}
function quizGame(game,session,random){const rounds=12;let index=0,right=0,wrong=0;
 function draw(){if(session.done)return;if(index>=rounds){done(session,right/rounds*100-wrong*1.4,'Hai risolto '+right+' prove su '+rounds);return}
  const stage=frame(index,rounds,right/rounds*100-wrong*1.4),q=question(game.id,index,random),start=Date.now();
  stage.innerHTML=puzzle(q.title,q.subtitle,q.visual)+`<div class="arc-options ${q.grid?'arc-nine':''}">${q.opts.map((opt,j)=>`<button type="button" class="arc-option" data-answer="${j}" aria-label="Opzione ${j+1}">${safe(opt)}</button>`).join('')}</div>`;
  let locked=false;const timeout=laterS(session,5000,()=>answer(-1));
  function answer(selected){if(locked||session.done)return;locked=true;clearTimeout(timeout);const ok=selected===q.answer;if(ok)right++;else wrong++;
   session.raw=norm(right/rounds*100-wrong*1.4);setPoints(session.raw);
   stage.querySelectorAll('[data-answer]').forEach((btn,j)=>{btn.disabled=true;if(j===q.answer)btn.classList.add('arc-correct');if(j===selected&&!ok)btn.classList.add('arc-wrong')});
   setFeedback(q.hint+(ok?' · OTTIMO!':' · PROVA SUCCESSIVA'),ok);index++;laterS(session,Math.max(700,3300-(Date.now()-start)),draw);
  }
  stage.querySelector('.arc-options').addEventListener('click',e=>{const b=e.target.closest('[data-answer]');if(b)answer(Number(b.dataset.answer))});
 }
 draw();
}
function meterGame(game,session,random){const max=10;let index=0,total=0,needle=10,dir=1,target=50,locked=false,timeout=null;
 const stage=frame(0,max,0);stage.innerHTML=puzzle('Ferma la lancetta sul settore dorato','PRECISIONE · MECCANISMI',`<div class="arc-meter"><div id="arc-zone" class="arc-meter-zone"></div><div id="arc-needle" class="arc-meter-needle"></div></div><div class="arc-build" id="arc-build"></div>`,'Ogni piano ha un bersaglio diverso. Più ti avvicini al centro, più punti guadagni.')+'<button class="arc-main-button" id="arc-stop">FERMA IL MECCANISMO</button>';
 const btn=stage.querySelector('#arc-stop'),bar=stage.querySelector('#arc-needle');
 const ticker=setInterval(()=>{if(session.done)return;needle+=dir*(.65+index*.18);if(needle>=100){needle=100;dir=-1}if(needle<=0){needle=0;dir=1}bar.style.left=needle+'%'},24);
 const old=session.cleanup;session.cleanup=()=>{clearInterval(ticker);clearTimeout(timeout);old?.()};
 function next(){if(session.done)return;if(index>=max){done(session,total/max,'Precisione totale '+Math.round(total/max)+'/100');return}
  locked=false;target=dice(random,18,82);needle=dice(random,0,17);dir=1;
  stage.querySelector('#arc-zone').style.left=(target-(game.id==='builders'?7:10))+'%';stage.querySelector('#arc-zone').style.width=(game.id==='builders'?14:20)+'%';
  const r=el('#arc-round'),progress=el('#arc-progress');if(r)r.textContent=String(index+1);if(progress)progress.style.width=index/max*100+'%';btn.disabled=false;btn.textContent='FERMA IL MECCANISMO';
  timeout=setTimeout(()=>stop(true),5500);
 }
 function stop(missed){if(locked||session.done)return;locked=true;clearTimeout(timeout);const acc=missed?0:norm(100-Math.abs(needle-target)*(game.id==='builders'?3.6:2.9));total+=acc;index++;session.raw=norm(total/max);setPoints(session.raw);
  stage.querySelector('#arc-build').insertAdjacentHTML('beforeend',`<span class="arc-building-block ${acc>72?'well':''}">${acc>72?'◆':'◇'}</span>`);
  btn.disabled=true;btn.textContent='PIANO '+index+' / '+max;setFeedback('Precisione '+acc+'/100 '+(acc>75?'• PIANO PERFETTO!':''),acc>60);laterS(session,Math.max(950,2850),next);
 }
 btn.addEventListener('click',()=>stop(false));next();
}
function marketGame(game,session,random){const offers=[{name:'SCAMBIO SICURO',explain:'+8 monete garantite',win:8,chance:1},{name:'PATTO INCERTO',explain:'60%: +17 · 40%: -7',win:17,lose:7,chance:.6},{name:'AFFARE PROIBITO',explain:'35%: +30 · 65%: -11',win:30,lose:11,chance:.35}];
 let index=0,coins=0,locked=false,pending=null;const max=12;frame(0,max,0);
 function draw(){if(session.done)return;if(index>=max){done(session,session.raw,'Borsa finale: '+coins+' monete');return}locked=false;
  el('#arc-round').textContent=index+1;el('#arc-progress').style.width=index/max*100+'%';el('#arc-stage').innerHTML=puzzle('Quale contratto firmi?','TRATTATIVA '+(index+1),`<div class="arc-big-art">🪙 <span>${coins} MONETE</span></div>`,'Più monete equivalgono a più punti, ma puoi anche perderne.')+`<div class="arc-options arc-three">${offers.map((o,j)=>`<button class="arc-option arc-offer" data-offer="${j}"><b>${o.name}</b><small>${o.explain}</small></button>`).join('')}</div>`;
  pending=laterS(session,5700,()=>choose(0));
 }
 function choose(k){if(locked||session.done)return;locked=true;clearTimeout(pending);const offer=offers[k],win=random()<offer.chance,delta=win?offer.win:-offer.lose;coins=Math.max(0,coins+delta);index++;session.raw=norm(coins/135*100);setPoints(session.raw);setFeedback((delta>=0?'+':'')+delta+' monete • Bottino attuale: '+coins,win);laterS(session,2600,draw)}
 miniMount().addEventListener('click',e=>{const b=e.target.closest('[data-offer]');if(b)choose(Number(b.dataset.offer))});draw();
}
function diveGame(game,session,random){let index=0,air=5,bag=0,saved=0,locked=false,pending=null;const max=12;frame(0,max,0);
 function draw(){if(session.done)return;if(index>=max){saved+=bag;done(session,saved/140*100,'Tesoro custodito: '+saved+' perle');return}locked=false;
  el('#arc-round').textContent=index+1;el('#arc-progress').style.width=index/max*100+'%';el('#arc-stage').innerHTML=puzzle('Scendi ancora o torna in superficie?','IMMERSIONE '+(index+1),`<div class="arc-sea">🌊<div>OSSIGENO <strong>${air}/5</strong></div><div>🦪 In tasca: ${bag} · 💎 Al sicuro: ${saved}</div></div>`,'Se l’aria raggiunge zero, perdi le perle non ancora salvate.')+`<div class="arc-options arc-two"><button class="arc-option" data-dive="down">⬇ SCENDI <small>+10–19 perle, -1 ossigeno</small></button><button class="arc-option" data-dive="surface">⬆ RIEMERGI <small>Salva il bottino, ripristina l’aria</small></button></div>`;
  pending=laterS(session,5600,()=>choose('surface'));
 }
 function choose(action){if(locked||session.done)return;locked=true;clearTimeout(pending);index++;let message;
  if(action==='down'){air--;bag+=dice(random,10,19);if(air<=0){message='Aria terminata! Perse '+bag+' perle!';bag=0;air=5}else message='Trovate altre perle! Bottino in tasca: '+bag;}
  else{saved+=bag;message='Perle salvate: '+saved+'!';bag=0;air=5;}
  session.raw=norm((saved+bag*.55)/140*100);setPoints(session.raw);setFeedback(message,air>0);laterS(session,2550,draw)
 }
 miniMount().addEventListener('click',e=>{const b=e.target.closest('[data-dive]');if(b)choose(b.dataset.dive)});draw();
}
function meteorGame(game,session,random){const max=17;let wave=0,lane=1,danger=-1,dodged=0,locked=false;
 const stage=frame(0,max,0);
 stage.innerHTML=puzzle('Schiva le comete in arrivo','TEMPESTA STELLARE',`<div class="arc-lanes" id="arc-lanes"></div><div class="arc-track-buttons"><button data-shift="-1">◀ SINISTRA</button><button data-shift="1">DESTRA ▶</button></div>`,'La corsia rossa sarà colpita. Sei la corona gialla: evita quella corsia prima dell’impatto.');
 const draw=()=>{const lanes=stage.querySelector('#arc-lanes');lanes.innerHTML=Array.from({length:4},(_,i)=>`<button class="arc-lane ${lane===i?'hero':''} ${danger===i?'danger':''}" data-lane="${i}" aria-label="Corsia ${i+1}">${lane===i?'♛':danger===i?'☄':'·'}</button>`).join('')};
 function move(n){if(session.done)return;lane=Math.max(0,Math.min(3,lane+n));draw()}
 const keyboard=e=>{if(!['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)||session.done)return;e.preventDefault();move(['ArrowLeft','a','A'].includes(e.key)?-1:1)};
 document.addEventListener('keydown',keyboard);const old=session.cleanup;session.cleanup=()=>{document.removeEventListener('keydown',keyboard);old?.()};
 stage.addEventListener('click',e=>{const shift=e.target.closest('[data-shift]'),slot=e.target.closest('[data-lane]');if(shift)move(Number(shift.dataset.shift));if(slot){lane=Number(slot.dataset.lane);draw()}});
 function next(){if(session.done)return;if(wave>=max){done(session,session.raw,'Meteore evitate: '+dodged+'/'+max);return}
  danger=dice(random,0,3);locked=false;draw();setFeedback('☄ ALLARME! Meteora in corsia '+(danger+1)+'. Spostati.',false);
  laterS(session,1800,()=>{const hit=lane===danger;if(!hit)dodged++;wave++;session.raw=norm(dodged/max*100);setPoints(session.raw);el('#arc-round').textContent=Math.min(max,wave+1);el('#arc-progress').style.width=wave/max*100+'%';
   setFeedback(hit?'IMPATTO! La corsia '+(danger+1)+' era pericolosa.':'SCHIVATA PERFETTA! ✓',!hit);danger=-1;draw();laterS(session,600,next)
  });
 }
 draw();next();
}
function guardianGame(game,session,random){const max=18;let wave=0,hits=0,misses=0,selected=false,target=0,hostile=true;
 const stage=frame(0,max,0);
 stage.innerHTML=puzzle('Proteggi il varco dalle incursioni!','DIFESA DEL PORTALE',`<div class="arc-guard-grid" id="arc-guard-grid"></div>`,'Tocca il simbolo rosso quando appare. Se compare un amico dorato, non colpirlo.');
 function draw(){const grid=stage.querySelector('#arc-guard-grid');grid.innerHTML=Array.from({length:6},(_,i)=>`<button type="button" data-guard="${i}" class="arc-guard ${i===target?(hostile?'evil':'friend'):''}" aria-label="Postazione ${i+1}">${i===target?(hostile?'👹':'🛡️'):'✦'}</button>`).join('')}
 function next(){if(session.done)return;if(wave>=max){done(session,session.raw,'Ladri bloccati: '+hits+' · Errori: '+misses);return}
  selected=false;target=dice(random,0,5);hostile=random()>.24;draw();setFeedback(hostile?'🔴 INTRUSO! Tocca il ladro.':'🟡 ALLEATO! Non toccarlo.',!hostile);
  laterS(session,1700,()=>{if(!selected){if(hostile)misses++;else hits++;}wave++;session.raw=norm((hits/max*100)-(misses*2));setPoints(session.raw);el('#arc-round').textContent=Math.min(max,wave+1);el('#arc-progress').style.width=wave/max*100+'%';
   setFeedback('Ondate difese: '+wave+' / '+max,hits>misses);target=-1;draw();laterS(session,620,next)
  });
 }
 stage.addEventListener('click',e=>{const b=e.target.closest('[data-guard]');if(!b||selected||session.done)return;selected=true;const chosen=Number(b.dataset.guard);if(chosen===target&&hostile){hits++;setFeedback('Ladro catturato! + punti',true)}else{misses++;setFeedback('Attenzione! Hai colpito il bersaglio sbagliato.',false)};session.raw=norm(hits/max*100-misses*2);setPoints(session.raw)});
 next();
}
function heartbeatGame(game,session,random){const max=32,period=1270;let hit=0,miss=0,last=-1,started=performance.now()+1600;
 const stage=frame(0,max,0);
 stage.innerHTML=puzzle('Senti il ritmo del trono','LA GRANDE PERCUSSIONE',`<div class="arc-beat-indicator" id="arc-beat-indicator">PREPARATI...</div><button type="button" id="arc-drum" class="arc-drum" aria-label="Tocca il tamburo">♛</button>`,'Usa SPAZIO oppure tocca il tamburo. Un colpo per ogni pulsazione luminosa.');
 const drum=stage.querySelector('#arc-drum'),label=stage.querySelector('#arc-beat-indicator');
 const tick=setInterval(()=>{if(session.done||state.mini!==session||!label.isConnected)return;const now=performance.now(),i=Math.round((now-started)/period),diff=Math.abs(now-(started+i*period));if(i>=0&&i<max){label.textContent='BATTITO '+(i+1)+' / '+max;if(el('#arc-round'))el('#arc-round').textContent=String(i+1);if(el('#arc-progress'))el('#arc-progress').style.width=(i/max*100)+'%'}drum.classList.toggle('ready',i>=0&&i<max&&diff<190);
  if(now>started+max*period+250){session.raw=norm(hit/max*100-miss*1.4);done(session,session.raw,'Battiti centrati: '+hit+'/'+max)}
 },50);
 const old=session.cleanup;const key=e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();strike()}};document.addEventListener('keydown',key);session.cleanup=()=>{clearInterval(tick);document.removeEventListener('keydown',key);old?.()};
 function strike(){if(session.done)return;const now=performance.now(),n=Math.round((now-started)/period),dist=Math.abs(now-(started+n*period));if(n<0||n>=max||n===last)return;last=n;
  if(dist<215){hit++;drum.classList.add('hit');laterS(session,170,()=>drum.classList.remove('hit'));setFeedback('CENTRATO! Il trono risuona.',true)}else{miss++;setFeedback('Fuori tempo! Segui la luce.',false)}
  session.raw=norm(hit/max*100-miss*1.4);setPoints(session.raw)
 }
 drum.addEventListener('click',strike);
}
function echoGame(game,session,random){const keys=['☀️','🌙','❄️','🔥'];let wave=0,win=0,answer=[],input=[],locked=false,pending=0;const max=7;
 frame(0,max,0);
 function next(){if(session.done)return;if(wave>=max){done(session,session.raw,'Sequenze corrette: '+win+' / '+max);return}
  input=[];answer=Array.from({length:wave+2},()=>dice(random,0,3));locked=true;
  el('#arc-round').textContent=String(wave+1);el('#arc-progress').style.width=(wave/max*100)+'%';
  el('#arc-stage').innerHTML=puzzle('Memorizza le rune in sequenza','RICORDA • MANCHÉ '+(wave+1),`<div class="arc-echo" id="arc-echo">👁️</div>`,'Guarda i simboli, poi ripetili esattamente nello stesso ordine.')+`<div class="arc-pad">${keys.map((k,i)=>`<button data-echo="${i}" disabled>${k}</button>`).join('')}</div>`;
  let j=0;const show=()=>{if(session.done)return;if(j<answer.length){el('#arc-echo').textContent=keys[answer[j]];j++;laterS(session,680,()=>{const x=el('#arc-echo');if(x)x.textContent='✦';laterS(session,210,show)})}else{
   locked=false;const x=el('#arc-echo');if(x)x.textContent='RIPETI!';el('#arc-stage').querySelectorAll('[data-echo]').forEach(b=>b.disabled=false);setFeedback('Ora ripeti la sequenza di '+answer.length+' rune.');
   pending=laterS(session,Math.max(6500,answer.length*1400),()=>complete(false))
  }};laterS(session,800,show);
 }
 function complete(success){if(locked||session.done)return;locked=true;clearTimeout(pending);wave++;if(success)win++;session.raw=norm(win/max*100);setPoints(session.raw);setFeedback(success?'SEQUENZA COMPLETA!':'Errore: nuova sequenza al prossimo round.',success);el('#arc-stage').querySelectorAll('[data-echo]').forEach(b=>b.disabled=true);laterS(session,1100,next)}
 miniMount().addEventListener('click',e=>{const b=e.target.closest('[data-echo]');if(!b||locked||session.done)return;const n=Number(b.dataset.echo),at=input.length;input.push(n);if(n!==answer[at]){complete(false);return}el('#arc-echo').textContent=input.map(x=>keys[x]).join(' ');if(input.length===answer.length)complete(true)});
 next();
}
function cipherGame(game,session,random){let wave=0,solved=0,tries=0,answer='',locked=false,deadline=null;const max=4;frame(0,max,0);
 function exactAndMisplaced(a,b){let exact=0,all=0;const ca={},cb={};for(let i=0;i<3;i++){if(a[i]===b[i])exact++;ca[a[i]]=(ca[a[i]]||0)+1;cb[b[i]]=(cb[b[i]]||0)+1;}for(const k in cb)all+=Math.min(ca[k]||0,cb[k]);return [exact,all-exact]}
 function next(){if(session.done)return;if(wave>=max){done(session,session.raw,'Sigilli aperti: '+solved+' / '+max);return}
  locked=false;tries=0;answer=String(dice(random,0,999)).padStart(3,'0');el('#arc-round').textContent=String(wave+1);el('#arc-progress').style.width=wave/max*100+'%';
  el('#arc-stage').innerHTML=puzzle('Indovina il codice a 3 cifre','SIGILLO '+(wave+1),`<div class="arc-cipher">🔐 <span>???</span></div>`,'Ogni tentativo mostra cifre nella posizione corretta e cifre presenti nel posto sbagliato.')+`<form id="arc-code-form" class="arc-code-form"><input type="text" inputmode="numeric" autocomplete="off" maxlength="3" pattern="[0-9]{3}" placeholder="000" aria-label="Inserisci tre cifre" required><button class="arc-main-button" type="submit">VERIFICA</button></form><div class="arc-code-history" id="arc-code-history"></div>`;
  const form=el('#arc-code-form');form.addEventListener('submit',e=>{e.preventDefault();if(locked||session.done)return;const input=form.querySelector('input'),guess=input.value;if(!/^[0-9]{3}$/.test(guess))return;tries++;const [exact,elsewhere]=exactAndMisplaced(answer,guess);el('#arc-code-history').insertAdjacentHTML('afterbegin',`<div><b>${safe(guess)}</b> · ${exact} corrette · ${elsewhere} fuori posto</div>`);
   if(exact===3){clearTimeout(deadline);solved++;session.raw=norm(solved/max*100);setPoints(session.raw);nextSeal('SIGILLO APERTO! ✨',true);return}
   if(tries>=5){clearTimeout(deadline);nextSeal('Codice era '+answer+'. Sigillo non aperto.',false);return}
   input.value='';input.focus();setFeedback('Tentativi rimasti: '+(5-tries)+' · Corrette: '+exact+', fuori posto: '+elsewhere,false)
  });
  deadline=laterS(session,14500,()=>nextSeal('TEMPO SCADUTO! Codice: '+answer,false));
 }
 function nextSeal(msg,ok){if(locked||session.done)return;locked=true;el('#arc-code-form').querySelectorAll('input,button').forEach(x=>x.disabled=true);setFeedback(msg,ok);wave++;laterS(session,1850,next)}
 next();
}
// Solo le nuove sfide entrano nella selezione; le vecchie restano disponibili per le stanze già aperte.
window.chooseMini=function(room,forced){if(forced)return forced==='reaction'?'clockwork':forced;const pool=NEW.filter(g=>g.id!==room.lastMiniId);return one(randomSeed([room.code,room.turn,'choose'].join(':')),pool).id};
window.gamePage=function(){const r=state.room,g=games.find(x=>x.id===r.miniId);if(!g?.reborn)return legacyGame();const me=myPlayer(),allowed=me?.alive&&eligible().includes(me.uid);
 return `<header class="arc-page-heading"><div><span class="arc-overline">${r.mode==='tiebreak'?'⚔ SPAREGGIO ELIMINAZIONE':`ROUND ${r.round} · GRADINO ${r.initialCount-alive().length+1}`}</span><h1>${g.symbol} ${safe(g.name)}</h1><p>${safe(g.desc)}</p></div><button class="btn btn-ghost btn-sm" data-action="leave">← ESCI</button></header><div class="arc-layout"><section class="arc-main"><div class="arc-board"><div class="arc-board-top"><div><span class="arc-live-dot"></span> IN DIRETTA <span class="arc-divider-dot">·</span> ${r.roundsPerElim-((r.round-1)%r.roundsPerElim)} ALL’ELIMINAZIONE</div><div class="arc-clock"><small>⏱</small><b id="clock">${g.duration}</b><small>SEC</small></div></div><div class="arc-objective"><b>🎯 OBIETTIVO</b><span>${safe(g.how)}</span></div>${allowed?'<div id="game-mount" class="arc-mount"></div>':'<div class="arc-spectator"><span>👁️</span><h3>MODALITÀ SPETTATORE</h3><p>Continua a seguire la partita e i risultati degli NPC.</p></div>'}</div><div class="arc-npc-wrap">${botArena(r,g)}</div></section><aside class="arc-side">${scoreboard(r)}<details class="arc-stairs"><summary>👑 Vedi la scalinata</summary>${stepMarkup(r)}</details></aside></div>`;
};
window.rawForBot=function(p,g,r){if(!g?.reborn)return legacyBot(p,g,r);const rnd=botRandom(p,g,r),c=character(p.avatar),difficulty={easy:.39,normal:.62,hard:.82}[r.difficulty]||.62,skill=Math.min(.96,difficulty+(c.trait===g.kind?.1:0));let total=0;
 if(g.id==='garden'){for(let i=0;i<12;i++){const hit=rnd()<Math.min(.98,.54+skill*.44);const reactionMs=(.45+(1-skill)*3.1+rnd()*.9)*1000;total+=gardenRawPoints(hit,reactionMs)/120*100;}}
 else if(['courier','alchemy','balance','impostor','runes','signals'].includes(g.id)){for(let i=0;i<12;i++)total+=rnd()<skill?100/12:-1.4;}
 else if(['clockwork','builders'].includes(g.id)){for(let i=0;i<10;i++)total+=norm(27+skill*75+(rnd()-.5)*40)/10;}
 else if(g.id==='market'){let wallet=0;for(let i=0;i<12;i++){const risk=rnd()<skill*.75;if(risk)wallet+=rnd()<.6?17:-7;else wallet+=8;}total=wallet/135*100;}
 else if(g.id==='dive'){let saved=0,bag=0,air=5;for(let i=0;i<12;i++){if(air>1&&rnd()<skill){air--;bag+=10+Math.floor(rnd()*10);}else{saved+=bag;bag=0;air=5;}}total=(saved+bag*.55)/140*100;}
 else if(g.id==='meteor'){for(let i=0;i<17;i++)if(rnd()<.28+skill*.7)total+=100/17;}
 else if(g.id==='guardians'){for(let i=0;i<18;i++)if(rnd()<.2+skill*.75)total+=100/18;}
 else if(g.id==='heartbeat'){for(let i=0;i<32;i++)if(rnd()<.23+skill*.72)total+=100/32;}
 else if(g.id==='echo'){for(let i=0;i<7;i++)if(rnd()<.20+skill*.72)total+=100/7;}
 else if(g.id==='cipher'){for(let i=0;i<4;i++)if(rnd()<.1+skill*.7)total+=25;}
 return norm(total);
};
window.startMini=function(){const room=state.room,g=games.find(x=>x.id===room.miniId);if(!g?.reborn)return legacyStart();const s=createTimer(g.duration);if(state.online)checkExistingSubmission(s);if(!miniMount())return;
 welcome(g,()=>{const rnd=randFor(g.id);
  if(g.id==='garden')return gardenGame(g,s,rnd);
  if(['courier','alchemy','balance','impostor','runes','signals'].includes(g.id))return quizGame(g,s,rnd);
  if(['clockwork','builders'].includes(g.id))return meterGame(g,s,rnd);
  if(g.id==='market')return marketGame(g,s,rnd);
  if(g.id==='dive')return diveGame(g,s,rnd);
  if(g.id==='meteor')return meteorGame(g,s,rnd);
  if(g.id==='guardians')return guardianGame(g,s,rnd);
  if(g.id==='heartbeat')return heartbeatGame(g,s,rnd);
  if(g.id==='echo')return echoGame(g,s,rnd);
  if(g.id==='cipher')return cipherGame(g,s,rnd);
 });
};
// Riaggiorna la home dopo aver registrato i nuovi giochi.
if(state.view==='home')render();
})();