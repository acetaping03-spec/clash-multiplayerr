// =============================================================
// CLASH ARENA ONLINE V4 - SERVER.JS
// Gerçek multiplayer + bot test + gelişmiş 3D harita
// -------------------------------------------------------------
// Kurulum:
//   npm init -y
//   npm i ws
//   node server.js
// Link için:
//   npx.cmd localtunnel --port 3000 --subdomain clashkuzeyarena
// =============================================================

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
let waitingPlayer = null;
let nextPlayerId = 1;
let nextRoomId = 1000;
const rooms = new Map();

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Clash Arena Online V4</title>
<style>
*{box-sizing:border-box}body{margin:0;overflow:hidden;font-family:Arial,Helvetica,sans-serif;background:radial-gradient(circle at 50% 20%,#dffbff 0%,#75cbe9 50%,#2e82aa 100%);color:white;user-select:none}canvas{display:block}.glass{background:linear-gradient(180deg,rgba(38,55,84,.96),rgba(10,22,42,.96));border:1px solid rgba(255,255,255,.2);box-shadow:0 18px 40px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.16);backdrop-filter:blur(9px)}#hud{position:fixed;inset:0;pointer-events:none}#topPanel{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:min(1160px,calc(100vw - 22px));display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;border-radius:22px;padding:12px 18px}.score{font-weight:900;font-size:18px;text-shadow:0 2px 0 rgba(0,0,0,.3)}#blueScore{color:#dbeafe;text-align:left}#redScore{color:#fee2e2;text-align:right}.center{text-align:center}.title{font-size:16px;font-weight:1000;letter-spacing:.8px}.sub{font-size:12px;color:#dbeafe;margin-top:2px}.timer{display:inline-block;margin-top:5px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:4px 13px;font-weight:900;color:#fef3c7}#menu{position:absolute;inset:0;display:grid;place-items:center;background:radial-gradient(circle at 50% 18%,rgba(59,130,246,.20),transparent 28%),radial-gradient(circle at 16% 74%,rgba(168,85,247,.25),transparent 30%),radial-gradient(circle at 86% 72%,rgba(239,68,68,.22),transparent 30%),linear-gradient(180deg,rgba(2,6,23,.68),rgba(2,6,23,.90));pointer-events:auto;z-index:20}.menuCard{width:min(920px,calc(100vw - 32px));padding:34px;border-radius:34px;text-align:center;position:relative;overflow:hidden}.menuCard h1{margin:0 0 8px;font-size:54px;letter-spacing:1px;background:linear-gradient(90deg,#fff,#bfdbfe,#fef3c7);-webkit-background-clip:text;color:transparent}.menuCard p{margin:0 auto 20px;max-width:760px;color:#dbeafe;line-height:1.45}.menuBtns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.btn{border:0;border-radius:16px;padding:13px 20px;color:white;font-weight:1000;cursor:pointer;background:linear-gradient(180deg,#3b82f6,#1d4ed8);box-shadow:0 10px 22px rgba(0,0,0,.25);pointer-events:auto}.btn.green{background:linear-gradient(180deg,#22c55e,#15803d)}.btn.purple{background:linear-gradient(180deg,#a855f7,#7c3aed)}.btn:disabled{opacity:.65;cursor:not-allowed}.modeGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:22px 0}.modeTile{border:1px solid rgba(255,255,255,.16);border-radius:22px;padding:14px;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.05));text-align:left}.modeTile b{display:block;font-size:16px;margin-bottom:6px}.modeTile span{display:block;font-size:12px;color:#cbd5e1;line-height:1.35}#bottomBar{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:min(1120px,calc(100vw - 16px));display:grid;grid-template-columns:190px 1fr;gap:12px;align-items:stretch;pointer-events:none}#elixirBox{border-radius:20px;padding:14px;background:linear-gradient(180deg,rgba(67,43,137,.98),rgba(34,23,80,.98));border:1px solid rgba(232,190,255,.36);box-shadow:0 16px 35px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.14)}#elixirLabel{display:flex;justify-content:space-between;font-size:15px;font-weight:900;margin-bottom:10px;color:#f6d6ff}#elixirOuter{height:23px;background:rgba(82,39,147,.96);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.23);box-shadow:inset 0 2px 5px rgba(0,0,0,.38)}#elixirFill{height:100%;width:0;background:linear-gradient(90deg,#8b2fff,#ff4fc0);border-radius:999px;transition:width .12s linear}.tiny{font-size:11px;color:#d8b4fe;margin-top:8px;font-weight:800;line-height:1.25}#cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;pointer-events:auto}.card{min-height:126px;border:2px solid rgba(255,255,255,.18);border-radius:22px;background:linear-gradient(180deg,#265bd0,#101a48);color:white;cursor:pointer;padding:7px 9px 10px;box-shadow:0 16px 36px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.16);transition:transform .12s,border-color .12s,opacity .12s,filter .12s;position:relative;overflow:hidden;text-shadow:0 2px 0 rgba(0,0,0,.28)}.card:hover{transform:translateY(-5px) scale(1.012);filter:brightness(1.08)}.card.selected{border-color:#ffd21b;box-shadow:0 0 0 4px rgba(255,210,27,.23),0 16px 36px rgba(0,0,0,.38)}.card.disabled{opacity:.48}.portrait{position:relative;height:57px;margin:0 28px 4px 0;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(0,0,0,.14));border:1px solid rgba(255,255,255,.18);display:grid;place-items:center}.portrait svg{width:76px;height:60px;display:block;filter:drop-shadow(0 4px 3px rgba(0,0,0,.35))}.cardName{position:relative;font-size:18px;font-weight:1000;margin-bottom:4px}.cardType{position:relative;font-size:11px;color:#d3e2ff;line-height:1.16}.cost{position:absolute;right:8px;top:8px;width:38px;height:38px;border-radius:999px;display:grid;place-items:center;background:linear-gradient(180deg,#b15bff,#7620c9);border:2px solid #f4dbff;font-weight:1000;z-index:2;box-shadow:0 5px 10px rgba(0,0,0,.3)}#tip{position:absolute;left:50%;bottom:160px;transform:translateX(-50%);display:none;background:rgba(2,6,23,.92);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:10px 16px;font-weight:900;z-index:25}.damageText{position:fixed;pointer-events:none;font-weight:1000;text-shadow:0 2px 0 rgba(0,0,0,.42);font-size:18px;transform:translate(-50%,-50%);animation:floatUp .75s ease-out forwards}@keyframes floatUp{to{opacity:0;transform:translate(-50%,-95px)}}@media(max-width:900px){.modeGrid{grid-template-columns:1fr}#bottomBar{grid-template-columns:1fr}#cards{grid-template-columns:repeat(2,1fr)}#topPanel{grid-template-columns:1fr}.score{text-align:center!important;font-size:14px}.menuCard h1{font-size:38px}}
</style>
</head>
<body>
<div id="hud">
  <div id="topPanel" class="glass"><div id="blueScore" class="score">Mavi King: 900 👑 0</div><div class="center"><div class="title">CLASH ARENA ONLINE V4</div><div class="sub" id="statusText">Sunucuya bağlanıyor...</div><div id="timer" class="timer">03:00</div></div><div id="redScore" class="score">0 👑 Kırmızı King: 900</div></div>
  <div id="bottomBar"><div id="elixirBox"><div id="elixirLabel"><span>İksir</span><span id="elixirValue">5.0 / 10</span></div><div id="elixirOuter"><div id="elixirFill"></div></div><div class="tiny">Maç Ara düzeltildi • 3D harita • gerçek WebSocket eşleşme.</div></div><div id="cards"></div></div>
  <div id="tip"></div>
  <div id="menu"><div class="menuCard glass"><h1>ONLINE V4</h1><p>Maç Ara artık kesin algılar: bağlantı hazır değilse bekler, hazır olunca otomatik istek yollar. Harita daha düzenli, taşlı, ağaçlı, köpüklü nehirli ve daha grafiksel hale getirildi.</p><div class="modeGrid"><div class="modeTile"><b>🌐 Maç Ara Düzeltildi</b><span>Buton basılınca hemen tepki verir ve WebSocket hazır olunca kuyruk isteği yollar.</span></div><div class="modeTile"><b>🗺️ Daha İyi Harita</b><span>Detaylı çim kareleri, taş yollar, nehir, köprü, kaya ve ağaç dekorları.</span></div><div class="modeTile"><b>🧍 3D Birlikler</b><span>Kılıç/kalkan, yay, dev sopa ve yürüme animasyonu.</span></div></div><div class="menuBtns"><button id="matchBtn" class="btn green" type="button">Maç Ara</button><button id="botBtn" class="btn purple" type="button">Tek Başına Bot Test</button></div></div></div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const ARENA={w:18,h:30,river:1.55,playerMinZ:2,playerMaxZ:14,bridges:[-5,5]};
const C={blue:0x1d4ed8,blue2:0x60a5fa,red:0xb91c1c,red2:0xf87171,gold:0xe8b64c,stone:0xa8a394,stoneD:0x68685f,wood:0x9a6331,woodD:0x5f371d,skin:0xffc799,iron:0xc8ced6,leather:0x744522,fire:0xff6b24};
const CARD={Knight:{kind:'unit',label:'Knight',cost:3,hp:185,dmg:30,spd:2.1,range:1.25,delay:.7,buildings:false,desc:'Kılıç/kalkan'},Archer:{kind:'unit',label:'Archer',cost:3,hp:95,dmg:20,spd:2.05,range:5.6,delay:.92,buildings:false,desc:'Yaylı menzilli'},Giant:{kind:'unit',label:'Giant',cost:5,hp:520,dmg:48,spd:1.18,range:1.55,delay:1.12,buildings:true,desc:'Dev kule avcısı'},Fireball:{kind:'spell',label:'Fireball',cost:4,dmg:115,radius:2.2,desc:'Alan büyüsü'}};
let myTeam='blue',roomId=null,online=false,matchStarted=false,botMode=false,selected=null,playerElixir=5,enemyElixir=5,aiTimer=2.2,gameOver=false,t=0,matchTime=180,blueCrowns=0,redCrowns=0,shake=0,pendingFindMatch=false;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x82d2ea);scene.fog=new THREE.Fog(0x82d2ea,34,82);
const camera=new THREE.PerspectiveCamera(47,innerWidth/innerHeight,.1,1000);camera.position.set(0,19,21);camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),clock=new THREE.Clock(),units=[],buildings=[],projectiles=[],effects=[],water=[];
const ui={cards:document.getElementById('cards'),fill:document.getElementById('elixirFill'),ev:document.getElementById('elixirValue'),blue:document.getElementById('blueScore'),red:document.getElementById('redScore'),timer:document.getElementById('timer'),tip:document.getElementById('tip'),menu:document.getElementById('menu'),status:document.getElementById('statusText'),matchBtn:document.getElementById('matchBtn'),botBtn:document.getElementById('botBtn')};
let ws=null;
function connect(){
  const proto=location.protocol==='https:'?'wss':'ws';
  ui.status.textContent='Sunucuya bağlanıyor...';
  try{ws=new WebSocket(proto+'://'+location.host)}catch(e){ui.status.textContent='WebSocket oluşturulamadı.';return}
  ws.onopen=()=>{ui.status.textContent='Bağlandı. Maç arayabilirsin.';if(pendingFindMatch){pendingFindMatch=false;sendFindMatch()}};
  ws.onmessage=e=>{const m=JSON.parse(e.data);handleNet(m)};
  ws.onerror=()=>{ui.status.textContent='WebSocket hatası. LocalTunnel/Cloudflare linkini ve server.js durumunu kontrol et.'};
  ws.onclose=()=>{online=false;ui.status.textContent='Sunucu bağlantısı koptu. Sayfayı yenile.'};
}
function rawSend(obj){if(ws&&ws.readyState===1){ws.send(JSON.stringify(obj));return true}return false}
function sendFindMatch(){
  ui.matchBtn.textContent='Rakip Bekleniyor...';
  ui.status.textContent='Maç arama isteği gönderiliyor...';
  const ok=rawSend({type:'find_match'});
  if(!ok){pendingFindMatch=true;ui.status.textContent='Bağlantı hazır değil. Bağlanınca otomatik maç aranacak.';tip('Bağlantı hazırlanıyor...');if(!ws||ws.readyState>1)connect()}
}
function send(type,data={}){if(rawSend({type,...data}))return true;tip('Bağlantı hazır değil.');return false}
function handleNet(m){
  if(m.type==='queued'){ui.status.textContent='Rakip bekleniyor... Linki arkadaşına gönder.';tip('Rakip bekleniyor. İkinci kişi Maç Ara basınca başlar.');ui.matchBtn.textContent='Rakip Bekleniyor...'}
  if(m.type==='match_found'){roomId=m.roomId;myTeam=m.team;online=true;matchStarted=true;botMode=false;ui.menu.style.display='none';ui.status.textContent='Oda #'+roomId+' • Sen: '+(myTeam==='blue'?'Mavi':'Kırmızı');tip('Rakip bulundu! Oda #'+roomId)}
  if(m.type==='opponent_left'){tip('Rakip çıktı.');ui.status.textContent='Rakip bağlantısı koptu.'}
  if(m.type==='spawn')remoteSpawn(m);
  if(m.type==='spell')remoteSpell(m);
}
function mat(c,r=.72,m=.03){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})}
function box(p,w,h,d,c,x,y,z,r=.72,m=.03){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,r,m));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o}
function cyl(p,r1,r2,h,c,x,y,z,s=18,r=.72,m=.03){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,s),mat(c,r,m));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o}
function cone(p,r,h,c,x,y,z,s=4){const o=new THREE.Mesh(new THREE.ConeGeometry(r,h,s),mat(c,.55,.04));o.position.set(x,y,z);o.rotation.y=Math.PI/4;o.castShadow=o.receiveShadow=true;p.add(o);return o}
function sph(p,r,c,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat(c));o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;p.add(o);return o}
function initWorld(){
  scene.add(new THREE.HemisphereLight(0xffffff,0x406631,1.15));
  const sun=new THREE.DirectionalLight(0xffffff,1.35);sun.position.set(-9,20,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{near:.5,far:80,left:-24,right:24,top:26,bottom:-26});scene.add(sun);
  box(scene,ARENA.w+2.2,.9,ARENA.h+2.2,0x2c7139,0,-.48,0);box(scene,ARENA.w+3,.5,ARENA.h+3,0x1f512c,0,-.92,0);
  grass();river();walls();lanes();ARENA.bridges.forEach(bridge);decor();
  const cp=new THREE.Mesh(new THREE.PlaneGeometry(ARENA.w,ARENA.h),new THREE.MeshBasicMaterial({visible:false}));cp.rotation.x=-Math.PI/2;cp.name='clickPlane';scene.add(cp);
}
function grass(){const gs=[0x58d95a,0x52cf52,0x62df61,0x4fc24f,0x6ddd66];for(let x=-8.5;x<=8.5;x+=1)for(let z=-14.5;z<=14.5;z+=1){if(Math.abs(z)<ARENA.river+.08)continue;const tile=new THREE.Mesh(new THREE.PlaneGeometry(1.02,1.02),mat(gs[Math.abs(Math.floor(x*7+z*11))%gs.length],.96));tile.rotation.x=-Math.PI/2;tile.position.set(x,.015,z);tile.receiveShadow=true;scene.add(tile)}for(let i=0;i<80;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.035,.08,.035),new THREE.MeshBasicMaterial({color:0x2f9e44}));blade.position.set(-8+Math.random()*16,.09,-14+Math.random()*28);if(Math.abs(blade.position.z)>ARENA.river+1)scene.add(blade)}}
function river(){const r=new THREE.Mesh(new THREE.PlaneGeometry(ARENA.w,ARENA.river*2.15),new THREE.MeshStandardMaterial({color:0x168fd1,roughness:.15,metalness:.1,transparent:true,opacity:.96}));r.rotation.x=-Math.PI/2;r.position.y=.055;scene.add(r);for(let i=0;i<24;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(.65+Math.random()*.8,.025,.035),new THREE.MeshBasicMaterial({color:0xd9fbff,transparent:true,opacity:.62}));f.position.set(-8.7+i*.75,.09,-.9+Math.random()*1.8);scene.add(f);water.push({mesh:f,baseX:f.position.x,spd:.55+Math.random()*.6,phase:Math.random()*10})}for(let s=-1;s<=1;s+=2)for(let i=0;i<28;i++){let ro=box(scene,.38+Math.random()*.26,.16+Math.random()*.12,.22+Math.random()*.18,0x8d8878,-8.7+i*.65,.13,s*(ARENA.river+.16+Math.random()*.12));ro.rotation.y=Math.random()*Math.PI}}
function walls(){box(scene,ARENA.w+.7,.82,.45,C.stoneD,0,.41,-ARENA.h/2-.2);box(scene,ARENA.w+.7,.82,.45,C.stoneD,0,.41,ARENA.h/2+.2);box(scene,.45,.82,ARENA.h+.7,C.stoneD,-ARENA.w/2-.2,.41,0);box(scene,.45,.82,ARENA.h+.7,C.stoneD,ARENA.w/2+.2,.41,0);for(let i=0;i<18;i++){box(scene,.78,.22,.42,0xb9b59f,-8.5+i,.92,-ARENA.h/2-.2);box(scene,.78,.22,.42,0xb9b59f,-8.5+i,.92,ARENA.h/2+.2)}for(let i=0;i<30;i++){box(scene,.42,.22,.78,0xb9b59f,-ARENA.w/2-.2,.92,-14.5+i);box(scene,.42,.22,.78,0xb9b59f,ARENA.w/2+.2,.92,-14.5+i)}}
function lanes(){[-5,5].forEach(lx=>{for(let side=-1;side<=1;side+=2){const a=side>0?ARENA.river+.55:-ARENA.h/2+2,b=side>0?ARENA.h/2-2:-ARENA.river-.55;for(let z=Math.min(a,b);z<=Math.max(a,b);z+=.72){let p=box(scene,1.15,.055,.62,Math.floor((z+20)*2)%2?0xbca47c:0xc7b28a,lx,.075,z);p.rotation.y=(Math.random()-.5)*.06}}})}
function bridge(x){box(scene,3.65,.23,ARENA.river*2.38,C.woodD,x,.16,0);for(let i=-3;i<=3;i++){let p=box(scene,3.62,.16,.38,C.wood,x,.3,i*.48);p.rotation.y=i%2?.025:-.025}[-1,1].forEach(sx=>{[-1.45,-.55,.55,1.45].forEach(z=>{box(scene,.18,.78,.18,C.woodD,x+sx*1.92,.55,z);cone(scene,.16,.25,C.gold,x+sx*1.92,1.06,z)});box(scene,.13,.14,3.15,C.woodD,x+sx*1.92,.78,0)});[-1,1].forEach(sz=>box(scene,4.1,.32,.28,0x9e9a86,x,.18,sz*1.85))}
function decor(){for(let i=0;i<10;i++){tree(-10.4,-13+i*2.8);tree(10.4,-13+i*2.8)}for(let i=0;i<40;i++){const s=Math.random()<.5?-1:1;rock(s*(8.8+Math.random()),-14+Math.random()*28,.3+Math.random()*.45)}}
function tree(x,z){cyl(scene,.15,.18,.8,C.leather,x,.4,z,10);cone(scene,.75,1.25,0x1f7a35,x,1.1,z,12);cone(scene,.62,1.05,0x2c963e,x,1.65,z,12);cone(scene,.48,.85,0x3aae4d,x,2.12,z,12)}
function rock(x,z,s){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),mat(0x8a877a,.92));r.position.set(x,s*.35,z);r.scale.y=.6+Math.random()*.45;r.rotation.set(Math.random(),Math.random()*Math.PI,Math.random());r.castShadow=r.receiveShadow=true;scene.add(r)}
function health(w,h){const g=new THREE.Group(),bg=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0x102018,transparent:true,opacity:.92,side:THREE.DoubleSide})),fg=new THREE.Mesh(new THREE.PlaneGeometry(w-.05,h-.04),new THREE.MeshBasicMaterial({color:0x22c55e,side:THREE.DoubleSide}));fg.position.z=.01;fg.userData.bw=w-.05;g.add(bg,fg);g.userData.fill=fg;return g}
function updHp(o){if(!o.hpbar)return;let r=Math.max(0,o.hp/o.maxHp),fg=o.hpbar.userData.fill;fg.scale.x=r;fg.position.x=-fg.userData.bw*(1-r)/2;fg.material.color.setHex(r>.55?0x22c55e:r>.25?0xfacc15:0xef4444)}
function createBuilding(team,kind,x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const col=team==='blue'?C.blue:C.red,roof=team==='blue'?0x2563eb:0xdc2626,isKing=kind==='King';box(g,isKing?3.05:1.9,.36,isKing?3.05:1.9,C.stoneD,0,.18,0);cyl(g,isKing?.9:.72,isKing?1.1:.84,isKing?2.0:1.15,C.stone,0,isKing?1.35:1.02,0,22);cone(g,isKing?1.16:.9,isKing?.72:.62,roof,0,isKing?2.65:2.12,0);box(g,isKing?.9:.6,isKing?.6:.34,.13,col,0,isKing?1.72:1.58,team==='blue'?-1.25:.72);const o={type:'building',kind,team,mesh:g,hp:isKing?900:540,maxHp:isKing?900:540,dmg:isKing?30:23,range:isKing?6.2:5.35,delay:isKing?.82:.92,timer:0,alive:true,radius:isKing?1.35:.9};const hb=health(isKing?2.45:1.7,.18);hb.position.set(x,isKing?3.55:2.6,z);scene.add(hb);o.hpbar=hb;buildings.push(o)}
function setupBuildings(){createBuilding('blue','King',0,12.15);createBuilding('blue','Princess',-5.2,8.55);createBuilding('blue','Princess',5.2,8.55);createBuilding('red','King',0,-12.15);createBuilding('red','Princess',-5.2,-8.55);createBuilding('red','Princess',5.2,-8.55)}
function createUnit(team,type,x,z){const d=CARD[type],g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const col=team==='blue'?C.blue:C.red,acc=team==='blue'?C.blue2:C.red2;if(type==='Giant')modelGiant(g,col,acc);else if(type==='Archer')modelArcher(g,col,acc);else modelKnight(g,col,acc);const u={type:'unit',unitType:type,team,mesh:g,hp:d.hp,maxHp:d.hp,dmg:d.dmg,spd:d.spd,range:d.range,delay:d.delay,timer:0,buildingsOnly:d.buildings,alive:true,radius:type==='Giant'?.75:.48,bob:Math.random()*20,walk:0};const hb=health(type==='Giant'?1.55:1.08,.14);hb.position.set(x,type==='Giant'?2.55:1.72,z);scene.add(hb);u.hpbar=hb;units.push(u);ring(x,z,team==='blue'?C.blue2:C.red2);return u}
function limb(g,w,h,d,c,x,y,z,rz=0){const m=box(g,w,h,d,c,x,y,z);m.rotation.z=rz;return m}
function modelKnight(g,col,acc){sph(g,.24,C.skin,0,1.35,0);cone(g,.30,.30,C.iron,0,1.62,0,12);cyl(g,.34,.43,.78,col,0,.82,0,18);box(g,.72,.20,.40,C.iron,0,1.04,0,.35,.2);limb(g,.16,.58,.16,C.iron,-.43,.82,0,.25);limb(g,.16,.58,.16,C.iron,.43,.82,0,-.25);limb(g,.15,.55,.15,C.leather,-.18,.28,0,.08);limb(g,.15,.55,.15,C.leather,.18,.28,0,-.08);box(g,.13,.62,.52,acc,-.57,.78,-.04).rotation.z=.18;box(g,.045,.82,.055,C.iron,.58,.86,-.05,.25,.25).rotation.z=-.55;box(g,.22,.10,.12,C.gold,.58,1.18,-.05)}
function modelArcher(g,col,acc){sph(g,.22,C.skin,0,1.25,0);cone(g,.34,.44,col,0,1.43,0,16);cyl(g,.27,.36,.70,acc,0,.75,0,16);limb(g,.13,.50,.13,C.skin,-.36,.76,0,.35);limb(g,.13,.50,.13,C.skin,.36,.76,0,-.35);limb(g,.12,.48,.12,C.leather,-.16,.25,0,.08);limb(g,.12,.48,.12,C.leather,.16,.25,0,-.08);let bow=new THREE.Mesh(new THREE.TorusGeometry(.42,.030,8,32,Math.PI),mat(C.woodD));bow.position.set(.58,.84,-.02);bow.rotation.set(Math.PI/2,0,Math.PI/2);bow.castShadow=true;g.add(bow);box(g,.02,.88,.02,0xf4e7c1,.58,.84,-.02);box(g,.18,.56,.18,C.leather,-.34,.76,.28).rotation.x=.45}
function modelGiant(g,col,acc){sph(g,.42,C.skin,0,1.92,0);cyl(g,.58,.76,1.35,col,0,1.02,0,22);box(g,1.22,.22,1.0,C.gold,0,.82,0);limb(g,.24,.80,.24,acc,-.72,1.18,0,.25);limb(g,.24,.80,.24,acc,.72,1.18,0,-.25);limb(g,.22,.62,.22,C.leather,-.32,.32,0,.08);limb(g,.22,.62,.22,C.leather,.32,.32,0,-.08);let club=cyl(g,.14,.20,1.35,C.woodD,.88,1.18,-.05,12);club.rotation.z=-.55;cyl(g,.25,.30,.40,C.wood,1.22,1.66,-.05,12).rotation.z=-.55;box(g,.80,.20,.18,C.gold,0,2.20,0)}
function ring(x,z,c,r1=.35,r2=.75){const r=new THREE.Mesh(new THREE.RingGeometry(r1,r2,32),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.78,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.set(x,.12,z);scene.add(r);effects.push({mesh:r,life:.5,max:.5,scale:2.2})}
function hit(pos,c){const s=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.9}));s.position.set(pos.x,pos.y+.8,pos.z);scene.add(s);effects.push({mesh:s,life:.22,max:.22,scale:3});shake=.09}
function projectile(a,b,dmg,c,spd=8.5){const m=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),new THREE.MeshBasicMaterial({color:c}));const p=a.mesh.position.clone();m.position.set(p.x,p.y+1,p.z);scene.add(m);projectiles.push({mesh:m,target:b,dmg,spd})}
function valid(o){return o&&o.alive&&o.hp>0&&o.mesh&&o.mesh.parent}
function dist(a,b){let dx=a.x-b.x,dz=a.z-b.z;return Math.sqrt(dx*dx+dz*dz)}
function targetUnit(u){let arr=[];if(!u.buildingsOnly)arr=arr.concat(units.filter(x=>x.team!==u.team&&valid(x)));arr=arr.concat(buildings.filter(b=>b.team!==u.team&&valid(b)));let best=null,bd=999;for(const c of arr){let d=dist(u.mesh.position,c.mesh.position)-(c.radius||0);if(d<bd){bd=d;best=c}}return best}
function targetTower(b){let best=null,bd=999;for(const u of units){if(u.team===b.team||!valid(u))continue;let d=dist(b.mesh.position,u.mesh.position);if(d<=b.range&&d<bd){best=u;bd=d}}return best}
function bridgeX(p,tg){let pref=(p.x+tg.x)/2;return Math.abs(pref-ARENA.bridges[0])<Math.abs(pref-ARENA.bridges[1])?ARENA.bridges[0]:ARENA.bridges[1]}
function dest(u,tg){let p=u.mesh.position,tgpos=tg.mesh.position,cross=(p.z>ARENA.river+.25&&tgpos.z<-ARENA.river-.25)||(p.z<-ARENA.river-.25&&tgpos.z>ARENA.river+.25);if(cross){let bx=bridgeX(p,tgpos);if(Math.abs(p.x-bx)>.35&&Math.abs(p.z)>ARENA.river+.1)return new THREE.Vector3(bx,p.y,p.z);return new THREE.Vector3(bx,p.y,tgpos.z)}return new THREE.Vector3(tgpos.x,p.y,tgpos.z)}
function damage(o,n){if(!valid(o))return;o.hp-=n;updHp(o);showDmg(o.mesh.position,Math.round(n),o.team==='blue'?'#93c5fd':'#fca5a5');if(o.hp<=0){o.alive=false;scene.remove(o.mesh);if(o.hpbar)scene.remove(o.hpbar);if(o.type==='building'){if(o.team==='blue')redCrowns++;else blueCrowns++}}}
function showDmg(pos,n,color){const v=pos.clone();v.y+=2.4;v.project(camera);const x=(v.x*.5+.5)*innerWidth,y=(-v.y*.5+.5)*innerHeight;const e=document.createElement('div');e.className='damageText';e.textContent='-'+n;e.style.left=x+'px';e.style.top=y+'px';e.style.color=color;document.body.appendChild(e);setTimeout(()=>e.remove(),760)}
function castFireball(team,p){const enemy=team==='blue'?'red':'blue';[...units,...buildings].forEach(o=>{if(valid(o)&&o.team===enemy&&dist(p,o.mesh.position)<=CARD.Fireball.radius)damage(o,CARD.Fireball.dmg)});ring(p.x,p.z,C.fire,.2,CARD.Fireball.radius);shake=.18}
function animateUnitModel(u,moving){u.walk+=moving?.18:.04;const s=moving?1:0.25;u.mesh.children.forEach((ch,i)=>{if(ch.geometry&&ch.geometry.type==='BoxGeometry'&&ch.position.y<.9)ch.rotation.x=Math.sin(u.walk+i)*.18*s});u.mesh.position.y=moving?Math.abs(Math.sin(u.walk))*0.055:0}
function updateUnits(dt){for(const u of units){if(!valid(u))continue;u.timer-=dt;const tg=targetUnit(u);if(!tg)continue;let d=Math.max(0,dist(u.mesh.position,tg.mesh.position)-(tg.radius||0));let look=new THREE.Vector3(tg.mesh.position.x-u.mesh.position.x,0,tg.mesh.position.z-u.mesh.position.z);if(look.lengthSq()>.001)u.mesh.rotation.y=Math.atan2(look.x,look.z);if(d<=u.range){animateUnitModel(u,false);if(u.timer<=0){u.timer=u.delay;if(u.range>2.1)projectile(u,tg,u.dmg,u.team==='blue'?0x93c5fd:0xfca5a5,9.6);else{damage(tg,u.dmg);hit(tg.mesh.position,u.team==='blue'?0x93c5fd:0xfca5a5)}}}else{let de=dest(u,tg),dir=new THREE.Vector3(de.x-u.mesh.position.x,0,de.z-u.mesh.position.z);if(dir.length()>.03){dir.normalize();u.mesh.position.x+=dir.x*u.spd*dt;u.mesh.position.z+=dir.z*u.spd*dt;animateUnitModel(u,true)}}u.hpbar.position.x=u.mesh.position.x;u.hpbar.position.z=u.mesh.position.z}}
function updateBuildings(dt){for(const b of buildings){if(!valid(b))continue;b.timer-=dt;let tg=targetTower(b);if(tg&&b.timer<=0){b.timer=b.delay;projectile(b,tg,b.dmg,b.team==='blue'?0xbfdbfe:0xfca5a5,10.5)}}}
function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){let p=projectiles[i];if(!valid(p.target)){scene.remove(p.mesh);projectiles.splice(i,1);continue}let tp=p.target.mesh.position.clone();tp.y+=p.target.type==='building'?1.4:.75;let dir=tp.sub(p.mesh.position),di=dir.length();if(di<.24){damage(p.target,p.dmg);hit(p.target.mesh.position,p.mesh.material.color.getHex());scene.remove(p.mesh);projectiles.splice(i,1)}else{dir.normalize();p.mesh.position.addScaledVector(dir,p.spd*dt)}}}
function updateFx(dt){for(let i=effects.length-1;i>=0;i--){let e=effects[i];e.life-=dt;let r=Math.max(0,e.life/e.max);e.mesh.material.opacity=r;e.mesh.scale.multiplyScalar(1+e.scale*dt);if(e.life<=0){scene.remove(e.mesh);effects.splice(i,1)}}water.forEach(w=>{w.mesh.position.x=w.baseX+Math.sin(t*w.spd+w.phase)*.35;w.mesh.material.opacity=.45+Math.sin(t*1.7+w.phase)*.18})}
function updateUI(dt){if(matchStarted&&!gameOver){playerElixir=Math.min(10,playerElixir+dt*.38);enemyElixir=Math.min(10,enemyElixir+dt*.35);matchTime=Math.max(0,matchTime-dt)}ui.fill.style.width=playerElixir*10+'%';ui.ev.textContent=playerElixir.toFixed(1)+' / 10';document.querySelectorAll('.card').forEach(c=>{let k=c.dataset.card;c.classList.toggle('disabled',playerElixir<CARD[k].cost);c.classList.toggle('selected',selected===k)});let bk=buildings.find(b=>b.team==='blue'&&b.kind==='King'),rk=buildings.find(b=>b.team==='red'&&b.kind==='King');ui.blue.textContent='Mavi King: '+(bk?Math.max(0,Math.round(bk.hp)):0)+' 👑 '+blueCrowns;ui.red.textContent=redCrowns+' 👑 Kırmızı King: '+(rk?Math.max(0,Math.round(rk.hp)):0);let m=Math.floor(matchTime/60),s=Math.floor(matchTime%60);ui.timer.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function updateAI(dt){if(!botMode)return;aiTimer-=dt;if(aiTimer>0)return;aiTimer=1.8+Math.random()*2.6;let affordable=Object.keys(CARD).filter(k=>CARD[k].cost<=enemyElixir&&CARD[k].kind==='unit');if(!affordable.length)return;let type=affordable[Math.floor(Math.random()*affordable.length)];enemyElixir-=CARD[type].cost;let lane=Math.random()<.5?-5:5;createUnit('red',type,lane+(Math.random()-.5)*2.4,-6.6-Math.random()*4.2)}
function billboards(){[...units,...buildings].forEach(o=>{if(o.hpbar)o.hpbar.quaternion.copy(camera.quaternion)})}
function cleanup(){for(let i=units.length-1;i>=0;i--)if(!units[i].alive)units.splice(i,1)}
function portraits(type){return{Knight:'<svg viewBox="0 0 100 80"><circle cx="50" cy="40" r="32" fill="#1d4ed8"/><path d="M28 39 L50 12 L72 39 Z" fill="#dbeafe"/><circle cx="50" cy="40" r="16" fill="#ffc799"/><rect x="22" y="46" width="56" height="25" rx="10" fill="#2563eb"/><path d="M18 42 h22 v30 h-22 z" fill="#60a5fa"/><path d="M65 35 l8 8 l-24 30 l-8-8 z" fill="#e5e7eb"/></svg>',Archer:'<svg viewBox="0 0 100 80"><circle cx="50" cy="42" r="31" fill="#22c55e"/><path d="M22 42 Q50 6 78 42 Q67 20 50 20 Q33 20 22 42Z" fill="#1d4ed8"/><circle cx="50" cy="43" r="15" fill="#ffc799"/><path d="M32 53 h36 v20 h-36 z" fill="#60a5fa"/><path d="M75 18 Q48 38 75 65" fill="none" stroke="#6b3f1d" stroke-width="7"/></svg>',Giant:'<svg viewBox="0 0 100 80"><circle cx="50" cy="40" r="35" fill="#b45309"/><rect x="25" y="34" width="50" height="39" rx="14" fill="#1d4ed8"/><circle cx="50" cy="28" r="20" fill="#ffc799"/><rect x="22" y="50" width="56" height="9" rx="3" fill="#e8b64c"/></svg>',Fireball:'<svg viewBox="0 0 100 80"><rect width="100" height="80" rx="18" fill="#450a0a"/><circle cx="52" cy="42" r="30" fill="#ef4444"/><path d="M30 52 C20 32 45 30 39 8 C63 24 84 36 65 66 C56 78 36 72 30 52Z" fill="#fb923c"/><path d="M46 59 C36 44 55 39 52 24 C67 39 66 54 57 63 C52 68 48 65 46 59Z" fill="#fef08a"/></svg>'}[type]}
function cards(){ui.cards.innerHTML='';Object.keys(CARD).forEach(k=>{let d=CARD[k],b=document.createElement('button');b.className='card';b.dataset.card=k;b.innerHTML='<div class="cost">'+d.cost+'</div><div class="portrait">'+portraits(k)+'</div><div class="cardName">'+d.label+'</div><div class="cardType">'+d.desc+'</div>';b.onclick=()=>{selected=selected===k?null:k;updateUI(0)};ui.cards.appendChild(b)})}
function tip(s){ui.tip.textContent=s;ui.tip.style.display='block';clearTimeout(tip.to);tip.to=setTimeout(()=>ui.tip.style.display='none',950)}
function remoteSpawn(m){createUnit(m.team,m.card,m.x,m.z)}
function remoteSpell(m){castFireball(m.team,new THREE.Vector3(m.x,0,m.z))}
function click(e){if(!matchStarted||gameOver||!selected)return;if(e.target.closest&&e.target.closest('#cards'))return;pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);let hit=raycaster.intersectObject(scene.getObjectByName('clickPlane'))[0];if(!hit)return;let p=hit.point,d=CARD[selected],team=myTeam;if(d.kind==='spell'){if(playerElixir<d.cost){tip('Yeterli iksir yok.');return}playerElixir-=d.cost;castFireball(team,p);if(online)send('spell',{roomId,team,x:p.x,z:p.z})}else{const isBlue=team==='blue',validZone=isBlue?(p.z>ARENA.playerMinZ&&p.z<ARENA.playerMaxZ):(p.z<-ARENA.playerMinZ&&p.z>-ARENA.playerMaxZ);if(!validZone){tip('Sadece kendi tarafına birlik çağırabilirsin.');return}if(playerElixir<d.cost){tip('Yeterli iksir yok.');return}playerElixir-=d.cost;createUnit(team,selected,p.x,p.z);if(online)send('spawn',{roomId,team,card:selected,x:p.x,z:p.z})}if(!e.shiftKey)selected=null;updateUI(0)}
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.04);t+=dt;if(matchStarted&&!gameOver){updateAI(dt);updateUnits(dt);updateBuildings(dt);updateProjectiles(dt)}updateUI(matchStarted?dt:0);updateFx(dt);billboards();cleanup();if(shake>0){shake*=.86;camera.position.x=Math.sin(t*80)*shake;camera.position.z=21+Math.cos(t*70)*shake}else{camera.position.x*=.9;camera.position.z+=(21-camera.position.z)*.12}camera.lookAt(0,0,0);renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
addEventListener('pointerdown',click);
ui.matchBtn.addEventListener('click',()=>{tip('Maç aranıyor...');pendingFindMatch=true;if(ws&&ws.readyState===1)sendFindMatch();else connect()});
ui.botBtn.addEventListener('click',()=>{botMode=true;matchStarted=true;myTeam='blue';ui.menu.style.display='none';ui.status.textContent='Bot test modu'});
initWorld();setupBuildings();cards();connect();animate();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

const wss = new WebSocket.Server({ server });

function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function broadcast(room, data, except = null) {
  for (const p of room.players) {
    if (p !== except) send(p.ws, data);
  }
}

function cleanupPlayer(player) {
  if (waitingPlayer === player) waitingPlayer = null;
  if (player.roomId && rooms.has(player.roomId)) {
    const room = rooms.get(player.roomId);
    room.players = room.players.filter(p => p !== player);
    broadcast(room, { type: 'opponent_left' });
    if (room.players.length === 0) rooms.delete(player.roomId);
  }
}

wss.on('connection', (ws) => {
  const player = { id: nextPlayerId++, ws, roomId: null, team: null };

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'find_match') {
      if (waitingPlayer && waitingPlayer.ws.readyState === WebSocket.OPEN && waitingPlayer !== player) {
        const roomId = nextRoomId++;
        const room = { id: roomId, players: [waitingPlayer, player] };
        rooms.set(roomId, room);

        waitingPlayer.roomId = roomId;
        waitingPlayer.team = 'blue';
        player.roomId = roomId;
        player.team = 'red';

        send(waitingPlayer.ws, { type: 'match_found', roomId, team: 'blue', opponentId: player.id });
        send(player.ws, { type: 'match_found', roomId, team: 'red', opponentId: waitingPlayer.id });
        waitingPlayer = null;
      } else {
        waitingPlayer = player;
        send(ws, { type: 'queued' });
      }
    }

    if (msg.type === 'spawn' || msg.type === 'spell') {
      const room = rooms.get(msg.roomId);
      if (!room) return;
      broadcast(room, msg, player);
    }
  });

  ws.on('close', () => cleanupPlayer(player));
});

server.listen(PORT, () => {
  console.log('CLASH ARENA ONLINE V4 çalışıyor');
  console.log('Local:   http://localhost:' + PORT);
  console.log('Tunnel:  npx.cmd localtunnel --port ' + PORT + ' --subdomain clashkuzeyarena');
});
