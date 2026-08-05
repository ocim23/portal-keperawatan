
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(x='')=>String(x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let CATALOG,GROUPS={},TOPICS={},ICONS={},ASKEP='',CACHE={},currentId=null,current=null,currentTab='learn',quizRun=null,lbZoom=1;
const KEY='ak_portal_state_v4', def={favorites:[],recent:[],lastTopic:null,lastSlides:{}};
const ASSET_VERSION='4.4.0';
let state=load();
function load(){try{return {...def,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...def}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function icon(n){return ICONS[n]||ICONS.shield||''}
function versionedAsset(url){if(!url)return'';const sep=String(url).includes('?')?'&':'?';return `${url}${sep}v=${ASSET_VERSION}`}
function fav(id){return state.favorites.includes(id)}
function toggleFav(id){
  state.favorites=fav(id)?state.favorites.filter(x=>x!==id):[id,...state.favorites];
  save();
  toast(fav(id)?'Ditambahkan ke favorit.':'Dihapus dari favorit.');
  refreshRoute();
}
function recent(id){state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,12);state.lastTopic=id;save()}
async function getJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Gagal memuat '+url);return r.json()}
async function getTopic(id){if(CACHE[id])return CACHE[id];const m=TOPICS[id];if(!m)throw Error('Materi tidak ditemukan');return CACHE[id]=await getJSON(m.file+'?v='+ASSET_VERSION)}
function parse(){return (location.hash||'#/home').replace(/^#\//,'').split('/').filter(Boolean)}

/* ================================================================
   Navigasi dan pemulihan posisi scroll
   - Halaman baru selalu dimulai dari atas.
   - Back/Forward mengembalikan posisi scroll halaman sebelumnya.
   - Tombol "Kembali ke [kelompok]" tidak membuat riwayat duplikat.
   ================================================================ */
let scrollSaveTimer=null;
let handlingPopState=false;
let sessionTopicId=null;
let touchStart=null;
let suppressNextClick=false;
let viewSwitching=false;

function currentRoute(){
  return location.hash||'#/home';
}

function normalizeRoute(value){
  const route=String(value||'#/home');
  return route.startsWith('#/')
    ? route
    : `#/${route.replace(/^#?\/?/,'')}`;
}

function saveScroll(){
  const oldState=history.state||{};
  history.replaceState(
    {
      ...oldState,
      akRoute:currentRoute(),
      akScrollY:Math.max(0,Math.round(window.scrollY||0))
    },
    '',
    location.href
  );
}

function restoreScroll(y=0){
  const top=Math.max(0,Number(y)||0);
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      window.scrollTo({
        top,
        left:0,
        behavior:'auto'
      });
    });
  });
}

function reducedMotion(){
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function jumpWindow(y=0){window.scrollTo({top:Math.max(0,Number(y)||0),left:0,behavior:'auto'})}
function panelStartY(){
  const anchor=$('#akPanelStart');
  if(!anchor)return 0;
  return Math.max(0,Math.round(anchor.getBoundingClientRect().top+window.scrollY-8));
}
function jumpToPanelStart(){jumpWindow(panelStartY())}
async function blinkSwap(update,{scrollY=0,insideTopic=false,initial=false}={}){
  /*
    Tangkap titik tujuan sebelum DOM diganti. Pada perpindahan dari poster panjang
    ke slide HTML yang lebih pendek, browser dapat lebih dulu membatasi scrollY.
    Menyimpan koordinat awal mencegah konten baru berhenti di tengah halaman.
  */
  const targetY=insideTopic?panelStartY():Math.max(0,Number(scrollY)||0);
  if(viewSwitching){
    await update();
    jumpWindow(targetY);
    return;
  }
  viewSwitching=true;
  const root=$('#mainContent');
  const cls=insideTopic?'ak-soft-switching':'ak-view-switching';
  try{
    if(root&&!initial&&!reducedMotion()){
      root.classList.add(cls);
      await wait(90);
    }
    await update();
    jumpWindow(targetY);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  }finally{
    root?.classList.remove(cls);
    viewSwitching=false;
  }
}

async function renderRouteAt(y=0,initial=false){
  await blinkSwap(()=>route(),{scrollY:y,initial});
}

async function refreshRoute(){
  const y=window.scrollY||0;
  const previousTab=currentTab;
  const wasTopic=parse()[0]==='topic';
  await route();
  if(wasTopic&&previousTab&&previousTab!=='learn'){
    currentTab=previousTab;
    $$('.ak-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===previousTab));
    $$('.ak-panel').forEach(panel=>panel.classList.toggle('active',panel.id==='panel-'+previousTab));
    if(previousTab==='quiz')renderQuiz();
  }
  jumpWindow(y);
}

async function go(value){
  const destination=normalizeRoute(value);
  const origin=currentRoute();

  closeSearch();
  closeLB();

  if(destination===origin){
    restoreScroll(0);
    return;
  }

  saveScroll();

  history.pushState(
    {
      akRoute:destination,
      akFromRoute:origin,
      akScrollY:0
    },
    '',
    destination
  );

  await renderRouteAt(0);
}

async function backToParent(value){
  const parentRoute=normalizeRoute(value);

  closeSearch();
  closeLB();
  saveScroll();

  /*
    Bila halaman sebelumnya memang kelompok induk,
    gunakan Back asli agar posisi scroll kelompok dipulihkan.
  */
  if(history.state?.akFromRoute===parentRoute){
    history.back();
    return;
  }

  /*
    Bila submateri dibuka dari Beranda, Favorit, pencarian,
    atau tautan langsung, ganti entri submateri dengan kelompok.
    Dengan begitu Back berikutnya kembali ke halaman asal,
    bukan masuk lagi ke submateri.
  */
  history.replaceState(
    {
      akRoute:parentRoute,
      akFromRoute:history.state?.akFromRoute||null,
      akScrollY:0
    },
    '',
    parentRoute
  );

  await renderRouteAt(0);
}

async function handleHistoryNavigation(savedState=history.state){
  closeSearch();
  closeLB();
  await renderRouteAt(savedState?.akScrollY||0);
}

function nav(page){const k=['group','topic'].includes(page)?'library':page;$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===k))}
async function route(){
  const p=parse(), page=p[0]||'home';
  if(page!=='topic')sessionTopicId=null;
  currentId=null;current=null;quizRun=null;document.body.classList.remove('ak-is-module');nav(page);
  try{
    if(page==='home')return home();
    if(page==='library')return library();
    if(page==='group')return groupPage(p[1]);
    if(page==='topic')return await topicPage(p[1]);
    if(page==='favorites')return topicList('Favorit','Materi yang Anda tandai.',state.favorites);
    if(page==='recent')return topicList('Terakhir Dibuka','Riwayat materi pada perangkat ini.',state.recent);
    if(page==='about')return about();
    return home();
  }catch(e){$('#mainContent').innerHTML=`<div class="ak-empty"><strong>Materi gagal dimuat.</strong><br>${esc(e.message)}</div>`}
}
function groupCards(){return CATALOG.groupOrder.map(id=>{const g=GROUPS[id];return `<article class="ak-card ak-group-card" style="--module:${g.color};--soft:${g.soft}" data-route="#/group/${id}" role="link" tabindex="0" aria-label="Buka ${esc(g.code)} — ${esc(g.title)}"><div class="ak-card-body"><div class="ak-card-top"><div class="ak-code-badge">${esc(g.code)}</div><div class="ak-module-icon" style="background:${g.soft};color:${g.color}">${icon(g.icon)}</div></div><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p><div class="ak-meta-row"><span class="ak-chip">${g.topics.length} submateri</span></div><div class="ak-card-action"><span class="ak-open">Lihat submateri</span></div></div></article>`}).join('')}
function priorityBadge(t,compact=false){const label=t.priorityLabel||(t.priority==='practice'?'Praktik Wajib':'Pengetahuan Wajib');return `<span class="ak-priority ak-priority-${t.priority==='practice'?'practice':'knowledge'} ${compact?'is-compact':''}">${esc(label)}</span>`}
function topicCard(id){const t=TOPICS[id];if(!t)return'';const g=GROUPS[t.group];return `<article class="ak-card ak-topic-card" style="--module:${t.color};--soft:${t.soft}" data-route="#/topic/${id}" data-priority="${esc(t.priority||'knowledge')}" role="link" tabindex="0" aria-label="Mulai belajar ${esc(t.title)}"><div class="ak-card-body"><div class="ak-card-top"><div><span class="ak-topic-group">${esc(g.code)}</span><div class="ak-module-icon" style="background:${t.soft};color:${t.color}">${icon(t.icon)}</div></div><button class="ak-fav ${fav(id)?'active':''}" data-action="favorite" data-id="${id}" aria-label="${fav(id)?'Hapus dari favorit':'Tambahkan ke favorit'}">${fav(id)?icon('starFill'):icon('star')}</button></div><h3>${esc(t.title)}</h3>${priorityBadge(t)}<p>${esc(t.desc)}</p><div class="ak-meta-row"><span class="ak-chip">± ${t.minutes} menit</span><span class="ak-chip">${t.slideCount} bagian</span><span class="ak-chip">${t.quizCount} soal acak</span></div><div class="ak-card-action"><span class="ak-open">Mulai belajar</span></div></div></article>`}
function home(){
 const last=state.lastTopic&&TOPICS[state.lastTopic]?TOPICS[state.lastTopic]:null;
 const cont=last?`<section class="ak-section"><div class="ak-section-head"><div><h2>Lanjutkan belajar</h2><p>Kembali ke materi terakhir.</p></div></div><div class="ak-continue"><div class="ak-module-icon" style="background:${last.soft};color:${last.color}">${icon(last.icon)}</div><div><small>${GROUPS[last.group].code}</small><h3>${esc(last.title)}</h3><p>${esc(last.desc)}</p></div><button class="ak-btn ak-btn-primary" data-route="#/topic/${last.id}">Lanjutkan</button></div></section>`:'';
 $('#mainContent').innerHTML=`<section class="ak-hero"><div class="ak-hero-grid"><div><div class="ak-eyebrow">Portal pembelajaran keperawatan</div><h1>Materi Akreditasi dan Asuhan Keperawatan</h1><p>Materi visual ringkas untuk dipelajari kapan saja. Bukan hanya menjelang akreditasi. Mobile-friendly—belajar sambil rebahan. <span class="hero-author">Abdul Khasim, S.Kep., Ners.</span></p><div class="ak-hero-actions"><button class="ak-btn ak-btn-secondary" data-route="#/library">Jelajahi Materi</button><button class="ak-btn ak-btn-outline ak-btn-on-dark" data-action="open-askep">Buka Askep</button></div></div><div class="ak-hero-art"><div class="ak-hero-monogram">AK</div></div></div></section>${cont}<section class="ak-section"><div class="ak-section-head"><div><h2>Kelompok standar</h2><p>Kenali singkatan akreditasi sambil belajar praktik perawat.</p></div></div><div class="ak-grid ak-group-grid">${groupCards()}</div></section><section class="ak-section ak-askep"><div><div class="ak-eyebrow">ASUHAN KEPERAWATAN</div><h2>SDKI – SLKI – SIKI</h2><p>Tautan eksternal menuju referensi asuhan keperawatan.</p><button class="ak-btn ak-btn-secondary" data-action="open-askep">Buka Asuhan Keperawatan</button></div><div class="ak-askep-art">${icon('rights')}</div></section>`
}
function library(){$('#mainContent').innerHTML=`<div class="ak-page-head"><div><h1>Materi Akreditasi</h1><p>Pilih kelompok standar, lalu buka satu submateri.</p></div></div><div class="ak-grid ak-group-grid">${groupCards()}</div>`}
function omittedDetails(g){if(!Array.isArray(g.omittedCodes)||!g.omittedCodes.length)return'';return `<details class="ak-scope-details"><summary>Lihat nomor yang tidak ditampilkan</summary><div>${g.omittedCodes.map(x=>`<span class="ak-code-chip">${esc(x)}</span>`).join('')}</div></details>`}
function groupPage(id){const g=GROUPS[id];if(!g)return library();$('#mainContent').innerHTML=`<div class="ak-breadcrumb"><button data-route="#/library">Materi Akreditasi</button><span>›</span><strong>${g.code}</strong></div><section class="ak-group-hero" style="--module:${g.color};--soft:${g.soft}"><div class="ak-code-hero">${g.code}</div><div><div class="ak-eyebrow">Kelompok standar</div><h1>${esc(g.title)}</h1><p>${esc(g.desc)}</p><div class="ak-module-meta"><span class="ak-dark-chip">${g.topics.length} submateri keperawatan</span></div></div><div class="ak-module-bigicon">${icon(g.icon)}</div></section><div class="ak-scope-note">${icon('info')}<div><strong>Fokus pembelajaran keperawatan</strong><p>${esc(g.scopeNote||'Materi dipilih berdasarkan keterkaitan langsung dengan pengetahuan dan praktik perawat.')}</p>${omittedDetails(g)}</div></div><section class="ak-section"><div class="ak-section-head"><div><h2>Pilih submateri</h2><p>Mulai dari Praktik Wajib atau pilih semua materi.</p></div></div><div class="ak-priority-filters" role="group" aria-label="Filter prioritas"><button class="active" data-action="set-priority-filter" data-filter="all">Semua</button><button data-action="set-priority-filter" data-filter="practice">Praktik Wajib</button><button data-action="set-priority-filter" data-filter="knowledge">Pengetahuan Wajib</button></div><div class="ak-grid ak-topic-grid" id="groupTopicGrid">${g.topics.map(topicCard).join('')}</div><div class="ak-empty ak-filter-empty hidden" id="filterEmpty">Tidak ada materi pada kategori ini.</div></section>`}
function setPriorityFilter(value){const v=['all','practice','knowledge'].includes(value)?value:'all';$$('.ak-priority-filters button').forEach(b=>b.classList.toggle('active',b.dataset.filter===v));let visible=0;$$('#groupTopicGrid .ak-topic-card').forEach(card=>{const show=v==='all'||card.dataset.priority===v;card.classList.toggle('hidden',!show);if(show)visible++});$('#filterEmpty')?.classList.toggle('hidden',visible>0)}
function topicList(title,desc,ids){const v=ids.filter(x=>TOPICS[x]);$('#mainContent').innerHTML=`<div class="ak-page-head"><div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div></div>${v.length?`<div class="ak-grid ak-topic-grid">${v.map(topicCard).join('')}</div>`:'<div class="ak-empty">Belum ada materi di daftar ini.</div>'}`}
async function topicPage(id){
 const meta=TOPICS[id];if(!meta)return library();const g=GROUPS[meta.group];currentId=id;current=await getTopic(id);currentTab='learn';document.body.classList.add('ak-is-module');
 if(sessionTopicId!==id){state.lastSlides[id]=0;sessionTopicId=id;save();}
 recent(id);
 $('#mainContent').innerHTML=`<div class="ak-mobile-module-head"><button class="ak-mobile-module-action" data-action="back-parent" data-parent="#/group/${g.id}" aria-label="Kembali ke ${esc(g.code)}">${icon('back')}</button><div class="ak-mobile-module-title"><small>${g.code} — ${esc(g.title)}</small><strong>${esc(current.title)}</strong></div><button class="ak-mobile-module-action ${fav(id)?'active':''}" data-action="favorite" data-id="${id}">${fav(id)?icon('starFill'):icon('star')}</button></div><button class="ak-inline-back ak-desktop-only" data-action="back-parent" data-parent="#/group/${g.id}">${icon('back')}<span>Kembali ke ${esc(g.code)}</span></button><div class="ak-breadcrumb ak-desktop-only"><button data-route="#/library">Materi</button><span>›</span><button data-action="back-parent" data-parent="#/group/${g.id}">${g.code}</button><span>›</span><strong>${esc(current.short)}</strong></div><section class="ak-module-hero" style="--module:${current.color};--soft:${current.soft}"><div class="ak-module-hero-grid"><div><div class="ak-eyebrow">${g.code} — ${esc(g.title)}</div><h1>${esc(current.title)}</h1>${priorityBadge(current)}<p>${esc(current.desc)}</p><div class="ak-module-meta"><span class="ak-dark-chip">± ${current.minutes} menit</span><span class="ak-dark-chip">${current.slides.length} bagian</span><span class="ak-dark-chip">${current.quizDisplayCount||5} soal acak dari ${current.quiz.length} bank</span></div></div><div class="ak-module-bigicon">${icon(current.icon)}</div></div><button class="ak-module-fav ${fav(id)?'active':''}" data-action="favorite" data-id="${id}">${fav(id)?icon('starFill'):icon('star')}</button></section>${current.notice?`<div class="ak-notice">${icon('alert')}<span>${esc(current.notice)}</span></div>`:''}<div class="ak-tabs" style="--module:${current.color};--soft:${current.soft}"><button class="ak-tab active" data-action="set-tab" data-tab="learn">Pelajari</button><button class="ak-tab" data-action="set-tab" data-tab="summary">Inti Materi</button><button class="ak-tab" data-action="set-tab" data-tab="quiz">Uji Pemahaman</button><button class="ak-tab" data-action="set-tab" data-tab="refs">Referensi</button></div><div id="akPanelStart" class="ak-panel-anchor" aria-hidden="true"></div><section id="panel-learn" class="ak-panel active"></section><section id="panel-summary" class="ak-panel"></section><section id="panel-quiz" class="ak-panel"></section><section id="panel-refs" class="ak-panel"></section><div class="ak-mobile-footer"><button data-action="back-parent" data-parent="#/group/${g.id}">Kembali ke ${g.code}</button><span>•</span><button data-route="#/library">Semua materi</button></div>`;
 renderLearn();renderSummary();renderRefs()
}
function htmlSlide(s){
 const t=s.template||{},items=t.items||[],cols=t.columns||2;
 const itemHtml=items.map((it,i)=>`<article class="ak-native-item"><span class="ak-native-marker">${esc(it.level||i+1)}</span><div class="ak-native-item-body">${it.tag?`<span class="ak-native-tag">${esc(it.tag)}</span>`:''}<h3>${esc(it.title)}</h3><p>${esc(it.text)}</p>${Array.isArray(it.bullets)&&it.bullets.length?`<ul>${it.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${it.example?`<div class="ak-native-example"><strong>Contoh</strong><span>${esc(it.example)}</span></div>`:''}</div></article>`).join('');
 return `<div class="ak-slide-html"><section class="ak-native ak-native-${esc(t.style||'cards')}" style="--native-cols:${cols};--module:${current.color};--soft:${current.soft}"><header class="ak-native-head"><span class="ak-native-kicker">${GROUPS[current.group].code}</span><h2>${esc(s.title)}</h2><p>${esc(s.caption)}</p></header><div class="ak-native-grid">${itemHtml}</div>${t.note?`<div class="ak-native-note">${icon('alert')}<span>${esc(t.note)}</span></div>`:''}</section></div>`
}
function renderLearn(){
 const sl=current.slides,i=Math.max(0,Math.min(sl.length-1,state.lastSlides[currentId]||0)),s=sl[i];state.lastSlides[currentId]=i;save();
 const thumbs=sl.map((x,n)=>`<button class="ak-thumb ${n===i?'active':''}" data-action="set-slide" data-index="${n}">${x.type==='image'?`<img src="${versionedAsset(x.thumbnail)}" alt="" loading="lazy">`:`<span class="ak-thumb-html">${n+1}</span>`}<span>${esc(x.title)}</span></button>`).join('');
 const body=s.type==='image'?`<div class="ak-slide-stage"><img class="ak-poster-image" src="${versionedAsset(s.image)}" alt="${esc(s.title)}" data-action="open-lightbox" data-src="${versionedAsset(s.image)}"></div>`:`<div class="ak-slide-stage">${htmlSlide(s)}</div>`;
 $('#panel-learn').innerHTML=`<div class="ak-learning"><aside class="ak-slide-rail">${thumbs}</aside><div><article class="ak-slide-card">${body}<div class="ak-slide-caption"><h3>${esc(s.title)}</h3><p>${esc(s.caption)}</p></div><div class="ak-slide-controls"><button class="ak-btn ak-btn-outline" data-action="set-slide" data-index="${i-1}" ${i===0?'disabled':''}>${icon('back')} <span>Sebelumnya</span></button><span class="ak-counter">${i+1} dari ${sl.length}</span><button class="ak-btn ak-btn-primary" data-action="set-slide" data-index="${i+1}" ${i===sl.length-1?'disabled':''}><span>Berikutnya</span> ${icon('next')}</button></div></article><div class="ak-mobile-dots">${sl.map((_,n)=>`<span class="ak-dot ${n===i?'active':''}"></span>`).join('')}</div><div class="ak-swipe-hint">Geser kiri atau kanan untuk berpindah</div></div></div>`
}
async function setSlide(i){
 if(!current)return;
 i=Math.max(0,Math.min(current.slides.length-1,i));
 const active=state.lastSlides[currentId]||0;
 if(i===active)return;
 await blinkSwap(()=>{
   state.lastSlides[currentId]=i;
   save();
   renderLearn();
 },{insideTopic:true});
}
async function setTab(t){
 if(!current||t===currentTab)return;
 await blinkSwap(()=>{
   currentTab=t;
   $$('.ak-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
   $$('.ak-panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+t));
   if(t==='quiz')renderQuiz();
 },{insideTopic:true});
}
function renderSummary(){$('#panel-summary').innerHTML=`<div class="ak-section-head"><div><h2>Inti materi</h2><p>Ringkasan alasan, tindakan, dan penerapan.</p></div></div><div class="ak-deep-grid">${current.summarySections.map(s=>`<article class="ak-deep-card"><h3>${esc(s.title)}</h3><ul>${s.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></article>`).join('')}</div><div class="ak-do-grid"><article class="ak-do"><h3>✓ Lakukan</h3><ul class="ak-list">${current.do.map(x=>`<li><span class="ak-list-mark">✓</span><span>${esc(x)}</span></li>`).join('')}</ul></article><article class="ak-dont"><h3>× Hindari</h3><ul class="ak-list">${current.dont.map(x=>`<li><span class="ak-list-mark">×</span><span>${esc(x)}</span></li>`).join('')}</ul></article></div>`}
function shuffle(values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function initQuiz(reset=false){if(reset||!quizRun||quizRun.id!==currentId){const count=Math.min(current.quizDisplayCount||5,current.quiz.length);quizRun={id:currentId,seq:shuffle(current.quiz.map((_,i)=>i)).slice(0,count),pos:0,ans:{},done:false}}}
function renderQuiz(reset=false){initQuiz(reset);const z=quizRun;if(z.done){const total=z.seq.length,ok=z.seq.filter(i=>z.ans[i]?.correct).length,wrong=z.seq.filter(i=>!z.ans[i]?.correct),pct=Math.round(ok/total*100);$('#panel-quiz').innerHTML=`<div class="ak-quiz"><div class="ak-quiz-card ak-score"><div class="ak-score-ring" style="--score:${pct*3.6}deg"><span class="ak-score-num">${ok}/${total}</span></div><h2>Uji Pemahaman Selesai</h2><p>${pct>=80?'Pemahaman sudah baik.':pct>=60?'Cukup baik—ulangi yang salah.':'Pelajari kembali inti materi.'}</p><div class="ak-quiz-actions" style="justify-content:center">${wrong.length?'<button class="ak-btn ak-btn-outline" data-action="retry-wrong">Ulangi yang Salah</button>':''}<button class="ak-btn ak-btn-primary" data-action="restart-quiz">Ulangi Semua</button></div></div></div>`;return}
 const qi=z.seq[z.pos],q=current.quiz[qi],a=z.ans[qi],fb=a?`<div class="ak-feedback ${a.correct?'good':'bad'}"><strong>${a.correct?'Tepat':'Belum tepat'}</strong><p>${esc(q.why)}</p></div><div class="ak-quiz-actions"><button class="ak-btn ak-btn-primary" data-action="next-quiz">${z.pos===z.seq.length-1?'Lihat Hasil':'Soal Berikutnya'} ${icon('next')}</button></div>`:'';
 $('#panel-quiz').innerHTML=`<div class="ak-quiz"><div class="ak-quiz-card"><div class="ak-quiz-progress"><span style="width:${(z.pos+1)/z.seq.length*100}%"></span></div><div class="ak-quiz-label">Soal ${z.pos+1} dari ${z.seq.length}</div><h2>${esc(q.q)}</h2><div class="ak-options">${q.options.map((x,n)=>`<button class="ak-option ${a?(n===q.answer?'correct':n===a.choice?'wrong':''):''}" ${a?'disabled':''} data-action="answer-quiz" data-question="${qi}" data-choice="${n}"><span class="ak-option-letter">${String.fromCharCode(65+n)}</span><span>${esc(x)}</span></button>`).join('')}</div>${fb}</div></div>`
}
function answerQuiz(i,c){const q=current.quiz[i];quizRun.ans[i]={choice:c,correct:c===q.answer};renderQuiz()}
async function nextQuiz(){await blinkSwap(()=>{if(quizRun.pos<quizRun.seq.length-1){quizRun.pos++;renderQuiz()}else{quizRun.done=true;renderQuiz()}},{insideTopic:true})}
async function restartQuiz(){await blinkSwap(()=>{quizRun=null;renderQuiz(true)},{insideTopic:true})}
async function retryWrong(){await blinkSwap(()=>{const w=quizRun.seq.filter(i=>!quizRun.ans[i]?.correct);quizRun={id:currentId,seq:w,pos:0,ans:{},done:false};renderQuiz()},{insideTopic:true})}
function renderRefs(){$('#panel-refs').innerHTML=`<div class="ak-section-head"><div><h2>Referensi utama</h2><p>Sumber dasar materi.</p></div></div><div class="ak-refs">${current.references.map(r=>r.url?`<a class="ak-ref" href="${r.url}" target="_blank" rel="noopener"><div><strong>${esc(r.title)}</strong><small>${esc(r.org)}</small></div><span class="ak-ref-icon">${icon('external')}</span></a>`:`<div class="ak-ref"><div><strong>${esc(r.title)}</strong><small>${esc(r.org)}</small></div></div>`).join('')}</div><div class="ak-disclaimer">Portal ini inisiatif pembelajaran pribadi, bukan situs resmi rumah sakit. Penerapan tetap mengikuti regulasi, SPO, kewenangan, instrumen, dan kebijakan fasilitas.</div>`}
function about(){$('#mainContent').innerHTML=`<div class="ak-page-head"><div><h1>Tentang Portal</h1><p>Media belajar mandiri tenaga keperawatan.</p></div></div><div class="ak-deep-grid"><article class="ak-deep-card"><h3>Tujuan</h3><ul><li>Membiasakan singkatan kelompok standar.</li><li>Menyajikan submateri secara fokus.</li><li>Mendukung wawancara dan simulasi.</li></ul></article><article class="ak-deep-card"><h3>Batasan</h3><ul><li>Bukan situs resmi rumah sakit.</li><li>Tidak menggantikan SPO atau keputusan klinis.</li><li>Alur internal mengikuti fasilitas.</li></ul></article></div>`}
function openSearch(){$('#searchOverlay').classList.add('open');$('#searchInput').value='';search('');setTimeout(()=>$('#searchInput').focus(),50)}
function closeSearch(){$('#searchOverlay')?.classList.remove('open')}
function search(q){q=(q||'').trim().toLowerCase();const gr=CATALOG.groupOrder.filter(id=>{const g=GROUPS[id];return !q||`${g.code} ${g.title} ${g.desc}`.toLowerCase().includes(q)}).map(id=>({k:'g',d:GROUPS[id]})),tr=Object.values(TOPICS).filter(t=>!q||`${GROUPS[t.group].code} ${t.title} ${t.desc} ${(t.keywords||[]).join(' ')} ${t.searchText||''}`.toLowerCase().includes(q)).slice(0,30).map(d=>({k:'t',d})),r=[...gr,...tr];$('#searchResults').innerHTML=r.length?r.map(x=>x.k==='g'?`<button class="ak-search-item" data-route="#/group/${x.d.id}"><span class="ak-search-code">${x.d.code}</span><span><strong>${esc(x.d.title)}</strong><small>Kelompok standar · ${x.d.topics.length} submateri</small></span></button>`:`<button class="ak-search-item" data-route="#/topic/${x.d.id}"><span class="ak-search-code">${GROUPS[x.d.group].code}</span><span><strong>${esc(x.d.title)}</strong><small>${esc(x.d.desc)}</small></span></button>`).join(''):'<div class="ak-empty">Materi tidak ditemukan.</div>'}
function openLB(src){if(!src)return;lbZoom=1;$('#lightboxImage').src=src;$('#lightboxImage').style.transform='scale(1)';$('#lightbox').classList.add('open')}
function closeLB(){$('#lightbox')?.classList.remove('open')}
function zoomLB(d){lbZoom=Math.max(.6,Math.min(3,lbZoom+d));$('#lightboxImage').style.transform=`scale(${lbZoom})`}
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function bind(){
  if('scrollRestoration' in history){
    history.scrollRestoration='manual';
  }

  /*
    Back/Forward browser dan tombol Back Android/PWA.
    Guard hashchange mencegah render dua kali pada browser
    yang memicu popstate dan hashchange bersamaan.
  */
  window.addEventListener('popstate',async e=>{
    handlingPopState=true;
    await handleHistoryNavigation(e.state);
    setTimeout(()=>{handlingPopState=false},0);
  });

  /*
    Fallback bila hash diubah langsung dari address bar
    atau dari tautan hash yang tidak memakai data-route.
  */
  window.addEventListener('hashchange',async ()=>{
    if(handlingPopState)return;
    await handleHistoryNavigation(history.state);
  });

  window.addEventListener(
    'scroll',
    ()=>{
      clearTimeout(scrollSaveTimer);
      scrollSaveTimer=setTimeout(saveScroll,120);
    },
    {passive:true}
  );

  window.addEventListener('pagehide',saveScroll);

  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-action]');

    if(a){
      const x=a.dataset.action;
      if(x==='open-lightbox'&&suppressNextClick){suppressNextClick=false;return;}

      if(x==='open-askep')window.open(ASKEP,'_blank','noopener');
      if(x==='favorite')toggleFav(a.dataset.id);
      if(x==='open-search')openSearch();
      if(x==='close-search')closeSearch();
      if(x==='set-tab')setTab(a.dataset.tab);
      if(x==='set-slide')setSlide(Number(a.dataset.index));
      if(x==='open-lightbox')openLB(a.dataset.src);
      if(x==='close-lightbox')closeLB();
      if(x==='zoom-lightbox')zoomLB(Number(a.dataset.delta));
      if(x==='answer-quiz')answerQuiz(Number(a.dataset.question),Number(a.dataset.choice));
      if(x==='next-quiz')nextQuiz();
      if(x==='restart-quiz')restartQuiz();
      if(x==='retry-wrong')retryWrong();
      if(x==='back-parent')backToParent(a.dataset.parent);
      if(x==='set-priority-filter')setPriorityFilter(a.dataset.filter);

      return;
    }

    const r=e.target.closest('[data-route]');

    if(r){
      e.preventDefault();
      go(r.dataset.route);
    }
  });

  $('#searchInput')?.addEventListener('input',e=>search(e.target.value));

  document.addEventListener('touchstart',e=>{
    if(!window.matchMedia('(max-width: 820px)').matches||currentTab!=='learn'||!currentId)return;
    if($('#lightbox')?.classList.contains('open'))return;
    if(!e.target.closest('#panel-learn')||e.target.closest('button,a,input,textarea,select'))return;
    const t=e.changedTouches?.[0];
    if(!t)return;
    touchStart={x:t.clientX,y:t.clientY,time:Date.now()};
  },{passive:true});

  document.addEventListener('touchend',e=>{
    if(!touchStart||currentTab!=='learn'||!currentId){touchStart=null;return;}
    const t=e.changedTouches?.[0];
    if(!t){touchStart=null;return;}
    const dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;
    const horizontal=Math.abs(dx)>=58&&Math.abs(dx)>Math.abs(dy)*1.25&&Date.now()-touchStart.time<900;
    touchStart=null;
    if(!horizontal)return;
    suppressNextClick=true;
    setTimeout(()=>{suppressNextClick=false},450);
    const currentIndex=state.lastSlides[currentId]||0;
    setSlide(currentIndex+(dx<0?1:-1));
  },{passive:true});

  document.addEventListener('keydown',e=>{
    const card=e.target.closest?.('.ak-card[data-route]');

    if(card&&(e.key==='Enter'||e.key===' ')){
      e.preventDefault();
      go(card.dataset.route);
      return;
    }

    if(e.key==='Escape'){
      closeSearch();
      closeLB();
    }

    if(e.key==='ArrowRight'&&currentId&&currentTab==='learn'){
      setSlide((state.lastSlides[currentId]||0)+1);
    }

    if(e.key==='ArrowLeft'&&currentId&&currentTab==='learn'){
      setSlide((state.lastSlides[currentId]||0)-1);
    }
  });
}
async function init(){
  CATALOG=await getJSON('assets/data/catalog-v4-4-0.json?v='+ASSET_VERSION);
  if(!CATALOG || !Array.isArray(CATALOG.groupOrder) || !CATALOG.groups || !CATALOG.topics){
    throw Error('Katalog Portal v4.4.0 tidak lengkap. Muat ulang halaman atau bersihkan cache situs.');
  }
  GROUPS=CATALOG.groups;
  TOPICS=CATALOG.topics;
  ICONS=CATALOG.icons||{};
  ASKEP=CATALOG.askepUrl||'';
  history.replaceState(
    {
      ...history.state,
      akRoute:currentRoute(),
      akScrollY:0
    },
    '',
    location.href
  );

  bind();
  await renderRouteAt(0,true);
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
  }
}
init().catch(e=>$('#mainContent').innerHTML=`<div class="ak-empty"><strong>Portal gagal dimuat.</strong><br>${esc(e.message)}</div>`);
})();
