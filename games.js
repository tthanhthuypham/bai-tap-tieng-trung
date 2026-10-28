/* Extra vocabulary games, shared by the HSK 1 and HSK 2 pages.
   Each game gets the stage element, the lesson vocab [[hanzi, pinyin, vietnamese], ...] and a small context
   {say, store, key}. Animation loops stop by themselves once the stage leaves the page. */
(function(){
const css=`
.vg-hud{display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:center;font-weight:800;font-variant-numeric:tabular-nums;margin-bottom:10px}
.vg-hud .hearts{letter-spacing:2px}
.vg-start{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:10px 4px}
.vg-start .ico{font-size:64px;line-height:1}
.vg-start p{margin:0;max-width:52ch}
.vg-seg{display:inline-flex;border:1.5px solid var(--line);border-radius:999px;overflow:hidden;background:var(--card)}
.vg-seg button{border:0;background:transparent;padding:7px 14px;font-weight:700;font-size:14px}
.vg-seg button[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.vg-prompt{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;text-align:center;font-weight:800;font-size:20px;margin-bottom:10px}
.vg-prompt .zhq{font:500 40px/1.1 var(--f-zh)}
.vg-prompt.shake{animation:vgshake .35s}
@keyframes vgshake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.vg-say{border:0;border-radius:999px;background:var(--jade);color:#fff;font-weight:800;padding:8px 14px;font-size:15px}
/* sea */
.vg-sea{position:relative;height:min(380px,62vh);border-radius:16px;overflow:hidden;touch-action:manipulation;
  background:linear-gradient(#7fd3f0 0%,#2f9fd0 35%,#1b6fa8 75%,#134f7d 100%)}
.vg-sea::before{content:"";position:absolute;left:0;right:0;top:0;height:18px;background:repeating-radial-gradient(circle at 10px -6px,rgba(255,255,255,.55) 0 8px,transparent 9px 20px);background-size:20px 18px;opacity:.7}
.vg-sea .sand{position:absolute;left:0;right:0;bottom:0;height:34px;background:linear-gradient(#e8cf8f,#cfae62);border-radius:50% 50% 0 0/14px 14px 0 0}
.vg-sea .weed{position:absolute;bottom:20px;width:14px;border-radius:14px 14px 0 0;background:#2e9e6a;transform-origin:bottom;animation:vgsway 3s ease-in-out infinite alternate}
@keyframes vgsway{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
.vg-sea .bub{position:absolute;bottom:-20px;width:10px;height:10px;border-radius:50%;border:2px solid rgba(255,255,255,.7);animation:vgbub linear infinite}
@keyframes vgbub{to{transform:translateY(-420px)}}
.vg-fish{position:absolute;left:0;top:0;border:0;background:none;padding:0;cursor:pointer;will-change:transform}
.vg-fish svg{display:block;width:100%;height:100%;overflow:visible}
.vg-fish .lab{position:absolute;left:12%;right:28%;top:50%;transform:translateY(-50%);text-align:center;font:600 21px/1 var(--f-zh);color:#10202a;pointer-events:none;white-space:nowrap}
.vg-fish.flip .lab{left:28%;right:12%}
.vg-fish.miss svg{filter:grayscale(1) brightness(.75)}
.vg-fish.gone{transition:transform .55s ease-in,opacity .55s;opacity:0}
.vg-line{position:absolute;width:2px;background:rgba(255,255,255,.85);top:0;pointer-events:none;transition:height .25s}
/* sky */
.vg-sky{position:relative;height:min(400px,64vh);border-radius:16px;overflow:hidden;touch-action:manipulation;background:linear-gradient(#bfe6ff,#eaf7ff 70%,#d8f0d0)}
.vg-sky .cloud{position:absolute;width:110px;height:34px;border-radius:30px;background:#fff;opacity:.85;animation:vgcloud linear infinite}
.vg-sky .cloud::before,.vg-sky .cloud::after{content:"";position:absolute;background:#fff;border-radius:50%}
.vg-sky .cloud::before{width:46px;height:46px;left:16px;top:-22px}.vg-sky .cloud::after{width:36px;height:36px;left:54px;top:-14px}
@keyframes vgcloud{from{transform:translateX(-140px)}to{transform:translateX(900px)}}
.vg-bal{position:absolute;left:0;top:0;border:0;background:none;padding:0;width:92px;height:122px;cursor:pointer;will-change:transform}
.vg-bal .b{position:absolute;left:0;top:0;width:92px;height:104px;border-radius:50% 50% 48% 48%/55% 55% 45% 45%;display:grid;place-items:center;
  box-shadow:inset -10px -12px 0 rgba(0,0,0,.12),inset 10px 8px 0 rgba(255,255,255,.35);font:700 15px/1.15 var(--f-body);color:#132;padding:6px;text-align:center;overflow-wrap:anywhere}
.vg-bal .b.zhb{font:600 20px/1.1 var(--f-zh)}
.vg-bal .s{position:absolute;left:45px;top:104px;width:2px;height:18px;background:#777}
.vg-bal.pop .b{animation:vgpop .25s forwards}.vg-bal.pop .s{display:none}
@keyframes vgpop{to{transform:scale(1.5);opacity:0}}
.vg-bal.bad .b{filter:grayscale(1)}
/* river */
.vg-river{position:relative;height:min(420px,66vh);border-radius:16px;overflow:hidden;background:linear-gradient(90deg,#5fb2d9,#3f97c6 50%,#5fb2d9);touch-action:manipulation}
.vg-river .bank{position:absolute;left:0;right:0;height:46px;background:linear-gradient(#7cc56a,#5aa74c);display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff}
.vg-river .bank.top{top:0}.vg-river .bank.bot{bottom:0}
.vg-river .wave{position:absolute;left:0;right:0;height:2px;background:rgba(255,255,255,.35)}
.vg-pads{position:absolute;left:0;right:0;top:110px;display:flex;justify-content:space-around;padding:0 8px}
.vg-pad{width:min(30%,128px);aspect-ratio:1;border-radius:50%;border:0;background:radial-gradient(circle at 40% 35%,#8fe07c,#3f9f3a 70%);box-shadow:0 6px 0 rgba(0,0,0,.18);
  display:grid;place-items:center;padding:8px;font:700 15px/1.2 var(--f-body);color:#0e2a0c;text-align:center;overflow-wrap:anywhere;position:relative;transition:transform .3s,opacity .3s}
.vg-pad::after{content:"";position:absolute;right:-2%;top:44%;width:14%;height:12%;background:#3f97c6;border-radius:0 50% 50% 0;transform:rotate(-20deg)}
.vg-pad.zhb{font:600 24px/1.1 var(--f-zh)}
.vg-pad.sink{transform:scale(.4);opacity:0}
.vg-frog{position:absolute;left:50%;bottom:58px;width:76px;margin-left:-38px;font-size:60px;line-height:1;text-align:center;transition:transform .38s cubic-bezier(.3,1.6,.6,1);pointer-events:none}
.vg-frog .q{position:absolute;left:50%;bottom:66px;transform:translateX(-50%);background:#fff;color:#123;border-radius:12px;padding:5px 12px;font:600 26px/1.2 var(--f-zh);white-space:nowrap;box-shadow:0 3px 0 rgba(0,0,0,.15)}
.vg-frog .q.vi{font:800 16px/1.3 var(--f-body)}
.vg-splash{position:absolute;font-size:40px;pointer-events:none;animation:vgsplash .6s forwards}
@keyframes vgsplash{to{transform:translateY(-30px);opacity:0}}
.vg-steps{display:flex;gap:5px;justify-content:center;margin-bottom:8px}
.vg-steps i{width:22px;height:8px;border-radius:9px;background:var(--line)}.vg-steps i.on{background:var(--jade)}
/* match */
.vg-match{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.vg-col{display:flex;flex-direction:column;gap:8px}
.vg-card{min-height:58px;border-radius:14px;border:2px solid var(--line);background:var(--card);padding:8px 10px;font:700 15px/1.25 var(--f-body);transition:transform .2s,opacity .3s,background .2s}
.vg-card.zhc{font:500 26px/1.1 var(--f-zh)}
.vg-card small{display:block;font:500 12px var(--f-body);color:var(--muted)}
.vg-card.sel{border-color:var(--sky);background:var(--sky-soft)}
.vg-card.ok{border-color:var(--jade);background:var(--jade-soft);transform:scale(.92);opacity:0}
.vg-card.no{border-color:var(--seal);background:var(--seal-soft);animation:vgshake .35s}
.vg-card:empty{visibility:hidden}
`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const rnd=(a,b)=>a+Math.random()*(b-a);
let actx=null;
function beep(ok){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t=actx.currentTime;
  (ok?[660,880]:[220,160]).forEach((f,i)=>{const o=actx.createOscillator(),g=actx.createGain();o.type=ok?"triangle":"sawtooth";o.frequency.value=f;
    g.gain.setValueAtTime(.0001,t+i*.09);g.gain.exponentialRampToValueAtTime(ok?.18:.08,t+i*.09+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.09+.16);
    o.connect(g).connect(actx.destination);o.start(t+i*.09);o.stop(t+i*.09+.18)})}catch(e){}}
// pick n options (by text produced by fn) that are all different from each other
function options(V,target,n,fn){const seen=new Set([fn(target)]),out=[target];for(const w of shuffle(V)){if(out.length>=n)break;const k=fn(w);if(!seen.has(k)){seen.add(k);out.push(w)}}return shuffle(out)}
let timers=[];
function every(fn,ms){const id=setInterval(fn,ms);timers.push(id);return id}
function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function stop(){timers.forEach(id=>{clearInterval(id);clearTimeout(id)});timers=[];running=null}
let running=null; // token of the current loop
function loop(stage,step){const tok={};running=tok;let last=performance.now();
  const f=now=>{if(running!==tok||!stage.isConnected){if(running===tok)stop();return}const dt=Math.min(.05,(now-last)/1000);last=now;step(dt,now);requestAnimationFrame(f)};requestAnimationFrame(f)}
function nextTarget(V,prev){let t;do{t=V[Math.random()*V.length|0]}while(V.length>1&&t===prev);return t}

function startScreen(el,{ico,title,text,modes,modeKey,c,best,go}){
  const m=modes?c.store.get(modeKey,modes[0][0]):null;
  el.innerHTML=`<div class="vg-start"><div class="ico">${ico}</div><h3>${title}</h3><p>${text}</p>
    ${modes?`<div class="vg-seg" role="group" aria-label="Kiểu câu hỏi">${modes.map(([k,n])=>`<button type="button" data-m="${k}" aria-pressed="${k===m}">${n}</button>`).join("")}</div>`:""}
    <button class="btn seal" type="button" id="vgGo">Bắt đầu</button>${best?`<p class="note">${best}</p>`:""}</div>`;
  el.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{c.store.set(modeKey,b.dataset.m);el.querySelectorAll("[data-m]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
  el.querySelector("#vgGo").onclick=()=>go(modes?c.store.get(modeKey,modes[0][0]):null)}
function endScreen(el,{ico,title,line,again}){el.innerHTML=`<div class="vg-start"><div class="ico">${ico}</div><h3>${title}</h3><p>${line}</p><button class="btn seal" type="button" id="vgAgain">Chơi lại</button></div>`;el.querySelector("#vgAgain").onclick=again}
function highScore(c,k,score){const b=c.store.get(c.key+k,0);if(score>b)c.store.set(c.key+k,score);return {b,rec:score>b}}

/* ---------- 1. Câu cá ---------- */
const FISHC=["#FFB547","#FF7A6B","#7FD1FF","#9BE07F","#F7A8E0","#FFE066"];
function fishSVG(color){return `<svg viewBox="0 0 160 70" aria-hidden="true"><path d="M128 35 L158 10 L152 35 L158 60 Z" fill="${color}" stroke="#123" stroke-width="2.5" stroke-linejoin="round"/>
  <ellipse cx="68" cy="35" rx="64" ry="31" fill="${color}" stroke="#123" stroke-width="2.5"/><path d="M60 6 Q78 -6 96 8" fill="${color}" stroke="#123" stroke-width="2.5"/>
  <circle cx="20" cy="27" r="6" fill="#fff" stroke="#123" stroke-width="2"/><circle cx="18.5" cy="27" r="3" fill="#123"/><path d="M6 42 Q12 46 18 42" fill="none" stroke="#123" stroke-width="2"/></svg>`}
function fish(el,V,c){
  const best=()=>{const b=c.store.get(c.key+"fish",0);return b?`Kỷ lục của em: ${b} điểm`:""};
  const intro=()=>startScreen(el,{ico:"🎣",title:"Câu cá chữ Hán",text:"Cá mang chữ Hán bơi qua lại. Đọc gợi ý rồi chạm đúng con cá có từ đó để câu lên. Chạm nhầm bị trừ 3 giây. Có 60 giây!",
    modes:[["vi","Gợi ý bằng nghĩa"],["say","Gợi ý bằng giọng đọc"],["py","Gợi ý bằng pinyin"]],modeKey:"vgfish",c,best:best(),go:play});
  function play(mode){stop();let score=0,streak=0,left=60,target=null,fishes=[];
    el.innerHTML=`<div class="vg-hud"><span id="vgT">⏱ 60s</span><span id="vgS">Điểm 0</span><span id="vgK">Chuỗi 0🔥</span></div>
      <div class="vg-prompt" id="vgP"></div><div class="vg-sea" id="vgSea"><div class="sand"></div></div>`;
    const sea=el.querySelector("#vgSea"),P=el.querySelector("#vgP");
    for(let i=0;i<5;i++){const w=document.createElement("i");w.className="weed";w.style.cssText=`left:${8+i*21}%;height:${40+Math.random()*50}px;animation-delay:${-Math.random()*3}s`;sea.appendChild(w)}
    for(let i=0;i<8;i++){const b=document.createElement("i");b.className="bub";b.style.cssText=`left:${Math.random()*95}%;animation-duration:${4+Math.random()*5}s;animation-delay:${-Math.random()*8}s;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px`;sea.appendChild(b)}
    const hud=()=>{el.querySelector("#vgT").textContent=`⏱ ${left}s`;el.querySelector("#vgS").textContent=`Điểm ${score}`;el.querySelector("#vgK").textContent=`Chuỗi ${streak}🔥`};
    function round(){fishes.forEach(f=>f.el.remove());fishes=[];target=nextTarget(V,target);
      P.innerHTML=mode==="say"?`<button class="vg-say" type="button" id="vgSay">🔊 Nghe lại</button><span>Con cá nào?</span>`:mode==="py"?`<span>Câu con cá:</span><span style="font-size:26px">${esc(target[1])}</span>`:`<span>Câu con cá:</span><span>“${esc(target[2])}”</span>`;
      if(mode==="say"){c.say(target[0]);P.querySelector("#vgSay").onclick=()=>c.say(target[0])}
      const W=sea.clientWidth,H=sea.clientHeight,opts=options(V,target,Math.min(V.length,W<500?4:5),w=>w[0]);
      const lane=(H-80)/opts.length;const speed=55+Math.min(60,streak*6);
      opts.forEach((w,i)=>{const len=[...w[0]].length,fw=Math.max(104,60+len*26),fh=fw*.44;
        const b=document.createElement("button");b.type="button";b.className="vg-fish";b.style.width=fw+"px";b.style.height=fh+"px";b.setAttribute("aria-label",w[0]);
        b.innerHTML=fishSVG(FISHC[(i+Math.random()*6|0)%6])+`<span class="lab">${esc(w[0])}</span>`;sea.appendChild(b);
        const dir=Math.random()<.5?-1:1;const f={el:b,w,x:rnd(0,Math.max(1,W-fw)),y:24+i*lane+rnd(0,Math.max(0,lane-fh)),vx:dir*speed*rnd(.75,1.3),fw,ph:Math.random()*6,dead:false};
        b.onclick=()=>hit(f);fishes.push(f)})}
    function hit(f){if(f.dead||left<=0)return;
      if(f.w===target){f.dead=true;beep(true);score+=10+streak*2;streak++;hud();
        const line=document.createElement("i");line.className="vg-line";line.style.left=(f.x+f.fw*.15)+"px";line.style.height="0px";sea.appendChild(line);
        requestAnimationFrame(()=>{line.style.height=(f.y+10)+"px"});
        later(()=>{f.el.classList.add("gone");f.el.style.transform=`translate(${f.x}px,-140px) rotate(-30deg)`;line.style.height="0px"},250);later(()=>{line.remove();if(left>0)round()},800)}
      else{f.el.classList.add("miss");beep(false);streak=0;left=Math.max(0,left-3);hud();P.classList.remove("shake");void P.offsetWidth;P.classList.add("shake");later(()=>f.el.classList.remove("miss"),600)}}
    round();hud();
    loop(sea,(dt,now)=>{const W=sea.clientWidth;fishes.forEach(f=>{if(f.dead)return;f.x+=f.vx*dt;
      if(f.x<-f.fw*.25){f.x=-f.fw*.25;f.vx=Math.abs(f.vx)}if(f.x>W-f.fw*.75){f.x=W-f.fw*.75;f.vx=-Math.abs(f.vx)}
      const y=f.y+Math.sin(now/600+f.ph)*6;const flip=f.vx>0;f.el.classList.toggle("flip",flip);
      f.el.style.transform=`translate(${f.x}px,${y}px)`;f.el.querySelector("svg").style.transform=flip?"scaleX(-1)":""})});
    every(()=>{left--;hud();if(left<=0){stop();const h=highScore(c,"fish",score);endScreen(el,{ico:h.rec?"🏆":"🐟",title:`${score} điểm`,line:h.rec?"Kỷ lục mới!":`Kỷ lục: ${h.b} điểm`,again:intro})}},1000)}
  intro()}

/* ---------- 2. Bóng bay ---------- */
const BALC=["#FF8A80","#FFD54F","#81D4FA","#A5D6A7","#CE93D8","#FFAB91"];
function balloons(el,V,c){
  const best=()=>{const b=c.store.get(c.key+"bal",0);return b?`Kỷ lục của em: ${b} điểm`:""};
  const intro=()=>startScreen(el,{ico:"🎈",title:"Bắn bóng bay",text:"Bóng bay bay lên mang đáp án. Nhìn chữ Hán ở trên rồi chạm đúng quả bóng. Để bóng đúng bay mất hoặc chạm nhầm sẽ mất một trái tim ❤️.",
    modes:[["py","Chọn pinyin"],["vi","Chọn nghĩa"]],modeKey:"vgbal",c,best:best(),go:play});
  function play(mode){stop();let score=0,lives=3,target=null,bals=[],since=0,spawnT=0,level=0,over=false;
    const txt=w=>mode==="py"?w[1]:w[2];
    el.innerHTML=`<div class="vg-hud"><span class="hearts" id="vgH"></span><span id="vgS">Điểm 0</span></div><div class="vg-prompt" id="vgP"></div><div class="vg-sky" id="vgSky"></div>`;
    const sky=el.querySelector("#vgSky"),P=el.querySelector("#vgP");
    for(let i=0;i<3;i++){const cl=document.createElement("i");cl.className="cloud";cl.style.cssText=`top:${20+i*90}px;animation-duration:${22+i*9}s;animation-delay:${-i*7}s`;sky.appendChild(cl)}
    const hud=()=>{el.querySelector("#vgH").textContent="❤️".repeat(lives)+"🤍".repeat(3-lives);el.querySelector("#vgS").textContent=`Điểm ${score}`};
    const newTarget=()=>{target=nextTarget(V,target);since=0;P.innerHTML=`<span class="zhq">${esc(target[0])}</span><button class="vg-say" type="button" id="vgSay">🔊</button>`;P.querySelector("#vgSay").onclick=()=>c.say(target[0])};
    function spawn(){const W=sky.clientWidth,H=sky.clientHeight;const useT=since>=2||Math.random()<.35;const w=useT?target:options(V,target,2,txt).find(x=>txt(x)!==txt(target))||target;since=useT?0:since+1;
      const b=document.createElement("button");b.type="button";b.className="vg-bal";b.setAttribute("aria-label",txt(w));
      b.innerHTML=`<span class="b" style="background:${BALC[Math.random()*6|0]}">${esc(txt(w))}</span><span class="s"></span>`;sky.appendChild(b);
      const o={el:b,w,x:rnd(4,Math.max(5,W-96)),y:H+10,vy:rnd(42,62)+level*4,ph:Math.random()*6,dead:false};b.onclick=()=>tap(o);bals.push(o)}
    function lose(){lives--;hud();beep(false);P.classList.remove("shake");void P.offsetWidth;P.classList.add("shake");if(lives<=0)end()}
    function tap(o){if(o.dead||over)return;o.dead=true;
      if(txt(o.w)===txt(target)){o.el.classList.add("pop");beep(true);score+=10;level++;hud();later(()=>o.el.remove(),260);newTarget()}
      else{o.el.classList.add("pop","bad");later(()=>o.el.remove(),260);lose()}}
    function end(){over=true;stop();const h=highScore(c,"bal",score);endScreen(el,{ico:h.rec?"🏆":"🎈",title:`${score} điểm`,line:h.rec?"Kỷ lục mới!":`Kỷ lục: ${h.b} điểm`,again:intro})}
    newTarget();hud();spawn();
    loop(sky,(dt,now)=>{spawnT+=dt;if(spawnT>Math.max(.7,1.3-level*.04)){spawnT=0;spawn()}
      bals.forEach(o=>{if(o.dead)return;o.y-=o.vy*dt;const x=o.x+Math.sin(now/700+o.ph)*10;o.el.style.transform=`translate(${x}px,${o.y}px)`;
        if(o.y<-130){o.dead=true;o.el.remove();if(txt(o.w)===txt(target)&&!over)lose()}});
      bals=bals.filter(o=>!o.dead||o.el.isConnected)})}
  intro()}

/* ---------- 3. Ếch qua sông ---------- */
function frog(el,V,c){
  const STEPS=8;
  const best=()=>{const b=c.store.get(c.key+"frog",0);return b?`Kỷ lục: qua sông trong ${b} giây`:""};
  const intro=()=>startScreen(el,{ico:"🐸",title:"Ếch con qua sông",text:`Giúp ếch nhảy qua ${STEPS} lá sen để sang bờ bên kia. Mỗi lần chọn lá sen có đáp án đúng. Nhảy nhầm lá sẽ chìm và ếch mất một trái tim.`,c,best:best(),go:play});
  function play(){stop();let step=0,lives=3,t0=Date.now(),target=null,busy=false;
    el.innerHTML=`<div class="vg-hud"><span class="hearts" id="vgH"></span><span id="vgT">⏱ 0s</span></div><div class="vg-steps" id="vgSt">${"<i></i>".repeat(STEPS)}</div>
      <div class="vg-river" id="vgR"><div class="bank top">🏁 Bờ bên kia</div><div class="vg-pads" id="vgPads"></div><div class="vg-frog" id="vgF"><div class="q" id="vgQ"></div>🐸</div><div class="bank bot">Bờ bên này</div></div>`;
    const R=el.querySelector("#vgR"),F=el.querySelector("#vgF"),pads=el.querySelector("#vgPads"),Q=el.querySelector("#vgQ");
    for(let i=0;i<6;i++){const w=document.createElement("i");w.className="wave";w.style.top=(70+i*50)+"px";w.style.opacity=.3+Math.random()*.4;R.appendChild(w)}
    const hud=()=>{el.querySelector("#vgH").textContent="❤️".repeat(lives)+"🤍".repeat(3-lives);el.querySelectorAll("#vgSt i").forEach((x,i)=>x.classList.toggle("on",i<step))};
    every(()=>{const t=el.querySelector("#vgT");if(t)t.textContent=`⏱ ${Math.round((Date.now()-t0)/1000)}s`},1000);
    function round(){busy=false;F.style.transition="none";F.style.transform="";void F.offsetWidth;F.style.transition="";
      target=nextTarget(V,target);const kind=["vi","py","hz"][step%3];
      const show=kind==="hz"?target[2]:target[0];Q.textContent=show;Q.className="q"+(kind==="hz"?" vi":"");
      const lab=w=>kind==="vi"?w[2]:kind==="py"?w[1]:w[0];
      pads.innerHTML=options(V,target,Math.min(3,V.length),lab).map(w=>`<button type="button" class="vg-pad ${kind==="hz"?"zhb":""}" data-ok="${w===target?1:0}">${esc(lab(w))}</button>`).join("");
      pads.querySelectorAll(".vg-pad").forEach(p=>p.onclick=()=>jump(p))}
    function jump(p){if(busy)return;const fr=F.getBoundingClientRect(),pr=p.getBoundingClientRect();const dx=pr.left+pr.width/2-(fr.left+fr.width/2),dy=pr.top+pr.height/2-(fr.top+fr.height*.6);
      if(p.dataset.ok==="1"){busy=true;beep(true);c.say(target[0]);F.style.transform=`translate(${dx}px,${dy}px)`;step++;hud();
        later(()=>{if(step>=STEPS){stop();const sec=Math.round((Date.now()-t0)/1000);const b=c.store.get(c.key+"frog",0);if(!b||sec<b)c.store.set(c.key+"frog",sec);
          endScreen(el,{ico:"🎉🐸",title:`Qua sông rồi! ${sec} giây`,line:!b||sec<b?"Kỷ lục mới!":`Kỷ lục: ${b} giây`,again:intro})}else round()},650)}
      else{beep(false);p.classList.add("sink");p.disabled=true;const s=document.createElement("span");s.className="vg-splash";s.textContent="💦";
        s.style.left=(pr.left-R.getBoundingClientRect().left+pr.width/2-20)+"px";s.style.top=(pr.top-R.getBoundingClientRect().top+pr.height/3)+"px";R.appendChild(s);later(()=>s.remove(),650);
        lives--;hud();if(lives<=0){stop();busy=true;later(()=>endScreen(el,{ico:"💦",title:"Ếch rơi xuống nước rồi!",line:`Em đã qua được ${step}/${STEPS} lá sen. Thử lại nhé!`,again:intro}),500)}}}
    hud();round()}
  intro()}

/* ---------- 4. Nối cặp nhanh ---------- */
function match(el,V,c){
  const best=()=>{const b=c.store.get(c.key+"match",0);return b?`Kỷ lục: ${b} giây`:""};
  const intro=()=>startScreen(el,{ico:"⚡",title:"Nối cặp siêu tốc",text:"Chạm một chữ Hán bên trái rồi chạm nghĩa đúng bên phải. Nối hết các từ của bài càng nhanh càng tốt. Nối nhầm bị cộng 3 giây.",c,best:best(),go:play});
  function play(){stop();const words=shuffle(V).slice(0,Math.min(V.length,12));let queue=words.slice(),pen=0,t0=Date.now(),sel=null,left=words.length;
    el.innerHTML=`<div class="vg-hud"><span id="vgT">⏱ 0s</span><span id="vgL">Còn ${left} cặp</span></div><div class="vg-match"><div class="vg-col" id="vgA"></div><div class="vg-col" id="vgB"></div></div>`;
    const A=el.querySelector("#vgA"),B=el.querySelector("#vgB"),N=Math.min(5,words.length);
    const slotsA=[],slotsB=[];for(let i=0;i<N;i++){const a=document.createElement("button");a.type="button";a.className="vg-card zhc";A.appendChild(a);slotsA.push(a);const b=document.createElement("button");b.type="button";b.className="vg-card";B.appendChild(b);slotsB.push(b)}
    const fill=(slot,w,side)=>{slot.className="vg-card"+(side==="a"?" zhc":"");slot.dataset.k=w?w[0]+"|"+w[2]:"";slot.innerHTML=w?(side==="a"?`${esc(w[0])}<small>${esc(w[1])}</small>`:esc(w[2])):"";slot.disabled=!w};
    const first=queue.splice(0,N);const bOrder=shuffle(first);first.forEach((w,i)=>fill(slotsA[i],w,"a"));bOrder.forEach((w,i)=>fill(slotsB[i],w,"b"));
    const time=()=>Math.round((Date.now()-t0)/1000)+pen;
    every(()=>{const t=el.querySelector("#vgT");if(t)t.textContent=`⏱ ${time()}s`},500);
    slotsA.forEach(a=>a.onclick=()=>{if(!a.dataset.k)return;slotsA.forEach(x=>x.classList.remove("sel"));a.classList.add("sel");sel=a;c.say(a.dataset.k.split("|")[0])});
    slotsB.forEach(b=>b.onclick=()=>{if(!b.dataset.k||!sel)return;
      if(b.dataset.k===sel.dataset.k){beep(true);const a=sel;sel=null;a.classList.add("ok");b.classList.add("ok");left--;el.querySelector("#vgL").textContent=`Còn ${left} cặp`;
        later(()=>{const w=queue.shift();fill(a,w,"a");if(w){const empty=slotsB.filter(x=>x!==b&&!x.dataset.k);const tgt=Math.random()<.5&&empty.length?empty[0]:b;if(tgt!==b)fill(b,null,"b");fill(tgt,w,"b")}else fill(b,null,"b");
          if(left<=0){stop();const sec=time();const bst=c.store.get(c.key+"match",0);if(!bst||sec<bst)c.store.set(c.key+"match",sec);
            endScreen(el,{ico:"⚡",title:`Xong ${words.length} cặp trong ${sec} giây`,line:!bst||sec<bst?"Kỷ lục mới!":`Kỷ lục: ${bst} giây`,again:intro})}},320)}
      else{beep(false);pen+=3;[b,sel].forEach(x=>{x.classList.remove("no");void x.offsetWidth;x.classList.add("no")});const s=sel;later(()=>{b.classList.remove("no");s.classList.remove("no","sel")},400);sel=null}})}
  intro()}

window.VocabGames={
  list:[["fish","🎣 Câu cá"],["bal","🎈 Bóng bay"],["frog","🐸 Ếch qua sông"],["match","⚡ Nối cặp"]],
  run(id,el,V,c){stop();if(!V||V.length<2){el.innerHTML=`<p class="note">Bài này chưa đủ từ mới để chơi.</p>`;return}({fish,bal:balloons,frog,match})[id](el,V,c)},
  stop
};
})();
