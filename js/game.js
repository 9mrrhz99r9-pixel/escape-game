(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);const imgs={};for(const n of ['floor','floor_alt','floor_horror','floor_decayed','wall','wall_cracked','locker','locker_decayed','desk','chair','door','window','board','cubby','student_idle','student_walk','wall_drip','enemy_sprite_sheet']){imgs[n]=new Image();imgs[n].src='assets/'+n+'.png'}
const TILE=window.FLOOR1_MAP.tileSize,W=window.FLOOR1_MAP.width,H=window.FLOOR1_MAP.height,rooms=window.FLOOR1_MAP.rooms;
let room=0,player={x:3.5,y:4.5,dir:'down',hidden:false},enemy={x:8,y:4,dir:0,mode:'wander',timer:0},hasKey=false,unlocked=false,gameOver=false,won=false,running=false,move={x:0,y:0},last=0,msgTimer=0,gameStarted=false;
function chooseKey(){rooms.forEach(r=>r.keySpot=null);const ri=Math.random()<.5?0:1;const candidates=ri===0?[[6,5],[9,2],[3,5]]:[[4,4],[8,2],[6,6]];rooms[ri].keySpot=candidates[Math.floor(Math.random()*candidates.length)];}
function reset(){room=0;player={x:3.5,y:4.5,dir:'down',hidden:false};enemy={x:8,y:4,dir:Math.PI,mode:'wander',timer:0,room:0};hasKey=false;unlocked=false;gameOver=false;won=false;running=false;chooseKey();$('overlay').style.display='none';$('roomLabel').textContent='ROOM 01';$('itemHud').textContent='所持品：なし';$('stateHud').textContent='探索中';gameStarted=true;notify('鍵を探して出口へ向かおう');last=performance.now();requestAnimationFrame(loop)}
function notify(t){const e=$('message');e.textContent=t;e.style.display='block';msgTimer=2.2}
function tileImg(name,x,y,w=TILE,h=TILE,angle=0){
  const im=imgs[name];
  if(!im||!im.complete||!im.naturalWidth)return;

  if(angle===0){
    ctx.drawImage(im,x,y,w,h);
    return;
  }

  ctx.save();
  ctx.translate(x+w/2,y+h/2);
  ctx.rotate(angle*Math.PI/180);
  ctx.drawImage(im,-w/2,-h/2,w,h);
  ctx.restore();
}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);const r=rooms[room];for(let y=0;y<H;y++)for(let x=0;x<W;x++){tileImg((x+y)%7===0?'floor_alt':'floor',x*TILE,y*TILE);if((x*3+y*7+room)%37===0)tileImg('floor_horror',x*TILE,y*TILE)}
// room perimeter walls, door gaps
for(let x=0;x<W;x++){
  tileImg('wall',x*TILE,0);
  tileImg('wall',x*TILE,(H-1)*TILE);
}
for(let y=1;y<H-1;y++){
  if(!r.doors.some(d=>d.x===0&&d.y===y))
    tileImg('wall',0,y*TILE,TILE,TILE,90);

  if(!r.doors.some(d=>d.x===W-1&&d.y===y))
    tileImg('wall',(W-1)*TILE,y*TILE,TILE,TILE,90);
}
// windows and decorations
if(room===0){tileImg('window',3*TILE,0,64,32);tileImg('board',7*TILE,0,64,32)}else if(room===1){tileImg('wall_drip',5*TILE,0,32,32);tileImg('window',7*TILE,0,64,32)}else{tileImg('wall_cracked',3*TILE,0);tileImg('wall_drip',8*TILE,0,32,32)}
// doors
for(const d of r.doors){ctx.fillStyle='#070909';ctx.fillRect(d.x*TILE,d.y*TILE,TILE,TILE);tileImg('door',d.x*TILE-16,d.y*TILE-16,64,64);if(d.to===2&&unlocked){ctx.fillStyle='#b7c9bc';ctx.fillRect(d.x*TILE+10,d.y*TILE+5,12,22)}}
// furniture
for(const [x,y,type] of r.furniture)tileImg(type,x*TILE,y*TILE,48,48);for(const [x,y] of r.lockers)tileImg('locker',x*TILE,y*TILE,48,48);
// key on floor
if(!hasKey&&r.keySpot){const [kx,ky]=r.keySpot;ctx.fillStyle='#e7c56e';ctx.fillRect(kx*TILE+12,ky*TILE+12,10,4);ctx.fillRect(kx*TILE+19,ky*TILE+13,3,8);ctx.fillRect(kx*TILE+17,ky*TILE+18,3,3);}
// enemy cone
if(room===enemy.room)drawCharacter(enemy.x,enemy.y,'enemy');
if(!player.hidden)drawCharacter(player.x,player.y,'player');else{ctx.fillStyle='#a7b3ad';ctx.font='12px sans-serif';ctx.fillText('隠れている',8,canvas.height-10)}
// vignette
const g=ctx.createRadialGradient(192,128,45,192,128,245);g.addColorStop(0,'#00000000');g.addColorStop(1,'#00000080');ctx.fillStyle=g;ctx.fillRect(0,0,384,256);
}
function drawCharacter(x,y,type){
  const px=x*TILE,py=y*TILE;

  if(type==='enemy'){
    const im=imgs.enemy_sprite_sheet;
    if(im&&im.complete&&im.naturalWidth){
      const fw=im.naturalWidth/4;
      const fh=im.naturalHeight;
      ctx.drawImage(im,0,0,fw,fh,px-27,py-34,54,68);
    }else{
      ctx.fillStyle='#191719';
      ctx.fillRect(px-7,py-10,14,20);
      ctx.fillStyle='#a52626';
      ctx.fillRect(px-5,py-6,3,3);
      ctx.fillRect(px+2,py-6,3,3);
      ctx.fillStyle='#555052';
      ctx.fillRect(px-8,py+7,16,5);
    }
  }else{
    const im=imgs.student_idle;
    if(im&&im.complete&&im.naturalWidth){
      ctx.drawImage(im,0,0,im.naturalWidth/4,im.naturalHeight/4,px-12,py-14,24,24);
    }else{
      ctx.fillStyle='#d6d9d2';
      ctx.fillRect(px-6,py-9,12,17);
      ctx.fillStyle='#222';
      ctx.fillRect(px-4,py-6,2,2);
      ctx.fillRect(px+2,py-6,2,2);
    }
  }
}

function collides(x,y,roomId=room){
  if(x<1||x>W-1||y<1||y>H-1)return true;
  const r=rooms[roomId];
  if(r.doors.some(d=>Math.abs(x-(d.x+.5))<.65&&Math.abs(y-(d.y+.5))<.65))return false;
  for(const [fx,fy] of r.furniture){
    if(x>fx-.1&&x<fx+1.35&&y>fy-.1&&y<fy+1.25)return true;
  }
  for(const [fx,fy] of r.lockers){
    if(x>fx-.1&&x<fx+1.25&&y>fy-.1&&y<fy+1.25)return true;
  }
  return false;
}
function direction(dx,dy){if(Math.abs(dx)>Math.abs(dy))return dx>0?'right':'left';return dy>0?'down':'up'}

function update(dt){
  if(!gameStarted||gameOver||won)return;

  if(msgTimer>0){
    msgTimer-=dt;
    if(msgTimer<=0)$('message').style.display='none';
  }

  // プレイヤー移動
  if(!player.hidden){
    const speed=running?3.0:1.85;
    let dx=0,dy=0;

    if(Math.abs(move.x)>Math.abs(move.y)){
      dx=Math.sign(move.x)*speed*dt;
    }else if(move.y!==0){
      dy=Math.sign(move.y)*speed*dt;
    }

    if(dx||dy){
      player.dir=direction(dx,dy);
      if(dx&&!collides(player.x+dx,player.y))player.x+=dx;
      if(dy&&!collides(player.x,player.y+dy))player.y+=dy;
    }
  }

  // 別の部屋にいる間に隠れた場合は追跡解除
  // 同じ部屋でチェイス中に隠れた場合は追跡を継続
  if(player.hidden&&enemy.mode==='chase'&&enemy.room!==room){
    enemy.mode='wander';
    enemy.timer=1.5;
    $('stateHud').textContent='探索中';
    notify('敵をやり過ごした');
  }

  // 巡回中の方向変更
  enemy.timer-=dt;
  if(enemy.mode!=='chase'&&enemy.timer<=0){
    enemy.timer=.8+Math.random()*1.6;
    enemy.dir=[0,Math.PI/2,Math.PI,-Math.PI/2][
      Math.floor(Math.random()*4)
    ];
  }

  // 同じ部屋にいる場合だけプレイヤーを発見
  if(enemy.room===room&&!player.hidden){
    const dx=player.x-enemy.x;
    const dy=player.y-enemy.y;
    const dist=Math.hypot(dx,dy);
    const angle=Math.atan2(dy,dx);
    const facing=Math.atan2(
      Math.sin(angle-enemy.dir),
      Math.cos(angle-enemy.dir)
    );

    if(dist<3.6&&Math.abs(facing)<.58){
      enemy.mode='chase';
      $('stateHud').textContent='!! 発見された !!';
    }
  }

  const es=enemy.mode==='chase'?1.5:.65;

  // 敵が別の部屋にいる場合、プレイヤーの部屋への経路を探す
  if(enemy.mode==='chase'&&enemy.room!==room){
    const visited=new Set([enemy.room]);
    const queue=[{room:enemy.room,firstDoor:null}];
    let nextDoor=null;

    while(queue.length){
      const current=queue.shift();

      if(current.room===room){
        nextDoor=current.firstDoor;
        break;
      }

      for(const d of rooms[current.room].doors){
        if(visited.has(d.to))continue;
        visited.add(d.to);
        queue.push({
          room:d.to,
          firstDoor:current.firstDoor||d
        });
      }
    }

    if(nextDoor){
      const tx=nextDoor.x===W-1?W-1.5:
               nextDoor.x===0?1.5:nextDoor.x+.5;
      const ty=nextDoor.y+.5;
      const dx=tx-enemy.x;
      const dy=ty-enemy.y;
      const dist=Math.hypot(dx,dy);

      if(dist<.35){
        enemy.room=nextDoor.to;
        enemy.x=nextDoor.tx+.5;
        enemy.y=nextDoor.ty+.5;

        // 入室前に隠れていれば追跡解除
        if(enemy.room===room&&player.hidden){
          enemy.mode='wander';
          enemy.timer=1.5;
          $('stateHud').textContent='探索中';
          notify('敵をやり過ごした');
        }
      }else{
        const step=Math.min(es*dt,dist);
        const dirs=Math.abs(dx)>Math.abs(dy)
          ?(dx>0?[0,Math.PI/2,-Math.PI/2,Math.PI]:
                [Math.PI,Math.PI/2,-Math.PI/2,0])
          :(dy>0?[Math.PI/2,0,Math.PI,-Math.PI/2]:
                [-Math.PI/2,0,Math.PI,Math.PI/2]);

        for(const dir of dirs){
          const nx=enemy.x+Math.cos(dir)*step;
          const ny=enemy.y+Math.sin(dir)*step;
          if(!collides(nx,ny,enemy.room)){
            enemy.x=nx;
            enemy.y=ny;
            enemy.dir=dir;
            break;
          }
        }
      }
    }
  }else if(enemy.room===room){
    // 同じ部屋での移動
    const chasing=enemy.mode==='chase';
    const dx=player.x-enemy.x;
    const dy=player.y-enemy.y;

    if(chasing){
      // 隠れている場合も、同じ部屋ならロッカーの位置を追う
      const dirs=Math.abs(dx)>Math.abs(dy)
        ?(dx>=0?[0,Math.PI/2,-Math.PI/2,Math.PI]:
               [Math.PI,Math.PI/2,-Math.PI/2,0])
        :(dy>=0?[Math.PI/2,0,Math.PI,-Math.PI/2]:
               [-Math.PI/2,0,Math.PI,Math.PI/2]);

      // 通れる方向のうち、プレイヤーに近づける方向を優先
      const candidates=[];
      const step=es*dt;

      for(const dir of dirs){
        const nx=enemy.x+Math.cos(dir)*step;
        const ny=enemy.y+Math.sin(dir)*step;

        if(!collides(nx,ny,enemy.room)){
          candidates.push({
            x:nx,
            y:ny,
            dir,
            dist:Math.hypot(player.x-nx,player.y-ny)
          });
        }
      }

      if(candidates.length){
        const bestDist=Math.min(...candidates.map(c=>c.dist));
        const best=candidates.filter(c=>c.dist<=bestDist+.001);
        const chosen=best[Math.floor(Math.random()*best.length)];

        enemy.x=chosen.x;
        enemy.y=chosen.y;
        enemy.dir=chosen.dir;
      }
    }else{
      // 巡回中は障害物にぶつかったら方向を変える
      const nx=enemy.x+Math.cos(enemy.dir)*es*dt;
      const ny=enemy.y+Math.sin(enemy.dir)*es*dt;

      if(!collides(nx,ny,enemy.room)){
        enemy.x=nx;
        enemy.y=ny;
      }else{
        const dirs=[0,Math.PI/2,Math.PI,-Math.PI/2]
          .sort(()=>Math.random()-.5);

        for(const dir of dirs){
          const tx=enemy.x+Math.cos(dir)*es*dt;
          const ty=enemy.y+Math.sin(dir)*es*dt;

          if(!collides(tx,ty,enemy.room)){
            enemy.dir=dir;
            enemy.x=tx;
            enemy.y=ty;
            break;
          }
        }
      }
    }
  }

  // 捕まったか判定
  // 同じ部屋でチェイス中なら、隠れていても捕まる
  if(enemy.mode==='chase'&&room===enemy.room&&
     Math.hypot(player.x-enemy.x,player.y-enemy.y)<.48){
    finish(false);
    return;
  }

  $('itemHud').textContent='所持品：'+(hasKey?'鍵':'なし');
  if(enemy.mode!=='chase'){
    $('stateHud').textContent='探索中';
  }
}
function finish(win){
  if(win){
    gameOver=false;
    won=true;
    gameStarted=false;
    $('overlay').style.display='flex';
    $('panelTitle').textContent='ESCAPED';
    $('panelText').innerHTML='出口から脱出した。<br>試作品クリア！';
    $('startBtn').textContent='はじめから';
    $('helpBtn').textContent='操作方法';
    return;
  }

  gameOver=true;
  won=false;
  gameStarted=false;

  const scare=$('jumpscare');
  scare.style.display='block';

  setTimeout(()=>{
    scare.style.display='none';
    $('overlay').style.display='flex';
    $('panelTitle').textContent='GAME OVER';
    $('panelText').innerHTML='敵に捕まってしまった。<br>タイトルからやり直そう。';
    $('startBtn').textContent='はじめから';
    $('helpBtn').textContent='操作方法';
  },2000);
}
function act(){if(!gameStarted)return;const r=rooms[room];if(player.hidden){player.hidden=false;notify('ロッカーから出た');return}
// door nearby
const d=r.doors.find(d=>Math.hypot(player.x-(d.x+.5),player.y-(d.y+.5))<1.5);if(d){if(d.to===2&&!hasKey&&!unlocked){notify('鍵がかかっている');return}if(d.to===2){unlocked=true;finish(true);return}room=d.to;player.x=d.tx+.5;player.y=d.ty+.5;$('roomLabel').textContent='ROOM 0'+(room+1)+' / '+rooms[room].name;notify(rooms[room].name+'に入った');return}
// key pickup
if(!hasKey&&r.keySpot&&Math.hypot(player.x-(r.keySpot[0]+.5),player.y-(r.keySpot[1]+.5))<1.25){hasKey=true;r.keySpot=null;notify('鍵を手に入れた');return}
// furniture/locker inspect
for(const [x,y] of r.lockers){if(Math.hypot(player.x-(x+.5),player.y-(y+.5))<1.4){player.hidden=true;notify('ロッカーに隠れた');return}}
for(const [x,y] of r.furniture){if(Math.hypot(player.x-(x+.5),player.y-(y+.5))<1.4){if(!hasKey&&r.keySpot&&Math.hypot(r.keySpot[0]-x,r.keySpot[1]-y)<2){hasKey=true;r.keySpot=null;notify('家具のそばで鍵を見つけた');}else notify('特に何も見つからない');return}}
notify('近くに調べられるものはない');}
function help(){ $('panelTitle').textContent='操作方法';$('panelText').innerHTML='左のパッド：移動<br>走る：移動速度アップ<br>調べる / 開ける：鍵・ドア・家具<br>隠れる：近くのロッカー<br>敵の正面に入らないように進もう。';$('startBtn').textContent='ゲームに戻る';$('helpBtn').style.display='none';$('overlay').style.display='flex';}
$('startBtn').onclick=()=>{if(gameStarted){$('overlay').style.display='none';return} $('helpBtn').style.display='';reset()};$('helpBtn').onclick=help;$('actBtn').onpointerdown=e=>{e.preventDefault();act()};$('runBtn').onpointerdown=e=>{e.preventDefault();running=true;$('runBtn').classList.add('active')};['pointerup','pointercancel','pointerleave'].forEach(ev=>$('runBtn').addEventListener(ev,()=>{running=false;$('runBtn').classList.remove('active')}));$('hideBtn').onclick=()=>{if(!gameStarted)return;if(player.hidden){player.hidden=false;notify('ロッカーから出た')}else{const r=rooms[room],near=r.lockers.some(([x,y])=>Math.hypot(player.x-(x+.5),player.y-(y+.5))<1.5);if(near){player.hidden=true;notify('ロッカーに隠れた')}else notify('近くにロッカーがない')}};$('menuBtn').onclick=()=>{if(!gameStarted)return;$('panelTitle').textContent='PAUSE';$('panelText').innerHTML='ゲームを一時停止中';$('startBtn').textContent='ゲームに戻る';$('helpBtn').style.display='';$('overlay').style.display='flex'};

let active=false,padRect=null;
const pad=$('pad'),stick=$('stick');
const gameCanvas=$('game');
let originX=0,originY=0;

pad.style.display='none';
pad.style.position='fixed';
pad.style.transform='none';
pad.style.zIndex='20';

function setStick(e){
  let dx=e.clientX-originX;
  let dy=e.clientY-originY;
  const max=31;
  const len=Math.hypot(dx,dy)||1;

  if(len>max){
    dx=dx/len*max;
    dy=dy/len*max;
  }

  move={x:dx/max,y:dy/max};
  stick.style.transform=`translate(${dx}px,${dy}px)`;
}

gameCanvas.style.touchAction='none';

gameCanvas.onpointerdown=e=>{
  if(!gameStarted||gameOver||won)return;
  e.preventDefault();

  active=true;
  originX=e.clientX;
  originY=e.clientY;

  pad.style.left=(originX-40)+'px';
  pad.style.top=(originY-40)+'px';
  pad.style.display='block';

  gameCanvas.setPointerCapture(e.pointerId);
  setStick(e);
};

const gameArea=$('gamewrap');

gameArea.onpointerdown=e=>{
  if(!gameStarted||gameOver||won)return;

  // HUDやメニューなどを触った場合は無視
  if(e.target.closest('button,.hud,.message,.overlay'))return;

  e.preventDefault();
  active=true;
  originX=e.clientX;
  originY=e.clientY;

  pad.style.left=(originX-40)+'px';
  pad.style.top=(originY-40)+'px';
  pad.style.display='block';

  gameArea.setPointerCapture(e.pointerId);
  setStick(e);
};
gameArea.onpointermove=e=>{
  if(active)setStick(e);
};
function release(){
  active=false;
  move={x:0,y:0};
  stick.style.transform='translate(0,0)';
  pad.style.display='none';
}

gameArea.onpointerup=release;
gameArea.onpointercancel=release;

window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')move.x=-1;if(e.key==='ArrowRight'||e.key==='d')move.x=1;if(e.key==='ArrowUp'||e.key==='w')move.y=-1;if(e.key==='ArrowDown'||e.key==='s')move.y=1;if(e.key==='Shift')running=true;if(e.key===' '||e.key==='Enter')act()});window.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','a','d'].includes(e.key))move.x=0;if(['ArrowUp','ArrowDown','w','s'].includes(e.key))move.y=0;if(e.key==='Shift')running=false});
function loop(t){if(!gameStarted)return;let dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
// Render preview behind title overlay
chooseKey();draw();
})();
