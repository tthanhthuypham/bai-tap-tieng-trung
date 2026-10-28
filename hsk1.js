/* Sổ luyện HSK 1 – student app (same account + server as HSK 2, progress saved under book "hsk1") */
const BOOK="hsk1";
const L=window.HSK1||[]; const LETTERS="ABCDEFGHIJK";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const mkStore=pre=>({get(k,d){try{const v=localStorage.getItem(pre+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(pre+k,JSON.stringify(v))}catch(e){}}});
const store=mkStore("hsk1:");   // progress, pending, exam, best
const shared=mkStore("hsk2:");  // login + pinyin switch are shared with the HSK 2 page
let progress=store.get("progress",{});
const STD_BLOCKS=["l1","l2","l3","r1","r2","r3","ph1","ph2","hz"], PIN_BLOCKS=["read","pw","ini","fin","tone","dlg","hz"];
const blocksOf=d=>d.kind==="std"?STD_BLOCKS:PIN_BLOCKS;
function lessonPct(id){const d=L.find(x=>x.id===id);if(!d)return 0;const B=blocksOf(d),p=progress[id]||{};let n=0;B.forEach(b=>{if(p[b])n++});return Math.round(n/B.length*100)}
let saveScore=function(id,b,s,t){progress[id]=progress[id]||{};const c=progress[id][b];if(!c||s/t>=c[0]/c[1])progress[id][b]=[s,t];store.set("progress",progress)}
function zh(t,cls="zh"){return `<span class="${cls}" data-zh="${esc(t)}">${esc(t)}</span>`}
function pad2(n){return String(n).padStart(2,"0")}
const track=(d,k)=>`audio1/${pad2(d.id)}-${k}.mp3`;
const im=(d,name)=>`img1/L${d.id}_${name}.jpg`;

/* ---------- pinyin helpers ---------- */
const TM={a:"āáǎà",e:"ēéěè",i:"īíǐì",o:"ōóǒò",u:"ūúǔù","ü":"ǖǘǚǜ"};
function mark(s,t){s=s.replace(/v/g,"ü");if(!t)return s;let i=s.search(/[ae]/);if(i<0){i=s.indexOf("ou");if(i<0){for(let k=s.length-1;k>=0;k--)if("iouü".includes(s[k])){i=k;break}}}
  if(i<0)return s;return s.slice(0,i)+TM[s[i]][t-1]+s.slice(i+1)}
function toneOf(s){for(const c of s){for(const v in TM){const k=TM[v].indexOf(c);if(k>=0)return k+1}}return 0}
function plainPy(s){return s.replace(/[ǖǘǚǜ]/g,"ü").normalize("NFD").replace(/[̀́̄̌]/g,"").normalize("NFC")}
// "uo3" / "uǒ" / "UO3" -> "uǒ"
function normFin(s){s=s.trim().toLowerCase().replace(/v/g,"ü").replace(/\s+/g,"");const m=/^([a-zü]+)([0-5])$/.exec(plainPy(s));if(m&&!toneOf(s))return mark(m[1],+m[2]);return s.normalize("NFC")}

/* ---------- pinyin display switch ---------- */
let showPy=shared.get("py",false);
function applyPy(root=document){const P=window.pinyinPro;
  $$("[data-zh]",root).forEach(el=>{const t=el.dataset.zh;if(showPy&&P&&P.html){try{el.innerHTML=P.html(t,{toneType:"symbol"})}catch(e){el.textContent=t}}else el.textContent=t})}
function setPyBtn(){const b=$("#pyBtn");b.setAttribute("aria-pressed",showPy);b.textContent=showPy?"Ẩn pinyin":"Hiện pinyin";if(!window.pinyinPro)b.title="Không tải được bộ pinyin"}
$("#pyBtn").onclick=()=>{showPy=!showPy;shared.set("py",showPy);setPyBtn();applyPy()};

/* ---------- audio dock ---------- */
const aud=$("#aud");let stopAt=null,activeBtn=null,afterClip=null;
function fmt(s){s=Math.max(0,s|0);return (s/60|0)+":"+String(s%60).padStart(2,"0")}
function playClip(src,label,from=0,to=null,btn=null){
  if(EX.active==="L")return;afterClip=null;document.body.classList.add("hasdock");$("#dock").hidden=false;
  if(activeBtn)activeBtn.classList.remove("on");activeBtn=btn;if(btn)btn.classList.add("on");
  const go=()=>{try{aud.currentTime=from}catch(e){}stopAt=to;aud.play().catch(()=>{})};
  $("#dLab").textContent=label;
  if(!aud.src.endsWith(src)){aud.src=src;aud.addEventListener("loadedmetadata",go,{once:true});aud.load()}else go()}
aud.addEventListener("timeupdate",()=>{if(stopAt!=null&&aud.currentTime>=stopAt){aud.pause();stopAt=null;const f=afterClip;afterClip=null;if(f)f()}
  if(aud.duration)$("#dSeek").value=aud.currentTime/aud.duration*100;$("#dTime").textContent=fmt(aud.currentTime)+" / "+fmt(aud.duration||0)});
aud.addEventListener("play",()=>{$("#dPlay").textContent="❚❚"});
aud.addEventListener("pause",()=>{$("#dPlay").textContent="▶";if(activeBtn){activeBtn.classList.remove("on");activeBtn=null}});
$("#dPlay").onclick=()=>{if(aud.paused){stopAt=null;aud.play().catch(()=>{})}else aud.pause()};
$("#dSeek").oninput=e=>{if(aud.duration){stopAt=null;aud.currentTime=e.target.value/100*aud.duration}};
$("#dClose").onclick=()=>{aud.pause();$("#dock").hidden=true;document.body.classList.remove("hasdock")};
function say(t){try{const u=new SpeechSynthesisUtterance(t);u.lang="zh-CN";u.rate=.85;const v=speechSynthesis.getVoices().find(v=>/zh/i.test(v.lang));if(v)u.voice=v;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
const playBtn=(d,k,label)=>`<button class="play" type="button" data-track="${k}">${label||"Nghe "+pad2(d.id)+"-"+k}</button>`;

/* ---------- routing ---------- */
const app=$("#app");
function fillSel(cur){$("#lessonSel").innerHTML=`<option value="">Tất cả các bài</option>`+L.map(d=>`<option value="${d.id}" ${d.id==cur?"selected":""}>Bài ${d.id} · ${esc(d.title)}</option>`).join("")}
$("#lessonSel").onchange=e=>{e.target.value?openLesson(+e.target.value):home()};
$("#homeBtn").onclick=()=>home();

function home(){
  stopExam();location.hash="";fillSel("");
  const done=L.filter(d=>lessonPct(d.id)===100).length,started=L.filter(d=>lessonPct(d.id)>0).length;
  app.innerHTML=`<section class="wrap hero"><div>
    <h1>HSK 1: học xong bài nào, <span>đóng dấu</span> bài đó.</h1>
    <p>15 bài trong sách bài tập Giáo trình chuẩn HSK 1. Bài 1–2 luyện phát âm pinyin; bài 3–15 có thi nghe, thi đọc tính giờ như đề HSK, chép chính tả, ngữ âm, chữ Hán và trò chơi ôn từ mới.</p>
    <div class="stats"><span class="chip">✔ Đã xong ${done}/15 bài</span><span class="chip">✎ Đang làm ${started-done}</span><span class="chip">🎧 36 file nghe gốc</span></div>
  </div><div class="big" aria-hidden="true">一级</div></section>
  <section class="wrap"><div class="lessons">${L.map(d=>{const p=lessonPct(d.id);return `
    <button class="lcard" type="button" data-id="${d.id}">${p===100?'<span class="done-stamp">优</span>':""}
      <span class="no">${d.id}</span><span class="t">${esc(d.title)}</span><span class="v">${esc(d.vi)}</span>
      <span class="bar"><i style="width:${p}%"></i></span><span class="pct">${p}% hoàn thành</span></button>`}).join("")}
  </div></section>
  <section class="wrap homeask">${askBlock(null)}${qaBlock()}</section>
  <footer class="wrap">Nội dung bài tập, hình ảnh và file nghe từ sách bài tập Giáo trình chuẩn HSK 1. Tiến độ làm bài được lưu vào tài khoản của em, đăng nhập máy nào cũng thấy.</footer>`;
  $$(".lcard").forEach(b=>b.onclick=()=>openLesson(+b.dataset.id));
  wireAsk(null);wireQA();window.scrollTo(0,0);
}

/* ---------- small builders ---------- */
function bhead(tag,title,q,extra=""){return `<div class="bhead"><span class="tag">${tag}</span><div class="grow"><h3>${title}</h3><div class="q">${q}</div></div>${extra}</div>`}
function bfoot(id){return `<div class="bfoot"><button class="btn seal" type="button" data-check="${id}">Chấm điểm</button><button class="btn ghost" type="button" data-reset="${id}">Làm lại</button><span class="score" id="sc-${id}"></span></div>`}
function doneFoot(id,label){return `<div class="bfoot"><button class="btn jade" type="button" data-done="${id}">${label}</button><span class="score" id="sc-${id}"></span></div>`}
function setScore(d,id,s,t){const el=$("#sc-"+id);if(el){el.textContent=`Đúng ${s}/${t}`+(s===t?" · Xuất sắc!":"");el.className=(el.classList.contains("bscore")?"bscore ":"score ")+(s===t?"ok":"bad")}saveScore(d.id,id,s,t)}
function lettersHTML(q,set,ex){return `<div class="letters" data-q="${q}">${set.split("").map(c=>`<button type="button" class="lt" data-v="${c}" ${c===ex?"disabled title='Đáp án ví dụ'":""} aria-pressed="false">${c}</button>`).join("")}</div>`}
function pickLetters(root){$$(".letters",root).forEach(g=>g.addEventListener("click",e=>{const b=e.target.closest(".lt");if(!b||b.disabled)return;$$(".lt",g).forEach(x=>x.setAttribute("aria-pressed",x===b));g.dataset.val=b.dataset.v}))}
function img(src,alt){return `<img src="${src}" alt="${esc(alt)}" loading="lazy">`}
const tfBtns=`<button class="st y" type="button" aria-pressed="false" data-v="1" aria-label="Đúng">✓</button><button class="st n_" type="button" aria-pressed="false" data-v="0" aria-label="Sai">✗</button>`;
function readMin(d){const q=5+5+d.r3.groups.reduce((a,g)=>a+g.items.length,0);return {q,min:Math.max(8,Math.round(17*q/20))}}
// letters used by each word bank of reading part 3
function bankLetters(d){let k=0;return d.r3.groups.map(g=>g.bank.map(()=>LETTERS[k++]))}
function r3ans(d){const a=d.r3.ans;return Array.isArray(a)?a:a.split("")}

/* ---------- lesson page ---------- */
function openLesson(id){
  const d=L.find(x=>x.id===id);if(!d)return home();
  stopExam();location.hash="bai"+id;fillSel(id);
  const std=d.kind==="std";
  const tabs=std?[["nghe","Thi nghe"],["doc","Thi đọc"],["chinhta","Chính tả"],["nguam","Ngữ âm"],["chuhan","Chữ Hán"],["trochoi","Trò chơi"],["hoibai","Hỏi bài"]]
               :[["docthep","Nghe & đọc theo"],["luyenam","Luyện ngữ âm"],["chuhan","Chữ Hán"],["trochoi","Trò chơi"],["hoibai","Hỏi bài"]];
  app.innerHTML=`<div class="wrap">
  <div class="lhead"><div class="num">${d.id}</div><div><div class="py">${esc(d.py)}</div><h1>${zh(d.title)}</h1><div class="vi">${esc(d.vi)}</div></div></div>
  <nav class="tabs" id="tabs">${tabs.map(t=>`<a href="#${t[0]}" data-t="${t[0]}">${t[1]}</a>`).join("")}</nav>
  ${std?stdHTML(d):pinHTML(d)}
  ${hanziHTML(d)}
  <section class="sec" id="trochoi"><h2><span class="zh">游戏</span>Trò chơi ôn từ mới</h2>
    <div class="games"><h3>${d.vocab.length} từ mới của bài ${id}</h3>
      <div class="gtabs" id="gtabs"><button type="button" data-g="flash" aria-pressed="true">Thẻ ghi nhớ</button><button type="button" data-g="memory" aria-pressed="false">Lật thẻ ghép đôi</button><button type="button" data-g="quiz" aria-pressed="false">Thử thách 60 giây</button><button type="button" data-g="listen" aria-pressed="false">Nghe chọn chữ</button></div>
      <div class="gstage" id="gstage"></div></div></section>
  <section class="sec" id="hoibai"><h2><span class="zh">提问</span>Hỏi bài cô giáo</h2>
    <div class="homeask" style="padding-bottom:0">${askBlock(d)}${qaBlock(d)}</div></section>
  </div>`;
  wireLesson(d);applyPy(app);window.scrollTo(0,0);
}

/* standard lessons 3–15 */
function stdHTML(d){
  const n=d.l1.ans.length, boardL=LETTERS.slice(0,n+1), qn=k=>k+1;
  const {q:RQ}=readMin(d), bl=bankLetters(d);
  let rn=3*n; // running question number for reading
  const r1=d.r1.words.map((w,k)=>`<div class="tfc wordtf" data-i="${k}"><div class="ph">${img(im(d,"r1_"+(k+1)),"Hình câu "+(rn+k+1))}</div>
      <div class="row"><span class="n">${rn+k+1}.</span><span class="w"><small>${esc(w[0])}</small><span>${esc(w[1])}</span></span>${tfBtns}</div></div>`).join("");
  const r2s=rn+6;
  let r3n=rn+11;
  const r3=d.r3.groups.map((g,gi)=>`<div class="bank">${g.bank.map((w,j)=>{const c=bl[gi][j],ex=c===g.ex;return `<button type="button" class="wchip ${ex?"ex":""}" data-v="${c}" ${ex?"disabled":""}><i>${c}</i>${zh(w)}</button>`}).join("")}</div>
      <div class="qrows" style="margin-bottom:14px">${g.items.map(t=>{const parts=t.split("（ ）");const k=r3n-rn-11;const num=r3n++;
        return `<div class="qrow" data-i="${k}" data-g="${gi}"><span class="n">${num}.</span><span class="txt sent">${parts.map((p,pi)=>zh(p)+(pi<parts.length-1?(pi===0?`<button type="button" class="blank empty" data-k="${k}">（　　）</button>`:`<span class="blank empty mirror" data-m="${k}">（　　）</span>`):"")).join("")}</span></div>`}).join("")}</div>`).join("");
  return `
  <section class="sec" id="nghe"><h2><span class="zh">听力</span>Phần nghe</h2>
    ${examBar("L",d)}<div class="exbody locked" id="exbL">
    <div class="block" id="b-l1">${bhead("Câu 1–"+n,"Nghe từ, đánh giá đúng sai","Hình có đúng với từ/cụm từ em nghe được không?")}
      <div class="tf">${d.l1.ans.map((_,i)=>`<div class="tfc" data-i="${i}"><div class="ph">${img(im(d,"l1_"+(i+1)),"Hình câu "+(i+1))}</div>
        <div class="row"><span class="n">${i+1}.</span>${tfBtns}</div></div>`).join("")}</div>
      <div class="bscore" id="sc-l1"></div></div>
    <div class="block" id="b-l2">${bhead(`Câu ${n+1}–${2*n}`,"Nghe hội thoại, chọn hình phù hợp","Ví dụ: 你好！— 你好！很高兴认识你。→ "+d.l2.ex)}
      <div class="board">${boardL.split("").map(c=>`<div class="pic ${c===d.l2.ex?"ex":""}"><b>${c}</b>${img(im(d,"l2_"+c),"Hình "+c)}</div>`).join("")}</div>
      <div class="qrows">${d.l2.ans.split("").map((_,k)=>`<div class="qrow" data-i="${k}"><span class="n">${n+k+1}.</span><span class="txt"></span>${lettersHTML(k,boardL,d.l2.ex)}</div>`).join("")}</div>
      <div class="bscore" id="sc-l2"></div></div>
    <div class="block" id="b-l3">${bhead(`Câu ${2*n+1}–${3*n}`,"Nghe câu, trả lời câu hỏi","Mỗi câu nghe một câu nói và một câu hỏi. Chọn A, B hoặc C.")}
      <div class="mc">${d.l3.opts.map((o,k)=>`<div class="mcq" data-i="${k}"><span class="n">${2*n+k+1}.</span><div class="opts">${o.map((t,j)=>`<button type="button" class="opt" data-v="${LETTERS[j]}" aria-pressed="false"><i>${LETTERS[j]}</i>${zh(t)}</button>`).join("")}</div></div>`).join("")}</div>
      <div class="bscore" id="sc-l3"></div></div>
  </div></section>

  <section class="sec" id="doc"><h2><span class="zh">阅读</span>Phần đọc</h2>
    ${examBar("R",d)}<div class="exbody locked hideR" id="exbR">
    <div class="block" id="b-r1">${bhead(`Câu ${rn+1}–${rn+5}`,"Nhìn hình, từ có đúng với hình không?","Đọc từ dưới mỗi hình rồi chọn ✓ hoặc ✗.")}
      <div class="tf">${r1}</div><div class="bscore" id="sc-r1"></div></div>
    <div class="block" id="b-r2">${bhead(`Câu ${r2s}–${r2s+4}`,"Đọc câu hỏi, chọn câu trả lời đúng","Mỗi câu hỏi cần một câu trả lời từ A–F. Ví dụ: 你喝水吗？→ "+d.r2.ex)}
      <div class="palette">${d.r2.opts.map((t,j)=>`<div class="pal ${LETTERS[j]===d.r2.ex?"ex":""}"><b>${LETTERS[j]}</b><span>${zh(t)}</span></div>`).join("")}</div>
      <div class="chat">${d.r2.qs.map((t,k)=>`<div class="msg" data-i="${k}"><div class="bub"><span class="n">${r2s+k}</span>${zh(t)}</div>
        <div class="reply"><div class="bub empty">Chọn câu trả lời…</div>${lettersHTML(k,"ABCDEF",d.r2.ex)}</div></div>`).join("")}</div>
      <div class="bscore" id="sc-r2"></div></div>
    <div class="block" id="b-r3">${bhead(`Câu ${rn+11}–${rn+10+r3ans(d).length}`,"Chọn từ thích hợp điền vào chỗ trống","Bấm vào chỗ trống rồi bấm vào từ. Mỗi nhóm câu dùng khung từ ngay phía trên. Ví dụ: 你叫什么（名字）？")}
      ${r3}<div class="bscore" id="sc-r3"></div></div>
  </div></section>

  <section class="sec" id="chinhta"><h2><span class="zh">听写</span>Nghe chép chính tả</h2>
    <div class="block">${bhead(d.tx.length+" câu","Nghe từng câu rồi chép lại","Bấm ▶ để nghe (nghe bao nhiêu lần cũng được), chép lại bằng chữ Hán rồi bấm “Kiểm tra”.")}
      <div id="spk"></div></div></section>

  <section class="sec" id="nguam"><h2><span class="zh">语音</span>Phần ngữ âm</h2>
    <div class="block" id="b-ph1">${bhead("Phần 1",ph1Title(d),"File nghe "+pad2(d.id)+"-2. Nghe nhiều lần nếu cần.",playBtn(d,2))}
      ${ph1HTML(d)}${bfoot("ph1")}</div>
    <div class="block" id="b-ph2">${bhead("Phần 2",ph2Title(d),d.ph2.kind==="read"?"Nghe file "+pad2(d.id)+"-2 và đọc theo, chú ý cách đọc các âm tiết thanh nhẹ.":"Nghe tiếp phần 2 của file "+pad2(d.id)+"-2.",playBtn(d,2))}
      ${ph2HTML(d)}${d.ph2.kind==="read"?doneFoot("ph2","Em đã nghe và đọc theo xong")+recPanel(d,"đoạn văn ở trên"):bfoot("ph2")}</div>
  </section>`;
}
function ph1Title(d){return d.ph1.kind==="abc"?esc(d.ph1.prompt):"Nghe, chọn âm tiết hoặc từ em nghe được"}
function ph1HTML(d){
  if(d.ph1.kind==="abc")return abcHTML(d.ph1,"p1");
  return `<div class="pairs" id="p1">${d.ph1.pairs.map((p,k)=>`<div class="pair" data-i="${k}"><span class="n">${k+1}.</span>${p.map((w,j)=>`<button type="button" data-v="${j}" aria-pressed="false">${esc(w)}</button>`).join("")}</div>`).join("")}</div>`}
function abcHTML(o,idp,start=1){return `<div class="abc" id="${idp}">${o.groups.map((g,k)=>`<div class="abcq" data-i="${k}"><span class="n">${k+start}.</span><div class="opts">${g.map((t,j)=>`<button type="button" class="opt" data-v="${LETTERS[j]}" aria-pressed="false"><i>${LETTERS[j]}</i>${esc(t)}</button>`).join("")}</div></div>`).join("")}</div>`}
function ph2Title(d){const p=d.ph2;return p.ch?`Nghe, đánh dấu thanh điệu cho chữ “${p.ch}”`:p.kind==="abc"?esc(p.prompt):p.kind==="tone"?"Nghe, đánh dấu thanh điệu cho các từ":p.kind==="under"?"Nghe, tìm từ ba âm tiết trong câu":"Nghe và đọc theo"}
function ph2HTML(d){const p=d.ph2,s=d.ph1.kind==="abc"?d.ph1.groups.length+1:d.ph1.pairs.length+1;
  if(p.ch)return `<div class="buyi" id="p2">${p.items.map((w,k)=>{const rest=w.split(" ").slice(1).join(" ");const o=p.ch==="不"?["bú","bù"]:["yí","yì"];
    return `<div class="by" data-i="${k}"><span class="n">${k+s}.</span>${o.map(x=>`<button type="button" data-v="${x}" aria-pressed="false">${x}</button>`).join("")}<span class="rest">${esc(rest)}</span></div>`}).join("")}</div>`;
  if(p.kind==="abc")return abcHTML(p,"p2",s);
  if(p.kind==="tone")return `<p class="note">Bấm số thanh dưới mỗi âm tiết: ¹ ngang · ² sắc · ³ hỏi · ⁴ nặng · • thanh nhẹ.</p>`+toneHTML(p.syl.map(sy=>sy.map(x=>x[0])),"p2",s,2);
  if(p.kind==="under")return `<p class="note">${esc(p.prompt)} Bấm vào từng âm tiết để gạch chân (bấm lại để bỏ).</p><div class="under" id="p2">${p.items.map((it,k)=>`<div class="uq" data-i="${k}"><div class="chips"><span class="n">${k+s}.</span>${toks(it[0]).map((t,j)=>`<button type="button" class="sy" data-j="${j}" aria-pressed="false">${esc(t)}</button>`).join("")}</div></div>`).join("")}</div>`;
  if(p.kind==="read")return `<div class="readtext"><h4>${esc(p.title)}</h4>${p.lines.map(l=>`<div><div class="py">${esc(l[0])}</div>${zh(l[1])}</div>`).join("")}</div>`;
  return ""}
const toks=s=>s.split(/\s+/).map(t=>t.replace(/[.,?!，。？！]/g,"")).filter(Boolean);
function toneHTML(words,idp,start,per){return `<div class="tonew" id="${idp}">${words.map((sy,k)=>`<div class="tw" data-i="${k}"><span class="n">${k+start}.</span>${sy.map((s,j)=>`<div class="syl" data-j="${j}" data-s="${esc(s)}"><span class="s">${esc(s)}</span><div class="tb">${[1,2,3,4,0].map(t=>`<button type="button" data-t="${t}" aria-pressed="false" aria-label="Thanh ${t||"nhẹ"}">${t||"•"}</button>`).join("")}</div></div>`).join("")}</div>`).join("")}</div>`}

/* pinyin lessons 1–2 */
function pinHTML(d){
  const pw=d.picword,dl=d.dlg;
  return `
  <section class="sec" id="docthep"><h2><span class="zh">跟读</span>Nghe và đọc theo</h2>
    <div class="block">${bhead("Bài 1","Nghe và đọc theo bảng âm tiết","Mỗi âm tiết đọc với 4 thanh. Nghe file rồi đọc to theo.",playBtn(d,1))}
      <table class="tgrid"><tbody>${d.read1.rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="block">${bhead("Bài 2","Nghe và đọc theo các từ hai âm tiết","Chú ý thanh điệu của từng âm tiết.",playBtn(d,2))}
      <div class="readlist">${d.read2.words.map(w=>`<span>${esc(w)}</span>`).join("")}</div>
      ${doneFoot("read","Em đã nghe và đọc theo xong")}${recPanel(d,"bảng âm tiết và các từ ở bài 1, bài 2")}</div>
  </section>
  <section class="sec" id="luyenam"><h2><span class="zh">语音</span>Luyện ngữ âm</h2>
    <div class="block" id="b-pw">${bhead("Bài 3","Nhìn hình, chọn từ đúng","Các từ mượn tiếng nước ngoài. Chọn chữ cái của từ đúng cho từng hình.")}
      <div class="palette">${pw.opts.map((t,j)=>`<div class="pal"><b>${LETTERS[j]}</b><span>${esc(t)}</span></div>`).join("")}</div>
      <div class="board">${pw.opts.map((_,i)=>`<div class="pic"><span class="pnum">${i+1}</span>${img(im(d,"pw_"+LETTERS[i]),"Hình "+(i+1))}</div>`).join("")}</div>
      <div class="qrows">${pw.opts.map((_,i)=>`<div class="qrow" data-i="${i}"><span class="n">${i+1}.</span><span class="txt">Hình ${i+1}</span>${lettersHTML(i,LETTERS.slice(0,pw.opts.length),"")}</div>`).join("")}</div>
      ${bfoot("pw")}</div>
    <div class="block" id="b-ini">${bhead("Bài 4","Nghe, điền thanh mẫu","Gõ phụ âm đầu (thanh mẫu) em nghe được, vd: b, zh, x.",playBtn(d,3))}
      <div class="fills">${d.ini.items.map((f,k)=>`<div class="fl" data-i="${k}"><span class="n">${k+1}.</span><input aria-label="Thanh mẫu câu ${k+1}" autocomplete="off" autocapitalize="off" spellcheck="false"><span class="fx">${esc(f)}</span></div>`).join("")}</div>
      ${bfoot("ini")}</div>
    <div class="block" id="b-fin">${bhead("Bài 5","Nghe, điền vận mẫu và thanh điệu","Gõ vận mẫu, thêm số 1–4 cho thanh điệu. Ví dụ nghe huǒ thì gõ uo3. Chữ ü gõ là v.",playBtn(d,4))}
      <div class="fills">${d.fin.items.map((f,k)=>`<div class="fl" data-i="${k}"><span class="n">${k+1}.</span><span class="fx">${esc(f)}</span><input aria-label="Vận mẫu câu ${k+1}" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:74px"></div>`).join("")}</div>
      ${bfoot("fin")}</div>
    <div class="block" id="b-tone">${bhead("Bài 6","Nghe, đánh dấu thanh điệu","Bấm số thanh dưới mỗi âm tiết: 1 ngang · 2 sắc · 3 hỏi · 4 nặng.",playBtn(d,5))}
      ${toneHTML(d.tone.items.map(x=>[x]),"tn",1,1)}${bfoot("tone")}</div>
    <div class="block" id="b-dlg">${bhead("Bài 7","Nhìn hình, chọn câu hội thoại đúng","Chọn số của đoạn hội thoại hợp với từng hình.")}
      <div class="dlgs">${dl.opts.map((o,j)=>`<div class="dlgo"><b>(${j+1})</b><span>${o.map(l=>`${zh(l[1])} <small class="py">${esc(l[0])}</small>`).join("<br>")}</span></div>`).join("")}</div>
      <div class="board">${dl.crops.map((_,i)=>`<div class="pic"><span class="pnum">${i+1}</span>${img(im(d,"dlg_"+(i+1)),"Hình "+(i+1))}</div>`).join("")}</div>
      <div class="qrows nums">${dl.crops.map((_,i)=>`<div class="qrow" data-i="${i}"><span class="n">${i+1}.</span><span class="txt">Hình ${i+1}</span>${lettersHTML(i,dl.opts.map((_,j)=>String(j+1)).join(""),"")}</div>`).join("")}</div>
      ${bfoot("dlg")}</div>
  </section>`;
}

/* hanzi (all lessons) */
function hanziHTML(d){
  const st=d.strokes||[],rad=d.rad,cmp=d.cmp||[];
  return `<section class="sec" id="chuhan"><h2><span class="zh">汉字</span>Phần chữ Hán</h2>
    ${st.length?`<div class="block">${bhead("Nét chữ","Tập các nét cơ bản","Bấm vào chữ ví dụ để xem cách viết nét đó.")}
      <div class="strokes">${st.map(s=>`<div class="stc"><span class="g">${esc(s[0])}</span><span class="nm">${esc(s[1])}</span><div class="ex">${s[2].map(c=>`<button type="button" data-w="${esc(c)}" aria-label="Xem cách viết ${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`).join("")}</div>
      <div class="writers" style="margin-top:12px"><div class="wcell"><div class="wbox" id="wx"></div><div class="wmsg" id="wmx">Chọn một chữ ví dụ ở trên</div></div></div></div>`:""}
    ${cmp.length?`<div class="block">${bhead("So sánh","Chữ Hán có hình dạng gần giống nhau","Nhìn kỹ chỗ khác nhau giữa từng cặp chữ.")}
      <div class="cmp">${cmp.map(p=>`<div class="cmpp">${p.map((c,i)=>`${i?'<span class="vs">≠</span>':""}<div class="c"><b>${esc(c)}</b><small class="pyc" data-c="${esc(c)}"></small></div>`).join("")}</div>`).join("")}</div></div>`:""}
    ${rad?`<div class="block" id="b-hz">${bhead("Bộ thủ","Xếp chữ Hán theo bộ","Bấm vào một chữ, rồi bấm vào ô bộ thủ đúng.")}
      <div class="tiles" id="pool">${rad.opts.map((c,j)=>`<button type="button" class="tile" data-v="${esc(c)}" aria-label="${LETTERS[j]} ${esc(c)}">${zh(c)}</button>`).join("")}</div>
      <div class="bins">${rad.rad.map((r,k)=>`<button type="button" class="bin" data-b="${k}"><span class="rad"><b>${esc(r)}</b>Chữ có bộ ${esc(r)}</span><span class="tiles"></span></button>`).join("")}</div>
      ${bfoot("hz")}</div>`:""}
    <div class="block">${bhead("Viết chữ","Xem thứ tự nét và viết chữ","Bấm “Xem nét” để xem cách viết, rồi “Tự viết” và viết bằng ngón tay hoặc chuột vào ô.")}
      <div class="writers">${d.write.map((c,k)=>`<div class="wcell"><div class="wbox" id="w${k}"></div><div class="acts"><button type="button" data-anim="${k}">Xem nét</button><button type="button" data-quiz="${k}">Tự viết</button></div><div class="wmsg" id="wm${k}"></div></div>`).join("")}</div>
      ${rad?"":doneFoot("hz","Em đã tập viết xong")}</div>
  </section>`;
}

/* ---------- wiring ---------- */
function wireLesson(d){
  const id=d.id,std=d.kind==="std";
  $$("[data-track]",app).forEach(b=>b.onclick=()=>playClip(track(d,b.dataset.track),`Bài ${id} · ${pad2(id)}-${b.dataset.track}`,0,null,b));
  const secs=$$(".sec",app);
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)$$("#tabs a").forEach(a=>a.classList.toggle("on",a.dataset.t===e.target.id))})},{rootMargin:"-40% 0px -55% 0px"});
  secs.forEach(s=>io.observe(s));
  $$("#tabs a").forEach(a=>a.onclick=e=>{e.preventDefault();document.getElementById(a.dataset.t).scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})});
  // generic pickers
  $$(".tfc",app).forEach(c=>c.addEventListener("click",e=>{const b=e.target.closest(".st");if(!b)return;$$(".st",c).forEach(x=>x.setAttribute("aria-pressed",x===b));c.dataset.val=b.dataset.v;$(".stamp",c)?.remove()}));
  pickLetters(app);
  $$(".mcq,.abcq",app).forEach(q=>q.addEventListener("click",e=>{const b=e.target.closest(".opt");if(!b)return;$$(".opt",q).forEach(x=>{x.setAttribute("aria-pressed",x===b);x.classList.remove("right","wrong")});q.dataset.val=b.dataset.v}));
  $$(".pair",app).forEach(p=>p.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;$$("button",p).forEach(x=>{x.setAttribute("aria-pressed",x===b);x.classList.remove("right","wrong")});p.dataset.val=b.dataset.v}));
  $$(".by",app).forEach(p=>p.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;$$("button",p).forEach(x=>x.setAttribute("aria-pressed",x===b));p.dataset.val=b.dataset.v;p.classList.remove("ok","bad");$(".fixt",p)?.remove()}));
  $$(".syl",app).forEach(s=>s.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;$$("button",s).forEach(x=>x.setAttribute("aria-pressed",x===b));s.dataset.t=b.dataset.t;
    const sp=$(".s",s);sp.textContent=mark(s.dataset.s,+b.dataset.t);sp.classList.add("set");s.closest(".tw").classList.remove("ok","bad")}));
  $$(".uq",app).forEach(q=>q.addEventListener("click",e=>{const b=e.target.closest(".sy");if(!b)return;b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true");q.classList.remove("ok","bad")}));
  $$(".msg",app).forEach(m=>m.addEventListener("click",e=>{const b=e.target.closest(".lt");if(!b||b.disabled)return;const bub=$(".reply .bub",m);bub.classList.remove("empty");bub.dataset.zh=d.r2.opts[LETTERS.indexOf(b.dataset.v)];applyPy(m);m.classList.remove("ok","bad")}));
  $$(".fl input",app).forEach(i=>i.addEventListener("input",()=>{const f=i.closest(".fl");f.classList.remove("ok","bad");$(".fixt",f)?.remove()}));
  // reading part 3 word banks
  const r3=$("#b-r3");let armed=null;
  if(r3){const bl=bankLetters(d).flat(),words=d.r3.groups.flatMap(g=>g.bank);
    const setMirror=(k,html)=>$$(`.mirror[data-m="${k}"]`,r3).forEach(m=>{m.innerHTML=html;m.classList.toggle("empty",!html||html==="（　　）")});
    r3.addEventListener("click",e=>{const b=e.target.closest(".blank:not(.mirror)"),ch=e.target.closest(".wchip");
      if(b){if(b.dataset.val){const v=b.dataset.val;delete b.dataset.val;b.innerHTML="（　　）";b.classList.add("empty");setMirror(b.dataset.k,"（　　）");$$(`.wchip[data-v="${v}"]`,r3).forEach(c=>c.classList.remove("used"))}
        $$(".blank",r3).forEach(x=>x.classList.remove("armed"));b.classList.add("armed");armed=b;b.closest(".qrow").className="qrow";$(".fix",b.closest(".qrow"))?.remove();return}
      if(ch&&!ch.disabled){const row=armed&&armed.closest(".qrow"),gi=row?+row.dataset.g:null,cg=+ch.closest(".bank").nextElementSibling.querySelector(".qrow").dataset.g;
        let tgt=armed&&gi===cg?armed:$$(`.qrow[data-g="${cg}"] .blank.empty:not(.mirror)`,r3)[0];if(!tgt)return;
        if(tgt.dataset.val)$$(`.wchip[data-v="${tgt.dataset.val}"]`,r3).forEach(c=>c.classList.remove("used"));
        tgt.dataset.val=ch.dataset.v;const w=words[bl.indexOf(ch.dataset.v)],sp=w.split("……");tgt.innerHTML=zh(sp[0]);setMirror(tgt.dataset.k,zh(sp.length>1?sp[1]:w));applyPy(r3);tgt.classList.remove("empty","armed");ch.classList.add("used");
        armed=$$(`.qrow[data-g="${cg}"] .blank.empty:not(.mirror)`,r3)[0]||null;if(armed)armed.classList.add("armed")}})}
  // checks
  const tfCheck=(block,ans)=>{let s=0;$$(".tfc",block).forEach((c,i)=>{$(".stamp",c)?.remove();const v=c.dataset.val;const ok=v!=null&&(v==="1")===ans[i];if(ok)s++;
      c.insertAdjacentHTML("beforeend",`<span class="stamp ${ok?"ok":"no"}">${ok?"对":"错"}</span>`)});return [s,ans.length]};
  function letterCheck(block,ans){let s=0;$$(".qrow",block).forEach((r,i)=>{const v=$(".letters",r).dataset.val;const ok=v===ans[i];if(ok)s++;r.className="qrow "+(ok?"ok":"bad");$(".fix",r)?.remove();if(!ok)r.insertAdjacentHTML("beforeend",`<span class="fix">Đáp án: ${ans[i]}</span>`)});return [s,ans.length]}
  const optCheck=(rows,ans)=>{let s=0;rows.forEach((q,i)=>{$$(".opt",q).forEach(o=>{o.classList.remove("right","wrong");if(o.dataset.v===ans[i])o.classList.add("right");else if(o.getAttribute("aria-pressed")==="true")o.classList.add("wrong")});if(q.dataset.val===ans[i])s++});return [s,ans.length]};
  const toneCheck=(box,want)=>{let s=0;$$(".tw",box).forEach((w,i)=>{const sy=$$(".syl",w);const ok=sy.every((x,j)=>x.dataset.t!=null&&+x.dataset.t===want[i][j]);if(ok)s++;
      w.classList.remove("ok","bad");w.classList.add(ok?"ok":"bad");$(".fixt",w)?.remove();if(!ok)w.insertAdjacentHTML("beforeend",`<span class="fixt">Đáp án: ${sy.map((x,j)=>mark(x.dataset.s,want[i][j])).join(" ")}</span>`)});return [s,want.length]};
  const checks={
    l1:()=>tfCheck($("#b-l1"),d.l1.ans),
    l2:()=>letterCheck($("#b-l2"),d.l2.ans.split("")),
    l3:()=>optCheck($$(".mcq",app),d.l3.ans.split("")),
    r1:()=>tfCheck($("#b-r1"),d.r1.ans),
    r2:()=>{let s=0;const A=d.r2.ans.split("");$$(".msg",app).forEach((m,i)=>{const v=$(".letters",m).dataset.val;const ok=v===A[i];if(ok)s++;m.classList.remove("ok","bad");m.classList.add(ok?"ok":"bad");$(".fix",m)?.remove();
      if(!ok)$(".reply",m).insertAdjacentHTML("beforeend",`<span class="fix">Đáp án: ${A[i]}</span>`)});return [s,A.length]},
    r3:()=>{let s=0;const A=r3ans(d),bl=bankLetters(d).flat(),words=d.r3.groups.flatMap(g=>g.bank);$$(".blank:not(.mirror)",r3).forEach((b,i)=>{const ok=!!b.dataset.val&&A[i].includes(b.dataset.val);if(ok)s++;const row=b.closest(".qrow");row.className="qrow "+(ok?"ok":"bad");$(".fix",row)?.remove();
      if(!ok)row.insertAdjacentHTML("beforeend",`<span class="fix">Đáp án: ${A[i].split("").map(c=>c+" "+esc(words[bl.indexOf(c)])).join(" / ")}</span>`)});return [s,A.length]},
    ph1:()=>{if(d.ph1.kind==="abc")return optCheck($$("#p1 .abcq",app),d.ph1.ans.split(""));
      let s=0;$$("#p1 .pair",app).forEach((p,i)=>{const c=d.ph1.ans[i];$$("button",p).forEach(b=>{b.classList.remove("right","wrong");if(+b.dataset.v===c)b.classList.add("right");else if(b.getAttribute("aria-pressed")==="true")b.classList.add("wrong")});if(p.dataset.val!=null&&+p.dataset.val===c)s++});return [s,d.ph1.ans.length]},
    ph2:()=>{const p=d.ph2;
      if(p.ch){let s=0;$$("#p2 .by",app).forEach((x,i)=>{const ok=x.dataset.val===p.ans[i];if(ok)s++;x.classList.remove("ok","bad");x.classList.add(ok?"ok":"bad");$(".fixt",x)?.remove();if(!ok)x.insertAdjacentHTML("beforeend",`<span class="fixt">Đáp án: ${p.ans[i]}</span>`)});return [s,p.ans.length]}
      if(p.kind==="abc")return optCheck($$("#p2 .abcq",app),p.ans.split(""));
      if(p.kind==="tone")return toneCheck($("#p2"),p.syl.map(sy=>sy.map(x=>x[1])));
      if(p.kind==="under"){let s=0;$$("#p2 .uq",app).forEach((q,i)=>{const T=toks(p.items[i][0]).map(t=>t.toLowerCase()),W=p.items[i][2].toLowerCase().split(" ");let at=-1;
        for(let j=0;j+W.length<=T.length;j++)if(W.every((w,k)=>T[j+k]===w)){at=j;break}
        const want=new Set(W.map((_,k)=>at+k));const got=$$(".sy",q).filter(b=>b.getAttribute("aria-pressed")==="true").map(b=>+b.dataset.j);
        const ok=got.length===want.size&&got.every(j=>want.has(j));if(ok)s++;q.classList.remove("ok","bad");q.classList.add(ok?"ok":"bad");$$(".sy",q).forEach(b=>b.classList.toggle("want",want.has(+b.dataset.j)))});return [s,p.items.length]}
      return [1,1]},
    hz:()=>{let s=0;const R=d.rad;$$(".bin",app).forEach((b,k)=>{const want=new Set([...R.ans[k]]);const got=$$(".tile",b).map(t=>t.dataset.v);
      $$(".tile",b).forEach(t=>t.classList.toggle("badt",!want.has(t.dataset.v)));got.forEach(v=>{if(want.has(v))s++});b.classList.remove("ok","bad");b.classList.add(got.length===want.size&&got.every(v=>want.has(v))?"ok":"bad")});return [s,R.opts.length]},
    pw:()=>letterCheck($("#b-pw"),d.picword.ans.split("")),
    ini:()=>{let s=0;$$("#b-ini .fl",app).forEach((f,i)=>{const v=$("input",f).value.trim().toLowerCase();const ok=v===d.ini.ans[i];if(ok)s++;f.classList.remove("ok","bad");f.classList.add(ok?"ok":"bad");$(".fixt",f)?.remove();if(!ok)f.insertAdjacentHTML("beforeend",`<span class="fixt">${esc(d.ini.full[i])}</span>`)});return [s,d.ini.ans.length]},
    fin:()=>{let s=0;$$("#b-fin .fl",app).forEach((f,i)=>{const v=normFin($("input",f).value);const ok=v===d.fin.ans[i].normalize("NFC");if(ok)s++;f.classList.remove("ok","bad");f.classList.add(ok?"ok":"bad");$(".fixt",f)?.remove();if(!ok)f.insertAdjacentHTML("beforeend",`<span class="fixt">${esc(d.fin.full[i])}</span>`)});return [s,d.fin.ans.length]},
    tone:()=>toneCheck($("#tn"),d.tone.ans.map(a=>[toneOf(a)])),
    dlg:()=>letterCheck($("#b-dlg"),d.dlg.ans.map(String))
  };
  EXCHECK=checks;
  $$("[data-check]",app).forEach(b=>b.onclick=()=>{const k=b.dataset.check;const [s,t]=checks[k]();setScore(d,k,s,t)});
  $$("[data-reset]",app).forEach(b=>b.onclick=()=>{openLesson(id);setTimeout(()=>document.getElementById("sc-"+b.dataset.reset)?.closest(".block")?.scrollIntoView({block:"start"}),0)});
  $$("[data-done]",app).forEach(b=>b.onclick=()=>{const k=b.dataset.done;saveScore(id,k,1,1);$("#sc-"+k).textContent="Đã ghi nhận. Giỏi lắm!";$("#sc-"+k).className="score ok"});
  if(std){$("#goL").onclick=()=>startExam("L",d);$("#goR").onclick=()=>startExam("R",d);renderSpeak(d)}
  wireRec(d);
  // radical sort
  let held=null;const pool=$("#pool");
  $("#b-hz")?.addEventListener("click",e=>{const t=e.target.closest(".tile"),bin=e.target.closest(".bin");
    if(t){e.stopPropagation();if(t.closest(".bin")){pool.appendChild(t);t.classList.remove("armed","badt");held=null;return}$$(".tile").forEach(x=>x.classList.remove("armed"));held=t;t.classList.add("armed");return}
    if(bin&&held){$(".tiles",bin).appendChild(held);held.classList.remove("armed");held=null;bin.classList.remove("ok","bad")}});
  // pinyin under similar characters
  $$(".pyc",app).forEach(s=>{try{s.textContent=window.pinyinPro?pinyinPro.pinyin(s.dataset.c):""}catch(e){}});
  // writers
  const ink=()=>getComputedStyle(document.documentElement).getPropertyValue("--ink").trim()||"#18222B",seal=()=>getComputedStyle(document.documentElement).getPropertyValue("--seal").trim();
  const loader=(c,ok,fail)=>{const x=(window.STROKES||{})[c];x?ok(x):fail()};
  const writers={};
  function getW(k){if(writers[k])return writers[k];if(!window.HanziWriter)return null;
    writers[k]=HanziWriter.create("w"+k,d.write[k],{width:150,height:150,padding:8,showOutline:true,strokeColor:ink(),radicalColor:seal(),charDataLoader:loader});return writers[k]}
  d.write.forEach((c,k)=>{const w=getW(k);if(!w)$("#w"+k).innerHTML=`<span class="zh" style="font-size:96px;line-height:150px;display:block;text-align:center;height:100%">${esc(c)}</span>`});
  $$("[data-anim]",app).forEach(b=>b.onclick=()=>{const k=+b.dataset.anim;const w=getW(k);if(w){$("#wm"+k).textContent="Chú ý thứ tự nét…";w.animateCharacter({onComplete:()=>$("#wm"+k).textContent=""})}});
  $$("[data-quiz]",app).forEach(b=>b.onclick=()=>{const k=+b.dataset.quiz;const w=getW(k);if(!w)return;$("#wm"+k).textContent="Viết từng nét vào ô";
    w.quiz({onMistake:s=>$("#wm"+k).textContent=`Nét ${s.strokeNum+1} chưa đúng, thử lại`,onComplete:s=>$("#wm"+k).textContent=`Xong! Sai ${s.totalMistakes} lần`})});
  let wx=null;
  $$("[data-w]",app).forEach(b=>b.onclick=()=>{if(!window.HanziWriter)return;const c=b.dataset.w;$("#wx").innerHTML="";wx=HanziWriter.create("wx",c,{width:150,height:150,padding:8,showOutline:true,strokeColor:ink(),radicalColor:seal(),charDataLoader:loader,delayBetweenStrokes:450});
    $("#wmx").textContent="Cách viết chữ "+c;wx.animateCharacter()});
  initGames(d);wireAsk(d);wireQA(d);
}

/* ---------- timed exam (HSK style) ---------- */
const EX={active:null,timer:null,left:0,phase:""};const CHECK_SEC=60;
function examBar(k,d){const isL=k==="L",n=d.l1.ans.length,{q,min}=readMin(d);
  return `<div class="exam" id="ex${k}"><div class="exi"><div class="grow"><h3>${isL?`Bài thi nghe · câu 1–${3*n}`:`Bài thi đọc · ${q} câu · ${min} phút`}</h3>
    <p class="q">${isL?"Giống phòng thi HSK: file nghe phát liền một lượt từ đầu đến cuối, không dừng, không tua. Mỗi câu được đọc hai lần, em làm bài trong lúc nghe. Hết file em có thêm 1 phút để kiểm tra, sau đó bài tự nộp."
      :`HSK 1 cho 17 phút làm 20 câu đọc, bài này có ${q} câu nên em có ${min} phút. Đề chỉ hiện khi em bấm Bắt đầu. Hết giờ bài tự nộp.`}</p></div>
    <button class="btn seal" type="button" id="go${k}">Bắt đầu</button></div>
    <div class="exprog"><i id="pg${k}"></i></div><div class="exstat" id="st${k}"></div></div>`}
function mmss(t){t=Math.max(0,Math.ceil(t));return (t/60|0)+":"+String(t%60).padStart(2,"0")}
function pill(txt,warn){let p=$("#xpill");if(!p){p=document.createElement("button");p.id="xpill";p.type="button";p.className="pill";document.body.appendChild(p);p.onclick=()=>document.getElementById(EX.active==="L"?"nghe":"doc")?.scrollIntoView()}
  p.hidden=!txt;p.textContent=txt||"";p.classList.toggle("warn",!!warn)}
function stopExam(){clearInterval(EX.timer);EX.timer=null;if(EX.active==="L"){aud.onended=null;aud.onpause=null;aud.pause()}EX.active=null;pill("")}
function startExam(k,d){
  const st=$("#st"+k);
  if(EX.active){st.innerHTML=`<span>Em đang làm bài thi ${EX.active==="L"?"nghe":"đọc"}. Nộp bài đó trước rồi mới bắt đầu bài này.</span>`;return}
  EX.active=k;$("#go"+k).hidden=true;const body=$("#exb"+k);body.classList.remove("locked","hideR");
  st.innerHTML=`<span id="tm${k}"></span><button class="btn" type="button" id="sub${k}">Nộp bài</button>`;
  $("#sub"+k).onclick=()=>{const b=$("#sub"+k);if(b.dataset.sure){submitExam(k,d)}else{b.dataset.sure=1;b.textContent="Bấm lần nữa để nộp"}};
  if(k==="R"){EX.left=readMin(d).min*60;const T=EX.left;
    const tick=()=>{EX.left--;$("#tmR").innerHTML=`<span class="big">${mmss(EX.left)}</span> còn lại`;$("#pgR").style.width=(1-EX.left/T)*100+"%";pill("⏱ "+mmss(EX.left),EX.left<=120);if(EX.left<=0)submitExam("R",d)};
    EX.left++;tick();EX.timer=setInterval(tick,1000);applyPy(body);return}
  $("#dock").hidden=true;document.body.classList.remove("hasdock");stopAt=null;afterClip=null;EX.phase="audio";aud.onended=null;
  const src=track(d,1);
  const show=()=>{const dur=aud.duration||0;$("#tmL").innerHTML=`<span class="big">${mmss(aud.currentTime)}</span> / ${mmss(dur)} · đang phát`;$("#pgL").style.width=(dur?aud.currentTime/dur*100:0)+"%";pill("🎧 "+mmss(dur-aud.currentTime))};
  const begin=()=>{aud.currentTime=0;aud.play().then(()=>{EX.timer=setInterval(show,500)}).catch(()=>{$("#tmL").textContent="Trình duyệt chưa phát được file nghe. Bấm Bắt đầu lại.";EX.active=null;$("#goL").hidden=false})};
  aud.onpause=()=>{if(EX.active==="L"&&EX.phase==="audio"&&!aud.ended)aud.play().catch(()=>{})};
  aud.onended=()=>{clearInterval(EX.timer);EX.phase="check";EX.left=CHECK_SEC;$("#pgL").style.width="100%";
    const t=()=>{$("#tmL").innerHTML=`Hết file nghe · <span class="big">${mmss(EX.left)}</span> để kiểm tra`;pill("✎ "+mmss(EX.left),true);if(EX.left--<=0)submitExam("L",d)};t();EX.timer=setInterval(t,1000)};
  if(aud.src.endsWith(src)&&aud.readyState>0)begin();else{aud.src=src;aud.addEventListener("loadedmetadata",begin,{once:true});aud.load()}
  $("#tmL").textContent="Đang tải file nghe…";
}
function submitExam(k,d){
  const keys=k==="L"?["l1","l2","l3"]:["r1","r2","r3"];stopExam();
  let S=0,T=0;keys.forEach(b=>{const r=EXCHECK[b]();S+=r[0];T+=r[1];setScore(d,b,r[0],r[1])});
  $("#exb"+k).classList.add("done");$("#pg"+k).style.width="100%";
  $("#st"+k).innerHTML=`<span class="big">${S}/${T}</span><span>${S===T?"Xuất sắc! Đúng hết.":S>=T*0.8?"Rất tốt!":S>=T*0.6?"Đạt, cố thêm chút nữa nhé.":"Em xem lại các câu sai bên dưới nhé."}</span><button class="btn" type="button" id="re${k}">Làm lại</button>`;
  $("#re"+k).onclick=()=>{openLesson(d.id);setTimeout(()=>document.getElementById(k==="L"?"nghe":"doc").scrollIntoView(),0)};
  store.set("exam:"+d.id+k,{s:S,t:T,at:Date.now()});
  if(k==="L")renderSpeak(d);
}
let EXCHECK={};

/* ---------- read-aloud recording ---------- */
function recPanel(d,what){
  return `<div class="recp" id="recp"><h3>Gửi bài đọc theo cho cô chấm</h3>
    <ol class="steps"><li>Nghe file mẫu ở trên và luyện đọc theo ${esc(what)}.</li>
      <li>Bấm <b>🎙 Ghi âm</b> và đọc to. Trên điện thoại nút này mở ứng dụng ghi âm; trên máy tính em chọn file ghi âm đã có. Nghe lại, chưa ưng thì ghi lại.</li>
      <li>Bấm <b>Gửi cho cô</b>. Cô chấm xong, điểm và nhận xét hiện ngay bên dưới.</li></ol>
    <div class="recrow"><label class="btn seal recbtn">🎙 Ghi âm<input type="file" accept="audio/*" capture="user" id="recIn"></label>
      <audio id="recAud" controls hidden></audio><button class="btn jade" type="button" id="recSend" hidden>Gửi cho cô</button></div>
    <div class="note" id="recName"></div><div class="recs" id="recList"></div></div>`}
const mineBook=r=>(r.book||"hsk2")===BOOK;
function renderRecs(d){const box=$("#recList");if(!box)return;const mine=(ME.records||[]).filter(r=>mineBook(r)&&+r.lesson===d.id);
  box.innerHTML=mine.map(r=>`<div class="ri">Đã gửi ${fmtTime(r.time)} · ${r.score!==""&&r.score!=null?`<b>Điểm: ${esc(r.score)}</b>${r.comment?" · "+esc(r.comment):""}`:"Cô chưa chấm"}</div>`).join("")}
function wireRec(d){const inp=$("#recIn");if(!inp)return;renderRecs(d);let url=null,file=null;
  inp.onchange=()=>{const f=inp.files&&inp.files[0];if(!f)return;file=f;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(f);
    const a=$("#recAud");a.src=url;a.hidden=false;$("#recSend").hidden=false;$("#recSend").disabled=false;$("#recSend").textContent="Gửi cho cô";
    $("#recName").textContent=`Đã ghi: ${f.name} (${(f.size/1048576).toFixed(1)} MB). Nghe lại rồi bấm Gửi cho cô.`;$(".recbtn").firstChild.textContent="🎙 Ghi lại"};
  $("#recSend").onclick=async()=>{if(!file)return;const b=$("#recSend");if(file.size>20*1048576){$("#recName").textContent="File lớn quá 20 MB, em ghi ngắn lại nhé.";return}
    b.disabled=true;b.textContent="Đang gửi…";
    try{const data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(",")[1]);r.onerror=no;r.readAsDataURL(file)});
      const j=await api("record",{book:BOOK,lesson:d.id,fname:file.name,mime:file.type,data});
      if(!j.ok)throw new Error(j.error);b.textContent="Đã gửi ✓";$("#recName").textContent="Cô đã nhận được bài ghi âm của em.";
      (ME.records=ME.records||[]).push({id:j.id,time:new Date().toISOString(),book:BOOK,lesson:d.id,score:"",comment:""});renderRecs(d)}
    catch(e){b.disabled=false;b.textContent="Gửi lại";$("#recName").textContent="Chưa gửi được: "+(e.message||"lỗi mạng")+". Em thử lại nhé."}};
}

/* ---------- dictation ---------- */
const normHan=t=>t.replace(/[^㐀-鿿0-9]/g,"");
function lcsDiff(a,b){const n=a.length,m=b.length,D=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)D[i][j]=a[i]===b[j]?D[i+1][j+1]+1:Math.max(D[i+1][j],D[i][j+1]);
  const out=[];let i=0,j=0;while(i<n&&j<m){if(a[i]===b[j]){out.push(["k",b[j]]);i++;j++}else if(D[i+1][j]>=D[i][j+1]){out.push(["m",a[i]]);i++}else{out.push(["x",b[j]]);j++}}
  while(i<n)out.push(["m",a[i++]]);while(j<m)out.push(["x",b[j++]]);return {ops:out,hit:D[0][0],total:n}}
function renderSpeak(d){const box=$("#spk");if(!box)return;
  const open=!!store.get("exam:"+d.id+"L",null)||!!(progress[d.id]&&progress[d.id].l1);
  if(!open){box.innerHTML=`<div class="lockmsg">Phần này mở sau khi em nộp bài thi nghe ở trên, để em không nghe trước đề thi.</div>`;return}
  const n=d.l1.ans.length,parts=["Phần 1 · từ","Phần 2 · hội thoại","Phần 3 · câu"],who={男:"Nam",女:"Nữ",问:"Câu hỏi"};
  const lines=d.tx.map(it=>it.map(l=>{const m=/^(男|女|问)：(.*)$/.exec(l);return m?{w:m[1],t:m[2]}:{w:"",t:l}}));
  box.innerHTML=`<div class="spk">${lines.map((ls,i)=>`<div class="spc" data-i="${i}"><div class="hd"><b>${i+1}</b>${parts[Math.floor(i/n)]}<span class="pct"></span></div>
    ${ls.map((l,j)=>`<div class="dl"><label for="dt-${i}-${j}" class="${l.w==="问"?"q":""}">${l.w?who[l.w]:"Câu nghe được"}</label>
      <input id="dt-${i}-${j}" autocomplete="off" autocapitalize="off" spellcheck="false" lang="zh" placeholder="Gõ chữ Hán…"><div class="diff" hidden></div></div>`).join("")}
    <div class="acts"><button type="button" class="play" data-o="${i}">Nghe</button><button type="button" class="chk" data-dk="${i}">Kiểm tra</button><button type="button" data-a="${i}">Xem đáp án</button></div>
    <div class="ans" hidden></div></div>`).join("")}</div>
    <div class="legend"><span><b style="color:var(--jade)">字</b> đúng</span><span><b class="diff"><span class="m" style="padding:0 3px">字</span></b> em còn thiếu</span><span><b class="diff"><span class="x" style="padding:0 3px">字</span></b> chép thừa hoặc sai</span></div>`;
  const S=d.seg;
  $$("[data-o]",box).forEach(b=>b.onclick=()=>{const i=+b.dataset.o;playClip(track(d,1),`Bài ${d.id} · Câu ${i+1}`,S[i][0],S[i][1],b)});
  const check=i=>{const card=$(`.spc[data-i="${i}"]`,box);let hit=0,tot=0;
    lines[i].forEach((l,j)=>{const inp=$("#dt-"+i+"-"+j),out=inp.nextElementSibling;const r=lcsDiff([...normHan(l.t)],[...normHan(inp.value)]);
      out.innerHTML=r.ops.map(([t,c])=>`<span class="${t}">${esc(c)}</span>`).join("");out.hidden=false;hit+=r.hit;tot+=r.total});
    const pc=tot?Math.round(hit/tot*100):0;$(".pct",card).textContent=pc+"%";card.classList.remove("ok","bad");card.classList.add(pc===100?"ok":"bad");return pc};
  $$("[data-dk]",box).forEach(b=>b.onclick=()=>{check(+b.dataset.dk);const all=$$(".spc .pct",box).map(x=>parseInt(x.textContent)).filter(x=>!isNaN(x));
    if(all.length===lines.length)saveScore(d.id,"dict",Math.round(all.reduce((a,c)=>a+c,0)/lines.length),100)});
  $$("[data-a]",box).forEach(b=>b.onclick=()=>{const i=+b.dataset.a,a=$(`.spc[data-i="${i}"] .ans`,box);
    a.innerHTML=lines[i].map(l=>`${l.w?`<b>${who[l.w]}:</b> `:""}${zh(l.t)}`).join("<br>");a.hidden=!a.hidden;applyPy(a);b.textContent=a.hidden?"Xem đáp án":"Ẩn đáp án"});
}

/* ---------- games ---------- */
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
let gameTimer=null;
function initGames(d){
  const st=$("#gstage"),V=d.vocab;
  const show=g=>{clearInterval(gameTimer);$$("#gtabs button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.g===g));({flash,memory,quiz:()=>quiz(false),listen:()=>quiz(true)})[g]()};
  $$("#gtabs button").forEach(b=>b.onclick=()=>show(b.dataset.g));
  function flash(){let i=0;const draw=()=>{const w=V[i];st.innerHTML=`<div class="flash">
      <button class="card3d" type="button" id="fc" aria-label="Lật thẻ"><div class="inner"><div class="face"><span class="hz">${esc(w[0])}</span><span class="note">Chạm để lật</span></div>
      <div class="face back"><span class="py">${esc(w[1])}</span><span class="vn">${esc(w[2])}</span></div></div></button>
      <div class="frow"><button class="btn ghost" type="button" id="fp">← Trước</button><span class="hud">${i+1} / ${V.length}</span><button class="btn ghost" type="button" id="fs">🔊 Đọc</button><button class="btn" type="button" id="fn">Tiếp →</button></div></div>`;
      $("#fc").onclick=()=>$("#fc").classList.toggle("flip");$("#fp").onclick=()=>{i=(i-1+V.length)%V.length;draw()};$("#fn").onclick=()=>{i=(i+1)%V.length;draw()};$("#fs").onclick=()=>say(w[0])};draw()}
  function memory(){const pick=shuffle(V).slice(0,6);let cards=shuffle(pick.flatMap((w,k)=>[{k,t:w[0],z:1},{k,t:w[2],z:0}]));let open=[],found=0,moves=0,lock=false;
    const draw=()=>{st.innerHTML=`<div class="frow" style="justify-content:space-between;margin-bottom:10px"><span class="hud">Lượt: ${moves} · Cặp: ${found}/6</span><button class="btn ghost" type="button" id="mr">Chơi lại</button></div>
      <div class="memory">${cards.map((c,i)=>`<button type="button" class="mcard ${c.gone?"gone":c.up?"up":"back"} ${c.z&&(c.up||c.gone)?"zhc":""}" data-i="${i}">${c.up||c.gone?esc(c.t):"学"}</button>`).join("")}</div>
      ${found===6?`<p class="toast" style="text-align:center;margin-top:12px">Hoàn thành sau ${moves} lượt!</p>`:""}`;
      $("#mr").onclick=memory;$$(".mcard",st).forEach(b=>b.onclick=()=>{const c=cards[+b.dataset.i];if(lock||c.up||c.gone)return;c.up=true;open.push(c);if(c.z)say(c.t);
        if(open.length===2){moves++;lock=true;const [a,b2]=open;setTimeout(()=>{if(a.k===b2.k&&a.z!==b2.z){a.gone=b2.gone=true;found++}a.up=b2.up=false;open=[];lock=false;draw()},700)}draw()})};draw()}
  function quiz(listen){let score=0,streak=0,left=60,cur;const pool=V;
    const next=()=>{cur=pool[Math.random()*pool.length|0];const wrong=shuffle(pool.filter(w=>w!==cur)).slice(0,3);const opts=shuffle([cur,...wrong]);
      st.innerHTML=`<div class="quiz"><div class="hud"><span>⏱ ${left}s</span><span>Điểm ${score}</span><span>Chuỗi ${streak}🔥</span></div><div class="timer"><i style="width:${left/60*100}%"></i></div>
        ${listen?`<button class="btn jade" type="button" id="qs">🔊 Nghe lại</button><p class="note">Nghe và chọn chữ Hán đúng</p>`:`<div class="bigq">${esc(cur[0])}</div><p class="note">Chọn nghĩa đúng</p>`}
        <div class="ans">${opts.map(o=>`<button type="button" data-h="${esc(o[0])}">${listen?`<span class="zh" style="font-size:24px">${esc(o[0])}</span>`:esc(o[2])}</button>`).join("")}</div></div>`;
      if(listen){say(cur[0]);$("#qs").onclick=()=>say(cur[0])}
      $$(".ans button",st).forEach(b=>b.onclick=()=>{const ok=b.dataset.h===cur[0];b.classList.add(ok?"right":"wrong");if(!ok)$(`.ans button[data-h="${CSS.escape(cur[0])}"]`,st).classList.add("right");
        if(ok){score+=10+streak*2;streak++}else streak=0;$$(".ans button",st).forEach(x=>x.disabled=true);setTimeout(()=>left>0&&next(),ok?450:1100)})};
    const key="best:"+d.id+(listen?"L":"Q");const best=()=>{const b=store.get(key,0);return b?`<p class="note">Kỷ lục của em: ${b} điểm</p>`:""};
    const start=()=>{st.innerHTML=`<div class="quiz"><div class="bigq">${listen?"听":"快"}</div><p>${listen?"Nghe đọc từ và chọn chữ Hán đúng. Máy cần có giọng đọc tiếng Trung.":"60 giây, chọn nghĩa tiếng Việt đúng càng nhiều càng tốt. Trả lời liên tiếp đúng được cộng điểm thưởng."}</p><button class="btn seal" type="button" id="qgo">Bắt đầu</button>${best()}</div>`;
      $("#qgo").onclick=()=>{score=0;streak=0;left=60;next();gameTimer=setInterval(()=>{left--;const t=$(".timer i",st);if(t)t.style.width=left/60*100+"%";const h=$(".hud span",st);if(h)h.textContent="⏱ "+left+"s";if(left<=0){clearInterval(gameTimer);end()}},1000)}};
    const end=()=>{const b=store.get(key,0);if(score>b)store.set(key,score);st.innerHTML=`<div class="quiz"><div class="bigq">${score>b?"赞":"好"}</div><h3>${score} điểm</h3><p>${score>b?"Kỷ lục mới!":"Kỷ lục: "+b+" điểm"}</p><button class="btn seal" type="button" id="qagain">Chơi lại</button></div>`;$("#qagain").onclick=start};
    start()}
  flash();
}

/* ---------- ask teacher ---------- */
function fmtTime(t){try{return new Date(t).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}catch(e){return ""}}
function askBlock(d){
  return `<div class="block ask" id="askBox"><div class="bhead"><span class="tag">Hỏi bài</span><div class="grow"><h3>Gửi câu hỏi cho cô</h3><div class="q">Câu nào chưa hiểu, em ghi rõ bài, phần và số câu nhé. Câu hỏi gửi thẳng tới cô.</div></div></div>
    <div class="two" style="grid-template-columns:1fr 2fr"><label>Bài (HSK 1)<select id="askLesson"><option value="">Chung</option>${L.map(x=>`<option value="${x.id}" ${d&&d.id===x.id?"selected":""}>Bài ${x.id}</option>`).join("")}</select></label>
      <label>Phần / câu số<input id="askPart" placeholder="VD: Đọc, câu 24"></label></div>
    <label>Câu hỏi<textarea id="askMsg" placeholder="Em không hiểu vì sao câu 24 chọn F…"></textarea></label>
    <div class="sendrow"><button class="btn seal" type="button" id="askSend">Gửi cho cô</button><span class="toast" id="askToast"></span></div></div>`}
function qaBlock(){return `<div class="block"><div class="bhead"><span class="tag">Hỏi đáp</span><div class="grow"><h3>Câu hỏi của em</h3><div class="q">Cô trả lời xong, câu trả lời hiện ở đây.</div></div><button class="btn ghost" type="button" id="qaRefresh">Tải lại</button></div><div class="qa" id="qaList"></div></div>`}
function wireAsk(){
  $("#askSend").onclick=async()=>{const m=$("#askMsg").value.trim(),t=$("#askToast");if(!m){t.textContent="Em hãy viết câu hỏi trước nhé.";$("#askMsg").focus();return}
    const b=$("#askSend");b.disabled=true;t.textContent="Đang gửi…";const ls=$("#askLesson").value,part=$("#askPart").value.trim();
    try{const j=await api("ask",{book:BOOK,lesson:ls?+ls:"",part,message:m});if(!j.ok)throw new Error(j.error);
      $("#askMsg").value="";t.textContent="Đã gửi. Cô trả lời sẽ hiện ở mục Hỏi đáp.";
      (ME.questions=ME.questions||[]).push({id:j.id,time:new Date().toISOString(),book:BOOK,lesson:ls,part,message:m,reply:""});renderQA(qaCtx)}
    catch(e){t.textContent="Chưa gửi được: "+(e.message||"lỗi mạng")}finally{b.disabled=false}};
}
const bookName=b=>(b||"hsk2").toUpperCase().replace("HSK","HSK ");
function renderQA(d){const box=$("#qaList");if(!box)return;
  let qs=(ME.questions||[]).slice().reverse();if(d)qs=qs.filter(q=>!q.lesson||(mineBook(q)&&+q.lesson===d.id));
  box.innerHTML=qs.length?qs.map(q=>`<div class="qitem"><div class="meta">${q.lesson?bookName(q.book)+" · Bài "+esc(q.lesson):"Chung"}${q.part?" · "+esc(q.part):""} · ${fmtTime(q.time)}</div>
    <div>${esc(q.message||"")}</div>${q.reply?`<div class="rep"><b>Cô trả lời:</b> ${esc(q.reply)}</div>`:`<div class="meta" style="margin-top:6px">Cô chưa trả lời</div>`}</div>`).join("")
    :`<p class="empty">Em chưa gửi câu hỏi nào${d?" cho bài này":""}.</p>`;
  const r=$("#qaRefresh");if(r)r.onclick=async()=>{r.disabled=true;await refreshMe();r.disabled=false};
}
let qaCtx=null;function wireQA(d){qaCtx=d||null;renderQA(qaCtx)}

/* ---------- account & sync ---------- */
const API_URL=(window.HSK_API||"").trim();
let AUTH=shared.get("auth",null);let ME={questions:[],records:[]};
async function api(action,payload={}){
  if(!API_URL)throw new Error("Trang chưa được nối với máy chủ");
  const r=await fetch(API_URL,{method:"POST",body:JSON.stringify(Object.assign({action,token:AUTH&&AUTH.token},payload))});
  const j=await r.json();if(!j.ok&&/đăng nhập lại/.test(j.error||"")&&action!=="login")logout(j.error);return j}
function applyServerProgress(p){const next={};Object.keys(p||{}).forEach(k=>{const [book,les]=k.split(":");if(book!==BOOK)return;next[+les]={};Object.keys(p[k]).forEach(b=>next[+les][b]=[p[k][b][0],p[k][b][1]])});
  store.get("pending",[]).forEach(x=>{const cur=next[x.lesson]&&next[x.lesson][x.part];if(!cur||x.s/x.t>cur[0]/cur[1])(next[x.lesson]=next[x.lesson]||{})[x.part]=[x.s,x.t]});
  progress=next;store.set("progress",progress)}
async function refreshMe(){if(!AUTH)return;try{const j=await api("me");if(!j.ok)return;ME=j;applyServerProgress(j.progress);
  if(!location.hash||location.hash==="#")home();else{renderQA(qaCtx);const m=/^#bai(\d+)/.exec(location.hash);if(m){const d=L.find(x=>x.id===+m[1]);if(d){renderRecs(d);if(d.kind==="std")renderSpeak(d)}}}}catch(e){}}
let flushing=false;
async function flush(){if(flushing||!AUTH)return;flushing=true;
  try{while(true){const pend=store.get("pending",[]);if(!pend.length)break;const x=pend[0];
    const j=await api("progress",{book:BOOK,lesson:x.lesson,part:x.part,s:x.s,t:x.t});if(!j.ok&&!/không hợp lệ/.test(j.error||""))break;
    const now=store.get("pending",[]);const i=now.findIndex(y=>y.at===x.at&&y.part===x.part&&y.lesson===x.lesson);if(i>=0)now.splice(i,1);store.set("pending",now)}}
  catch(e){}finally{flushing=false}}
const _saveLocal=saveScore;
saveScore=function(id,b,s,t){_saveLocal(id,b,s,t);if(!AUTH)return;const pend=store.get("pending",[]);pend.push({lesson:id,part:b,s,t,at:Date.now()});store.set("pending",pend);flush()};
setInterval(flush,30000);addEventListener("online",flush);
function initials(n){const w=String(n||"?").trim().split(/\s+/);return (w[w.length-1]||"?")[0].toUpperCase()}
function showUser(){const u=AUTH&&AUTH.user;$("#umenu").hidden=!u;if(!u)return;$("#uav").textContent=initials(u.name);$("#uname").textContent=u.name;
  $("#uinfo").innerHTML=`<b>${esc(u.name)}</b>Tên đăng nhập: ${esc(u.u)}${u.cls?" · Lớp "+esc(u.cls):""}`}
$("#ubtn").onclick=e=>{e.stopPropagation();const p=$("#upop");p.hidden=!p.hidden;$("#ubtn").setAttribute("aria-expanded",!p.hidden)};
document.addEventListener("click",e=>{if(!e.target.closest("#umenu"))$("#upop").hidden=true});
$("#uOut").onclick=()=>logout();
$("#uPw").onclick=()=>{$("#upop").hidden=true;const m=document.createElement("div");m.className="modal";m.innerHTML=`<form class="lbox" id="pwForm"><h1>Đổi mật khẩu</h1>
  <label>Mật khẩu hiện tại<input type="password" id="pwOld" autocomplete="current-password" required></label>
  <label>Mật khẩu mới (ít nhất 4 ký tự)<input type="password" id="pwNew" autocomplete="new-password" required minlength="4"></label>
  <div class="err" id="pwErr"></div><button class="btn seal" type="submit">Lưu mật khẩu mới</button><button class="btn ghost" type="button" id="pwX">Hủy</button></form>`;
  document.body.appendChild(m);$("#pwOld").focus();$("#pwX").onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};
  $("#pwForm").onsubmit=async e=>{e.preventDefault();$("#pwErr").textContent="Đang lưu…";try{const j=await api("changePassword",{old:$("#pwOld").value,new:$("#pwNew").value});
    if(!j.ok)throw new Error(j.error);m.querySelector(".lbox").innerHTML=`<h1>Xong!</h1><p class="okmsg">Đã đổi mật khẩu. Lần sau em đăng nhập bằng mật khẩu mới.</p><button class="btn seal" type="button">Đóng</button>`;m.querySelector("button").onclick=()=>m.remove()}
    catch(err){$("#pwErr").textContent=err.message||"Lỗi mạng, thử lại nhé."}}};
function logout(msg){stopExam();AUTH=null;ME={questions:[],records:[]};progress={};
  try{Object.keys(localStorage).forEach(k=>{if(/^hsk[12]:(auth|progress|pending|exam:|best:)/.test(k))localStorage.removeItem(k)})}catch(e){}
  showUser();showLogin(msg)}
function showLogin(msg){location.hash="";$("#lessonSel").hidden=true;
  app.innerHTML=`<section class="wrap login"><form class="lbox" id="lgForm" autocomplete="on"><span class="seal2" aria-hidden="true">汉</span><h1>Đăng nhập Sổ luyện HSK</h1>
    <p class="note" style="margin:0">Tên đăng nhập và mật khẩu do cô giáo cấp cho em. Một tài khoản dùng chung cho HSK 1 và HSK 2.</p>
    <label>Tên đăng nhập<input id="lgU" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required placeholder="vd: nhat_tra"></label>
    <label>Mật khẩu<span class="pwbox"><input id="lgP" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" required><button type="button" class="eye" id="lgEye" aria-label="Hiện mật khẩu">Hiện</button></span></label>
    <div class="err" id="lgErr">${msg?esc(msg):""}</div><button class="btn seal" type="submit" id="lgBtn">Đăng nhập</button>
    ${API_URL?"":`<p class="err">Trang chưa được nối với máy chủ. Cô giáo cần điền địa chỉ máy chủ vào file config.js.</p>`}</form></section>`;
  $("#lgU").focus();
  $("#lgEye").onclick=()=>{const i=$("#lgP"),show=i.type==="password";i.type=show?"text":"password";$("#lgEye").textContent=show?"Ẩn":"Hiện";$("#lgEye").setAttribute("aria-label",show?"Ẩn mật khẩu":"Hiện mật khẩu")};
  $("#lgForm").onsubmit=async e=>{e.preventDefault();const b=$("#lgBtn");b.disabled=true;$("#lgErr").textContent="Đang đăng nhập…";
    const cleanU=$("#lgU").value.replace(/^\s*(tên đăng nhập|ten dang nhap)\s*:?/i,"").replace(/\s+/g,"").toLowerCase(),cleanP=$("#lgP").value.replace(/^\s*(mật khẩu|mat khau)\s*:?/i,"").trim();
    try{const j=await api("login",{u:cleanU,p:cleanP});if(!j.ok)throw new Error(j.error);
      AUTH={token:j.token,user:j.user};shared.set("auth",AUTH);progress={};store.set("progress",{});showUser();$("#lessonSel").hidden=false;home();refreshMe()}
    catch(err){$("#lgErr").textContent=err.message==="Failed to fetch"?"Không kết nối được máy chủ. Em kiểm tra mạng rồi thử lại.":(err.message||"Lỗi, thử lại nhé.");b.disabled=false}}}

/* ---------- boot ---------- */
const setTop=()=>document.documentElement.style.setProperty("--toph",$(".top").offsetHeight+"px");
setTop();addEventListener("resize",setTop);setPyBtn();showUser();
if(!AUTH){showLogin()}else{const m=/^#bai(\d+)/.exec(location.hash||"");m?openLesson(+m[1]):home();refreshMe();flush()}
