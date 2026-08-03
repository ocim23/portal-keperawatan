var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// @ts-nocheck
var ICONS = {}, MODULES = {}, MODULE_ORDER = [], ASKEP_URL = '', ASSETS = {};
var ASSET_MODULES = {};
var assetsLoaded = {}, assetsLoading = {};
var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return __spreadArray([], __read(document.querySelectorAll(s)), false); };
var STORE_KEY = 'ak_portal_state_v2';
var defaultState = { favorites: [], recent: [], lastModule: null, lastSlides: {}, lastQuiz: {} };
var state = loadState();
var currentModule = null, currentTab = 'learn', quizRuntime = null, lightboxZoom = 1, touchStartX = 0;
var focusMode = false, lastScrollY = 0, scrollFramePending = false;
function loadState() { try {
    return __assign(__assign({}, defaultState), JSON.parse(localStorage.getItem(STORE_KEY) || '{}'));
}
catch (e) {
    return __assign({}, defaultState);
} }
function saveState() { try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
catch (e) { } }
function esc(x) {
    if (x === void 0) { x = ''; }
    return String(x).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]); });
}
function icon(name) { return ICONS[name] || ICONS.shield; }
var MISSING_ASSET = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"800\" viewBox=\"0 0 1200 800\"><rect width=\"1200\" height=\"800\" fill=\"%23F4FAFB\"/><rect x=\"36\" y=\"36\" width=\"1128\" height=\"728\" rx=\"30\" fill=\"white\" stroke=\"%23D9E8EC\" stroke-width=\"4\" stroke-dasharray=\"16 14\"/><text x=\"600\" y=\"385\" text-anchor=\"middle\" font-family=\"Arial,sans-serif\" font-size=\"42\" font-weight=\"700\" fill=\"%230B3A4A\">Gambar materi belum dimuat</text><text x=\"600\" y=\"440\" text-anchor=\"middle\" font-family=\"Arial,sans-serif\" font-size=\"26\" fill=\"%23657B86\">Pastikan seluruh file Assets telah disalin lengkap.</text></svg>");
function assetSrc(key, variant) {
    var entry = ASSETS[key];
    if (!entry) return MISSING_ASSET;
    if (typeof entry === 'string') return entry;
    var src = variant === 'thumb'
        ? (entry.thumb || entry.main || MISSING_ASSET)
        : (entry.main || entry.thumb || MISSING_ASSET);
    if (!src || src.indexOf('data:') === 0) return src || MISSING_ASSET;
    var version = entry.version || 1;
    return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(version);
}
function hasAsset(key) {
    var entry = ASSETS[key];
    return !!(entry && (typeof entry === 'string' || entry.main || entry.thumb));
}
function preloadAdjacent(m, index) {
    [index - 1, index + 1].forEach(function(n) {
        if (n < 0 || n >= m.slides.length) return;
        var slide = m.slides[n];
        if (slide.type !== 'image' || !hasAsset(slide.asset)) return;
        var img = new Image();
        img.decoding = 'async';
        img.src = assetSrc(slide.asset, 'main');
    });
}
function setRoute(h) { location.hash = h; }
function setRouteChrome(isModule) {
    document.body.classList.toggle('ak-is-module', !!isModule);
    if (focusMode)
        setFocusMode(false);
    lastScrollY = 0;
    showBottomNav();
}
function route() {
    var h = location.hash || '#/home';
    var parts = h.replace(/^#\//, '').split('/');
    var isModule = parts[0] === 'module' && !!MODULES[parts[1]];
    setRouteChrome(isModule);
    if (isModule)
        renderModule(parts[1]);
    else if (parts[0] === 'library')
        renderLibrary();
    else if (parts[0] === 'favorites')
        renderFavorites();
    else if (parts[0] === 'recent')
        renderRecent();
    else if (parts[0] === 'about')
        renderAbout();
    else
        renderHome();
    updateNav(parts[0]);
    window.scrollTo(0, 0);
}
function updateNav(routeName) { var map = { home: 'home', library: 'library', favorites: 'favorites', recent: 'recent', about: 'about', module: 'library' }; var active = map[routeName] || 'home'; $$('[data-nav]').forEach(function (b) { return b.classList.toggle('active', b.dataset.nav === active); }); }
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(function () { return t.classList.remove('show'); }, 2200); }
function isFav(id) { return state.favorites.includes(id); }
function toggleFav(id, e) { if (e)
    e.stopPropagation(); if (isFav(id)) {
    state.favorites = state.favorites.filter(function (x) { return x !== id; });
    toast('Dihapus dari Favorit');
}
else {
    state.favorites.unshift(id);
    toast('Ditambahkan ke Favorit');
} saveState(); document.querySelectorAll("[data-fav=\"".concat(id, "\"]")).forEach(function (b) { b.classList.toggle('active', isFav(id)); b.innerHTML = isFav(id) ? ICONS.starFill : ICONS.star; }); if (location.hash === '#/favorites')
    renderFavorites(); }
function markRecent(id) { state.recent = __spreadArray([id], __read(state.recent.filter(function (x) { return x !== id; })), false).slice(0, 12); state.lastModule = id; saveState(); }
function moduleIcon(m, cls) {
    if (cls === void 0) { cls = 'ak-module-icon'; }
    return "<div class=\"".concat(cls, "\" style=\"background:").concat(m.soft, ";color:").concat(m.color, "\">").concat(icon(m.icon), "</div>");
}
function moduleCard(m) { return "<article class=\"ak-card\" data-route=\"#/module/".concat(m.id, "\"><div class=\"ak-card-body\"><div class=\"ak-card-top\">").concat(moduleIcon(m), "<button class=\"ak-fav ").concat(isFav(m.id) ? 'active' : '', "\" data-fav=\"").concat(m.id, "\" data-action=\"toggle-fav\" data-module=\"").concat(m.id, "\" aria-label=\"Favorit\">").concat(isFav(m.id) ? ICONS.starFill : ICONS.star, "</button></div><h3>").concat(esc(m.short), "</h3><p>").concat(esc(m.desc), "</p><div class=\"ak-meta-row\"><span class=\"ak-chip\" style=\"background:").concat(m.soft, ";color:").concat(m.color, "\">").concat(esc(m.category), "</span><span class=\"ak-chip\">\u00B1 ").concat(m.minutes, " menit</span><span class=\"ak-chip\">").concat(m.quiz.length, " soal</span></div><div class=\"ak-card-action\"><button class=\"ak-open\" data-route=\"#/module/").concat(m.id, "\">Pelajari</button><span style=\"color:").concat(m.color, "\">").concat(ICONS.next, "</span></div></div></article>"); }
function renderCards(arr) { return arr.length ? "<div class=\"ak-grid\">".concat(arr.map(moduleCard).join(''), "</div>") : "<div class=\"ak-empty\">Belum ada materi pada bagian ini.</div>"; }
function pageHead(title, desc) { return "<div class=\"ak-page-head\"><div><h1>".concat(esc(title), "</h1><p>").concat(esc(desc), "</p></div></div>"); }
function renderHome() {
    currentModule = null;
    var last = state.lastModule && MODULES[state.lastModule] ? MODULES[state.lastModule] : null;
    var content = "\n<section class=\"ak-hero ak-hero-compact\"><div class=\"ak-hero-grid\"><div><div class=\"ak-eyebrow\">Media Pembelajaran Internal</div><h1>Materi Akreditasi dan Asuhan Keperawatan</h1><p>Materi visual, ringkas, dan praktis untuk dipelajari kapan saja—bukan hanya menjelang akreditasi.</p></div><div class=\"ak-hero-art\"><div class=\"ak-hero-mark\"><div class=\"ak-logo-monogram ak-logo-hero\" aria-label=\"Logo AK\">AK</div></div></div></div></section>\n" +
      (last ? "<section class=\"ak-section\"><div class=\"ak-section-head\"><div><h2>Lanjutkan belajar</h2><p>Kembali ke materi terakhir yang dibuka.</p></div></div><div class=\"ak-continue\">" + moduleIcon(last) + "<div><h3>" + esc(last.title) + "</h3><p>Terakhir melihat bagian " + Math.min((state.lastSlides[last.id] || 0) + 1, last.slides.length) + " dari " + last.slides.length + ".</p></div><button class=\"ak-btn ak-btn-primary\" data-route=\"#/module/" + last.id + "\">Lanjutkan</button></div></section>" : "") +
      "\n<section class=\"ak-section\"><div class=\"ak-section-head\"><div><h2>Materi Akreditasi</h2><p>Pilih materi yang dibutuhkan; semua modul tetap dapat dicari melalui ikon pencarian.</p></div></div>" +
      renderCards(MODULE_ORDER.map(function(id){ return MODULES[id]; })) +
      "</section>\n<section class=\"ak-section\"><div class=\"ak-askep\"><div><div class=\"ak-eyebrow\">Asuhan Keperawatan</div><h2>SDKI – SLKI – SIKI</h2><p>Akses standar asuhan keperawatan yang menghubungkan diagnosis, luaran, dan intervensi dalam satu halaman praktis.</p><a class=\"ak-btn ak-btn-secondary\" href=\"" + ASKEP_URL + "\" target=\"_blank\" rel=\"noopener\">Buka Standar Askep " + ICONS.external + "</a></div><div class=\"ak-askep-art\">" + ICONS.target + "</div></div></section>" + "<footer class=\"ak-mobile-footer\"><button data-route=\"#/about\">Tentang Portal</button><span>·</span><span>Inisiatif pribadi untuk pembelajaran internal</span></footer>";
    setMain(content, 'Beranda');
}
function renderLibrary() { currentModule = null; setMain("".concat(pageHead('Materi Akreditasi', 'Pilih materi, tandai favorit, lalu pelajari melalui visual dan kuis singkat.')).concat(renderCards(MODULE_ORDER.map(function (id) { return MODULES[id]; }))), 'Materi Akreditasi'); }
function renderFavorites() { currentModule = null; var arr = state.favorites.map(function (id) { return MODULES[id]; }).filter(Boolean); setMain("".concat(pageHead('Materi Favorit', 'Favorit disimpan pada browser dan perangkat ini\u2014tanpa login atau email.')).concat(arr.length ? renderCards(arr) : "<div class=\"ak-empty\"><div style=\"width:48px;margin:0 auto 12px;color:#9AB0B8\">".concat(ICONS.star, "</div><strong>Belum ada materi favorit</strong><p>Tekan ikon bintang pada materi yang sering digunakan.</p><button class=\"ak-btn ak-btn-primary\" data-route=\"#/library\">Lihat Materi</button></div>")), 'Favorit'); }
function renderRecent() { currentModule = null; var arr = state.recent.map(function (id) { return MODULES[id]; }).filter(Boolean); setMain("".concat(pageHead('Terakhir Dibuka', 'Daftar materi yang terakhir diakses pada perangkat ini.')).concat(arr.length ? renderCards(arr) : "<div class=\"ak-empty\">Belum ada riwayat materi yang dibuka.</div>"), 'Terakhir Dibuka'); }
function renderAbout() {
    currentModule = null;
    setMain("".concat(pageHead('Tentang Portal', 'Latar belakang, batas penggunaan, dan prinsip pengembangan.'), "\n<div class=\"ak-about\"><article class=\"ak-about-card\"><h2>Mengapa portal ini dibuat?</h2><p>Portal Keperawatan lahir dari kebutuhan praktis tenaga keperawatan untuk menemukan materi dengan cepat. Materi akreditasi disajikan sebagai microlearning: visual, ringkas, mudah dicari, dan dapat dipelajari kapan saja.</p><h3>Prinsip portal</h3><ul><li>Bukan artikel panjang; fokus pada visual, alur, inti, dan uji pemahaman.</li><li>Tidak menyimpan identitas, email, atau nilai pengguna.</li><li>Favorit, materi terakhir, dan posisi belajar tersimpan hanya di browser perangkat.</li><li>Tautan Asuhan Keperawatan digunakan untuk kebutuhan pembelajaran internal dan tidak dikomersialkan.</li></ul><h3>Batas penggunaan</h3><p>Portal ini merupakan inisiatif pribadi dan bukan situs resmi rumah sakit. Materi tidak menggantikan regulasi, buku sumber, pedoman, SPO, instruksi klinis, pelatihan keterampilan, atau kewenangan tenaga kesehatan.</p></article><aside class=\"ak-about-card ak-about-logo\"><div class=\"ak-logo-monogram\" aria-label=\"Logo AK\">AK</div><h2>Portal Keperawatan</h2><p>Media pembelajaran internal<br>oleh Abdul Khasim</p></aside></div>"), 'Tentang Portal');
}
function setMain(html, title) {
    if (title === void 0) { title = 'Portal Keperawatan'; }
    document.title = "".concat(title, " \u00B7 Portal Keperawatan");
    $('#mainContent').innerHTML = html;
}
function showModuleLoading(id) {
    var m = MODULES[id];
    setMain("<div class=\"ak-page-head\"><div><h1>".concat(esc(m ? m.title : 'Memuat materi'), "</h1><p>Menyiapkan poster materi...</p></div></div><div class=\"ak-empty\">Memuat gambar materi. Mohon tunggu sebentar...</div>"), m ? m.short : 'Materi');
}
function loadModuleAssets(id) {
    assetsLoaded[id] = true;
    renderModule(id);
}
function renderModule(id) {
    if (ASSET_MODULES[id] && !assetsLoaded[id]) {
        loadModuleAssets(id);
        return;
    }
    var m = MODULES[id];
    if (!m) {
        setRoute('#/library');
        return;
    }
    currentModule = id;
    markRecent(id);
    currentTab = 'learn';
    document.documentElement.style.setProperty('--module', m.color);
    document.documentElement.style.setProperty('--soft', m.soft);

    var favoriteIcon = isFav(id) ? ICONS.starFill : ICONS.star;
    var favoriteClass = isFav(id) ? 'active' : '';
    var mobileHeader =
      '<header class="ak-mobile-module-head">' +
        '<button class="ak-mobile-module-action" data-action="back" aria-label="Kembali">' + ICONS.back + '</button>' +
        '<div class="ak-mobile-module-title"><small>' + esc(m.category) + '</small><strong>' + esc(m.title) + '</strong></div>' +
        '<button class="ak-mobile-module-action ak-mobile-module-fav ' + favoriteClass + '" data-fav="' + id + '" data-action="toggle-fav" data-module="' + id + '" aria-label="Favorit">' + favoriteIcon + '</button>' +
      '</header>';

    var desktopHeader =
      '<div class="ak-page-head"><button class="ak-back" data-action="back">' + ICONS.back + '</button><div><p style="margin:0;color:var(--muted);font-size:13px">Materi Akreditasi</p></div></div>' +
      '<section class="ak-module-hero"><div class="ak-module-hero-grid"><div><div class="ak-eyebrow">' + esc(m.category) + '</div><h1>' + esc(m.title) + '</h1><p>' + esc(m.desc) + '</p>' +
      '<div class="ak-module-meta"><span class="ak-dark-chip">± ' + m.minutes + ' menit</span><span class="ak-dark-chip">' + m.slides.length + ' bagian</span><span class="ak-dark-chip">' + m.quiz.length + ' soal</span><span class="ak-dark-chip">Diperbarui ' + m.updated + '</span></div>' +
      '</div><div class="ak-module-bigicon">' + icon(m.icon) + '</div></div>' +
      '<button class="ak-module-fav ' + favoriteClass + '" data-fav="' + id + '" data-action="toggle-fav" data-module="' + id + '">' + favoriteIcon + '</button></section>';

    var notice = m.notice ? '<div class="ak-notice">' + ICONS.alert + '<span>' + esc(m.notice) + '</span></div>' : '';
    var tabs =
      '<nav class="ak-tabs">' +
        '<button class="ak-tab active" data-tab="learn" data-action="switch-tab">Pelajari</button>' +
        '<button class="ak-tab" data-tab="summary" data-action="switch-tab">Inti Materi</button>' +
        '<button class="ak-tab" data-tab="quiz" data-action="switch-tab">Uji Pemahaman</button>' +
        '<button class="ak-tab" data-tab="refs" data-action="switch-tab">Referensi</button>' +
      '</nav>';

    setMain(
      mobileHeader + desktopHeader + notice + tabs +
      '<section id="panel-learn" class="ak-panel active"></section>' +
      '<section id="panel-summary" class="ak-panel"></section>' +
      '<section id="panel-quiz" class="ak-panel"></section>' +
      '<section id="panel-refs" class="ak-panel"></section>',
      m.short
    );
    renderLearn();
    renderSummary();
    renderQuiz(true);
    renderRefs();
}
function switchTab(tab) {
    currentTab = tab;
    showBottomNav();
    $$('.ak-tab').forEach(function (b) { return b.classList.toggle('active', b.dataset.tab === tab); });
    $$('.ak-panel').forEach(function (p) { return p.classList.toggle('active', p.id === "panel-".concat(tab)); });
    if (tab === 'quiz')
        renderQuiz(false);
    var tabs = document.querySelector('.ak-tabs');
    var offset = window.matchMedia('(max-width: 820px)').matches ? 4 : 70;
    if (tabs)
        window.scrollTo({ top: Math.max(0, tabs.offsetTop - offset), behavior: 'smooth' });
}
function currentSlideIndex() { return Math.min(state.lastSlides[currentModule] || 0, MODULES[currentModule].slides.length - 1); }
function setSlide(i) {
    showBottomNav();
    var m = MODULES[currentModule];
    i = Math.max(0, Math.min(m.slides.length - 1, Number(i)));
    state.lastSlides[currentModule] = i;
    saveState();
    renderLearn();
}
function renderLearn() {
    if (!currentModule) return;
    var m = MODULES[currentModule], i = currentSlideIndex(), s = m.slides[i];
    var thumbs = m.slides.map(function(x,n) {
        var preview = x.type === 'image'
          ? (hasAsset(x.asset) ? "<img src=\"" + assetSrc(x.asset,'thumb') + "\" loading=\"lazy\" decoding=\"async\" alt=\"\">" : icon(m.icon))
          : icon(m.icon);
        return "<button class=\"ak-thumb " + (n === i ? 'active' : '') + "\" data-action=\"set-slide\" data-index=\"" + n + "\"><div class=\"ak-thumb-preview\">" + preview + "</div><span>" + (n+1) + ". " + esc(x.title) + "</span></button>";
    }).join('');

    var content;
    if (s.type === 'image') {
        content = hasAsset(s.asset)
          ? "<img class=\"ak-poster-image\" src=\"" + assetSrc(s.asset,'main') + "\" alt=\"" + esc(s.title) + "\" data-action=\"open-lightbox\" data-asset=\"" + s.asset + "\" loading=\"eager\" decoding=\"async\" fetchpriority=\"high\">"
          : "<div class=\"ak-missing-asset\"><div><strong>Gambar belum terhubung</strong><p>Unggah folder WebP ke Drive lalu jalankan <code>setupPortalAssets(rootFolderId)</code>.</p></div></div>";
    } else {
        content = "<div class=\"ak-slide-html\">" + renderTemplate(s,m) + "</div>";
    }

    var prevDisabled = i === 0 ? ' disabled' : '';
    var nextDisabled = i === m.slides.length - 1 ? ' disabled' : '';
    $('#panel-learn').innerHTML =
      "<div class=\"ak-learning\"><aside class=\"ak-slide-rail\">" + thumbs + "</aside><div><article class=\"ak-slide-card\">" +
      "<div class=\"ak-slide-stage\" id=\"slideStage\">" + content + "</div>" +
      "<div class=\"ak-slide-caption\"><div class=\"ak-slide-title-row\"><h3>" + esc(s.title) + "</h3><button class=\"ak-focus-trigger\" data-action=\"toggle-focus\" aria-label=\"Buka mode fokus\">⛶ <span>Mode Fokus</span></button></div><p>" + esc(s.caption) + "</p></div>" +
      "<div class=\"ak-slide-controls\"><button class=\"ak-btn ak-btn-outline\" data-action=\"set-slide\" data-index=\"" + (i-1) + "\"" + prevDisabled + ">" + ICONS.back + "<span>Sebelumnya</span></button>" +
      "<span class=\"ak-counter\">" + (i+1) + " dari " + m.slides.length + "</span>" +
      "<button class=\"ak-btn ak-btn-primary\" data-action=\"set-slide\" data-index=\"" + (i+1) + "\"" + nextDisabled + "><span>Berikutnya</span>" + ICONS.next + "</button></div>" +
      "</article><div class=\"ak-mobile-dots\">" + m.slides.map(function(_,n){ return "<span class=\"ak-dot " + (n===i?'active':'') + "\"></span>"; }).join('') + "</div></div></div>";

    var stage = $('#slideStage');
    stage.addEventListener('touchstart', function(e){ touchStartX = e.changedTouches[0].screenX; }, {passive:true});
    stage.addEventListener('touchend', function(e){
        var dx = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(dx) > 60 && !e.target.closest('.ak-native')) setSlide(i + (dx < 0 ? 1 : -1));
    }, {passive:true});
    var activeImg = stage.querySelector('img');
    if (activeImg) activeImg.addEventListener('error', function(){ activeImg.src = MISSING_ASSET; });
    preloadAdjacent(m,i);
}
function renderSummary() {
    if (!currentModule) return;
    var m = MODULES[currentModule];
    var sections = m.summarySections || (m.essentials || []).map(function(x){ return {title:x.title, points:[x.text]}; });
    var deep = sections.map(function(section) {
        return "<article class=\"ak-deep-card\"><h3>" + esc(section.title) + "</h3><ul>" +
          (section.points || []).map(function(point){ return "<li>" + esc(point) + "</li>"; }).join('') +
          "</ul></article>";
    }).join('');
    $('#panel-summary').innerHTML =
      "<div class=\"ak-section-head\"><div><h2>Inti materi</h2><p>Ringkas, tetapi cukup dalam untuk memahami alasan dan penerapannya.</p></div></div>" +
      "<div class=\"ak-deep-grid\">" + deep + "</div>" +
      "<div class=\"ak-do-grid\"><article class=\"ak-do\"><h3>✓ Lakukan</h3><ul class=\"ak-list\">" +
      m.do.map(function(x){ return "<li><span class=\"ak-list-mark\">✓</span><span>" + esc(x) + "</span></li>"; }).join('') +
      "</ul></article><article class=\"ak-dont\"><h3>× Hindari</h3><ul class=\"ak-list\">" +
      m.dont.map(function(x){ return "<li><span class=\"ak-list-mark\">×</span><span>" + esc(x) + "</span></li>"; }).join('') +
      "</ul></article></div>";
}
function initQuiz(reset) {
    if (reset === void 0) { reset = false; }
    var m = MODULES[currentModule];
    if (reset || !quizRuntime || quizRuntime.module !== currentModule) {
        var saved = Math.min(state.lastQuiz[currentModule] || 0, m.quiz.length - 1);
        quizRuntime = { module: currentModule, sequence: m.quiz.map(function (_, i) { return i; }), position: saved, answers: {}, finished: false };
    }
}
function renderQuiz(reset) {
    if (reset === void 0) reset = false;
    if (!currentModule) return;
    initQuiz(reset);
    var m = MODULES[currentModule], qz = quizRuntime;
    if (qz.finished) {
        var total = qz.sequence.length;
        var correct = qz.sequence.filter(function(i){ return qz.answers[i] && qz.answers[i].correct; }).length;
        var wrong = qz.sequence.filter(function(i){ return !(qz.answers[i] && qz.answers[i].correct); });
        var pct = Math.round(correct / total * 100);
        $('#panel-quiz').innerHTML = "<div class=\"ak-quiz\"><div class=\"ak-quiz-card ak-score\"><div class=\"ak-score-ring\" style=\"--score:" + (pct*3.6) + "deg\"><span class=\"ak-score-num\">" + correct + "/" + total + "</span></div><h2>Uji Pemahaman Selesai</h2><p>" +
          (pct >= 80 ? 'Pemahaman sudah baik.' : pct >= 60 ? 'Cukup baik—ulangi bagian yang masih salah.' : 'Pelajari kembali inti materi lalu coba lagi.') +
          "</p><div class=\"ak-quiz-actions\" style=\"justify-content:center;flex-wrap:wrap\">" +
          (wrong.length ? "<button class=\"ak-btn ak-btn-outline\" data-action=\"retry-wrong\">Ulangi yang Salah</button>" : '') +
          "<button class=\"ak-btn ak-btn-primary\" data-action=\"restart-quiz\">Ulangi Semua</button></div></div></div>";
        return;
    }

    var qi = qz.sequence[qz.position], q = m.quiz[qi], ans = qz.answers[qi];
    var feedback = '';
    if (ans) {
        var correctLetter = String.fromCharCode(65 + q.answer);
        var selectedWhy = q.optionWhy && q.optionWhy[ans.choice] ? q.optionWhy[ans.choice] : '';
        var allOptions = q.optionWhy ? "<details class=\"ak-option-review\"><summary>Telaah semua pilihan</summary><ol>" +
          q.options.map(function(opt,n){ return "<li class=\"" + (n===q.answer?'is-correct':'') + "\"><strong>" + String.fromCharCode(65+n) + ". " + esc(opt) + "</strong><span>" + esc(q.optionWhy[n] || '') + "</span></li>"; }).join('') +
          "</ol></details>" : '';
        feedback = "<div class=\"ak-feedback " + (ans.correct ? 'good' : 'bad') + "\"><strong>" + (ans.correct ? 'Tepat' : 'Belum tepat') + "</strong>" +
          "<p><b>Jawaban paling tepat: " + correctLetter + ".</b> " + esc(q.why) + "</p>" +
          (!ans.correct && selectedWhy ? "<p><b>Mengapa pilihan Anda kurang tepat:</b> " + esc(selectedWhy) + "</p>" : '') +
          allOptions + "</div><div class=\"ak-quiz-actions\"><button class=\"ak-btn ak-btn-primary\" data-action=\"next-quiz\">" +
          (qz.position === qz.sequence.length - 1 ? 'Lihat Hasil' : 'Soal Berikutnya') + " " + ICONS.next + "</button></div>";
    }

    $('#panel-quiz').innerHTML = "<div class=\"ak-quiz\"><div class=\"ak-quiz-card\"><div class=\"ak-quiz-progress\"><span style=\"width:" + ((qz.position+1)/qz.sequence.length*100) + "%\"></span></div><div class=\"ak-quiz-label\">Soal " + (qz.position+1) + " dari " + qz.sequence.length + "</div><h2>" + esc(q.q) + "</h2><div class=\"ak-options\">" +
      q.options.map(function(x,n){ return "<button class=\"ak-option " + (ans ? (n===q.answer?'correct':(n===ans.choice?'wrong':'')) : '') + "\" " + (ans?'disabled':'') + " data-action=\"answer-quiz\" data-question=\"" + qi + "\" data-choice=\"" + n + "\"><span class=\"ak-option-letter\">" + String.fromCharCode(65+n) + "</span><span>" + esc(x) + "</span></button>"; }).join('') +
      "</div>" + feedback + "</div></div>";
}
function answerQuiz(qi, choice) { var q = MODULES[currentModule].quiz[qi]; quizRuntime.answers[qi] = { choice: choice, correct: choice === q.answer }; renderQuiz(false); }
function nextQuiz() { if (quizRuntime.position < quizRuntime.sequence.length - 1) {
    quizRuntime.position++;
    state.lastQuiz[currentModule] = quizRuntime.position;
    saveState();
    renderQuiz(false);
}
else {
    quizRuntime.finished = true;
    state.lastQuiz[currentModule] = 0;
    saveState();
    renderQuiz(false);
} }
function restartQuiz() { state.lastQuiz[currentModule] = 0; saveState(); quizRuntime = null; renderQuiz(true); }
function retryWrong() { var wrong = quizRuntime.sequence.filter(function (i) { var _a; return !((_a = quizRuntime.answers[i]) === null || _a === void 0 ? void 0 : _a.correct); }); quizRuntime = { module: currentModule, sequence: wrong, position: 0, answers: {}, finished: false }; renderQuiz(false); }
function renderRefs() {
    if (!currentModule) return;
    var m = MODULES[currentModule];
    $('#panel-refs').innerHTML =
      "<div class=\"ak-section-head\"><div><h2>Referensi utama</h2><p>Sumber yang menjadi dasar ringkasan materi.</p></div></div><div class=\"ak-refs\">" +
      m.references.map(function(r){
        return r.url
          ? "<a class=\"ak-ref\" href=\"" + r.url + "\" target=\"_blank\" rel=\"noopener\"><div><strong>" + esc(r.title) + "</strong><small>" + esc(r.org) + "</small></div><span class=\"ak-ref-icon\">" + ICONS.external + "</span></a>"
          : "<div class=\"ak-ref\"><div><strong>" + esc(r.title) + "</strong><small>" + esc(r.org) + "</small></div></div>";
      }).join('') +
      "</div><div class=\"ak-disclaimer\">Portal ini adalah media pembelajaran internal dan bukan situs resmi rumah sakit. Pelaksanaan tetap mengikuti regulasi, pedoman, SPO, instrumen, kewenangan klinis, serta kebijakan yang berlaku di fasilitas.</div>";
}
function setFocusMode(on) {
    focusMode = !!on;
    document.body.classList.toggle('ak-focus-mode', focusMode);
    var exitButton = $('#focusExit');
    if (exitButton)
        exitButton.setAttribute('aria-hidden', focusMode ? 'false' : 'true');
    if (focusMode) {
        window.requestAnimationFrame(function () {
            var card = document.querySelector('.ak-slide-card');
            if (card)
                card.scrollIntoView({ block: 'start' });
        });
    }
    else
        showBottomNav();
}
function toggleFocusMode() {
    setFocusMode(!focusMode);
}
function showBottomNav() {
    var nav = $('#bottomNav');
    if (nav)
        nav.classList.remove('is-hidden');
}
function updateAdaptiveBottomNav() {
    scrollFramePending = false;
    var nav = $('#bottomNav');
    if (!nav)
        return;
    var mobile = window.matchMedia('(max-width: 820px)').matches;
    var moduleView = document.body.classList.contains('ak-is-module');
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    if (!mobile || !moduleView || focusMode) {
        nav.classList.remove('is-hidden');
        lastScrollY = y;
        return;
    }
    var delta = y - lastScrollY;
    if (y < 80 || delta < -12)
        nav.classList.remove('is-hidden');
    else if (y > 160 && delta > 18)
        nav.classList.add('is-hidden');
    lastScrollY = y;
}
function handlePortalScroll() {
    if (scrollFramePending)
        return;
    scrollFramePending = true;
    window.requestAnimationFrame(updateAdaptiveBottomNav);
}
function openSearch() { var o = $('#searchOverlay'); o.classList.add('open'); $('#searchInput').value = ''; renderSearchResults(''); setTimeout(function () { return $('#searchInput').focus(); }, 50); }
function closeSearch() { $('#searchOverlay').classList.remove('open'); }
function renderSearchResults(q) {
    q = q.trim().toLowerCase();
    var arr = MODULE_ORDER.map(function(id){ return MODULES[id]; });
    if (q) arr = arr.filter(function(m) {
        var deep = (m.summarySections || []).reduce(function(all,s){ return all.concat([s.title]).concat(s.points || []); }, []);
        return [m.title,m.short,m.desc,m.category].concat(m.keywords || []).concat(deep).join(' ').toLowerCase().indexOf(q) >= 0;
    });
    $('#searchResults').innerHTML = arr.length
      ? arr.map(function(m){ return "<button class=\"ak-search-item\" data-route=\"#/module/" + m.id + "\" data-action=\"search-result\">" + moduleIcon(m) + "<div><h4>" + esc(m.title) + "</h4><p>" + esc(m.desc) + "</p></div>" + ICONS.next + "</button>"; }).join('')
      : "<div class=\"ak-search-empty\">Materi tidak ditemukan.</div>";
}
function openLightbox(asset) {
    $('#lightboxImage').src = assetSrc(asset,'main');
    lightboxZoom = 1;
    $('#lightboxImage').style.transform = 'scale(1)';
    $('#lightbox').classList.add('open');
}
function closeLightbox() { $('#lightbox').classList.remove('open'); }
function zoomLightbox(delta) { lightboxZoom = Math.min(3, Math.max(.7, lightboxZoom + delta)); $('#lightboxImage').style.transform = "scale(".concat(lightboxZoom, ")"); }
function renderTemplate(t, m) {
    if (t && typeof t === 'object') {
        var slide = t;
        var cfg = slide.template || {};
        var items = cfg.items || [];
        var style = cfg.style || 'cards';
        var escColor = function(v){ return /^#[0-9A-Fa-f]{6}$/.test(v || '') ? v : '#0F766E'; };
        var item = function(x, i) {
            var marker = x.level || String(i + 1);
            var dot = x.color ? '<span class="ak-native-color" style="--item-color:' + escColor(x.color) + '"></span>' : '<span class="ak-native-marker">' + esc(marker) + '</span>';
            return '<article class="ak-native-item">' + dot + '<div><h3>' + esc(x.title || '') + '</h3><p>' + esc(x.text || '') + '</p></div></article>';
        };
        var cls = 'ak-native ak-native-' + style;
        var cols = Math.max(1, Math.min(5, Number(cfg.columns || 3)));
        var body = items.map(item).join('');
        var note = cfg.note ? '<div class="ak-native-note">' + ICONS.alert + '<span>' + esc(cfg.note) + '</span></div>' : '';
        return '<div class="' + cls + '" style="--native-cols:' + cols + '"><div class="ak-native-head"><span class="ak-native-kicker">' + esc(m.category || '') + '</span><h2>' + esc(slide.title || '') + '</h2><p>' + esc(slide.caption || '') + '</p></div><div class="ak-native-grid">' + body + '</div>' + note + '</div>';
    }
    var card = function (n, title, text) { return "<article class=\"ak-visual-card\"><div class=\"ak-step-badge\">".concat(n, "</div><h3>").concat(title, "</h3><p>").concat(text, "</p></article>"); };
    if (t === 'rights-full') {
        return "<div class=\"ak-full-material\"><div class=\"ak-full-head\"><h2>Hak Pasien</h2><p>Daftar lengkap yang digunakan dalam materi internal.</p></div><ol class=\"ak-full-list\">" +
          (m.rightsList || []).map(function(x){ return "<li><span>" + esc(x) + "</span></li>"; }).join('') +
          "</ol></div>";
    }
    if (t === 'duties-full') {
        return "<div class=\"ak-full-material\"><div class=\"ak-full-head\"><h2>Kewajiban Pasien</h2><p>Delapan kewajiban yang perlu dipahami dan dapat dijelaskan dengan bahasa sendiri.</p></div><ol class=\"ak-full-list ak-duty-list\">" +
          (m.dutiesList || []).map(function(x){ return "<li><span>" + esc(x) + "</span></li>"; }).join('') +
          "</ol></div>";
    }
    if (t === 'rights-practice') {
        return "<div class=\"ak-practice-box\"><div class=\"ak-step-badge\">5+5</div><h2>Latihan wawancara surveior</h2><p>Tanpa melihat daftar, sebutkan sedikitnya lima hak dan lima kewajiban pasien. Setelah itu buka bagian di bawah untuk memeriksa.</p><details><summary>Tampilkan contoh jawaban</summary><div class=\"ak-practice-columns\"><div><h3>Contoh 5 hak</h3><ol>" +
          (m.rightsList || []).slice(0,5).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join('') +
          "</ol></div><div><h3>Contoh 5 kewajiban</h3><ol>" +
          (m.dutiesList || []).slice(0,5).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join('') +
          "</ol></div></div></details></div>";
    }
    if (t === 'rights-overview')
        return "<h2 class=\"ak-visual-title\">Hak dihormati, kewajiban dipahami</h2><p class=\"ak-visual-sub\">Hubungan pelayanan yang aman dibangun melalui informasi, partisipasi, privasi, dan tanggung jawab bersama.</p><div class=\"ak-visual-grid\">".concat(card('H', 'Hak pasien', 'Mendapat informasi, privasi, penghormatan, dan kesempatan berpartisipasi.')).concat(card('K', 'Kewajiban pasien', 'Memberikan informasi jujur, mematuhi aturan, dan menghormati orang lain.')).concat(card('\u2713', 'Tujuan', 'Menciptakan pelayanan yang transparan, bermartabat, dan aman.'), "</div>");
    if (t === 'rights-info')
        return "<h2 class=\"ak-visual-title\">Informasi dan partisipasi</h2><div class=\"ak-visual-grid\">".concat(card('1', 'Informasi pelayanan', 'Mengetahui aturan, fasilitas, dan pelayanan yang tersedia.')).concat(card('2', 'Penjelasan klinis', 'Memahami kondisi, rencana, risiko, alternatif, dan tindak lanjut.')).concat(card('3', 'Terlibat dalam keputusan', 'Memberi persetujuan, menolak, dan menyampaikan preferensi.'), "</div>");
    if (t === 'rights-privacy')
        return "<h2 class=\"ak-visual-title\">Privasi, martabat, dan kesetaraan</h2><div class=\"ak-visual-grid\">".concat(card('1', 'Kerahasiaan', 'Informasi pasien hanya diberikan kepada pihak yang berhak.')).concat(card('2', 'Martabat', 'Tindakan dan komunikasi menjaga kehormatan serta kenyamanan pasien.')).concat(card('3', 'Tanpa diskriminasi', 'Pelayanan tidak dibedakan karena latar belakang atau status sosial.'), "</div>");
    if (t === 'rights-choice')
        return "<h2 class=\"ak-visual-title\">Pilihan dan pengaduan</h2><div class=\"ak-visual-grid\">".concat(card('1', 'Persetujuan', 'Pasien mendapat penjelasan sebelum mengambil keputusan.')).concat(card('2', 'Penolakan', 'Pasien dapat menolak setelah memahami konsekuensinya.')).concat(card('3', 'Keluhan', 'Keluhan diterima dan ditindaklanjuti tanpa mengurangi pelayanan.'), "</div>");
    if (t === 'rights-duty')
        return "<h2 class=\"ak-visual-title\">Kewajiban pasien</h2><div class=\"ak-visual-grid\">".concat(card('1', 'Informasi jujur', 'Sampaikan kondisi, alergi, obat, dan riwayat secara lengkap.')).concat(card('2', 'Ikuti kesepakatan', 'Patuhi rencana pelayanan yang telah disepakati atau sampaikan hambatan.')).concat(card('3', 'Hormati lingkungan', 'Patuhi aturan fasilitas dan hak pasien, keluarga, serta petugas lain.'), "</div>");
    if (t === 'comm-why')
        return "<h2 class=\"ak-visual-title\">Mengapa komunikasi harus terstandar?</h2><div class=\"ak-visual-grid\">".concat(card('1', 'Akurasi', 'Pesan yang diterima harus sama dengan pesan yang disampaikan.')).concat(card('2', 'Keselamatan', 'Informasi lengkap mengurangi risiko keterlambatan dan salah tindakan.')).concat(card('3', 'Akuntabilitas', 'Komunikasi dan tindak lanjut dicatat untuk menjaga kesinambungan pelayanan.'), "</div>");
    if (t === 'comm-sbar')
        return "<h2 class=\"ak-visual-title\">SBAR</h2><p class=\"ak-visual-sub\">Struktur singkat untuk menyampaikan kondisi pasien yang memerlukan perhatian atau tindakan.</p><div class=\"ak-sbar\"><div class=\"ak-sbar-card\"><div class=\"ak-sbar-letter\">S</div><h3>Situation</h3><p>Apa yang terjadi sekarang dan mengapa perlu dilaporkan?</p></div><div class=\"ak-sbar-card\"><div class=\"ak-sbar-letter\">B</div><h3>Background</h3><p>Apa latar klinis yang relevan?</p></div><div class=\"ak-sbar-card\"><div class=\"ak-sbar-letter\">A</div><h3>Assessment</h3><p>Apa temuan, tren, skor, dan kekhawatiran klinis?</p></div><div class=\"ak-sbar-card\"><div class=\"ak-sbar-letter\">R</div><h3>Recommendation</h3><p>Respons atau tindak lanjut apa yang dibutuhkan?</p></div></div>";
    if (t === 'comm-scenario')
        return "<h2 class=\"ak-visual-title\">Contoh SBAR \u00B7 Penurunan Kesadaran</h2><div class=\"ak-dialogue\"><div class=\"ak-bubble\"><b>S \u00B7 Situation</b>\u201CDok, saya perawat dari bangsal saraf. Tn. A mengalami penurunan kesadaran tiba-tiba.\u201D</div><div class=\"ak-bubble right\"><b>B \u00B7 Background</b>\u201CPasien dirawat dengan stroke infark sejak dua hari lalu. Sebelumnya GCS 15.\u201D</div><div class=\"ak-bubble\"><b>A \u00B7 Assessment</b>\u201CSaat ini GCS 10, tekanan darah 200/110 mmHg, nadi 55 kali/menit, dan kelemahan sisi kanan memberat.\u201D</div><div class=\"ak-bubble right\"><b>R \u00B7 Recommendation</b>\u201CMohon evaluasi segera di ruangan dan arahan tindak lanjut.\u201D</div></div>";
    if (t === 'comm-tbak')
        return "<h2 class=\"ak-visual-title\">TBaK \u00B7 Instruksi Verbal/Telepon</h2><div class=\"ak-cycle\"><div class=\"ak-cycle-item\"><div class=\"ak-step-badge\">1</div><b>Tulis</b><p>Catat nama obat, dosis, rute, waktu, dan instruksi lengkap.</p></div><div class=\"ak-cycle-arrow\">\u2192</div><div class=\"ak-cycle-item\"><div class=\"ak-step-badge\">2</div><b>Baca Kembali</b><p>Bacakan ulang secara jelas; eja bila nama sulit atau mirip.</p></div><div class=\"ak-cycle-arrow\">\u2192</div><div class=\"ak-cycle-item\"><div class=\"ak-step-badge\">3</div><b>Konfirmasi</b><p>Pemberi instruksi menyatakan pesan sudah benar.</p></div><div class=\"ak-cycle-arrow\">\u2192</div><div class=\"ak-cycle-item\"><div class=\"ak-step-badge\">4</div><b>Dokumentasikan</b><p>Catat komunikasi dan tindak lanjut sesuai ketentuan.</p></div></div>";
    if (t === 'comm-teachback')
        return "<h2 class=\"ak-visual-title\">Teach-Back</h2><p class=\"ak-visual-sub\">Bukan ujian untuk pasien\u2014metode ini menilai apakah petugas sudah menjelaskan dengan cukup jelas.</p><div class=\"ak-cycle\"><div class=\"ak-cycle-item\"><b>Jelaskan singkat</b><p>Gunakan bahasa sederhana dan fokus pada tindakan penting.</p></div><div class=\"ak-cycle-arrow\">\u2192</div><div class=\"ak-cycle-item\"><b>Minta jelaskan kembali</b><p>\u201CBoleh Ibu ceritakan kembali tanda bahaya yang perlu diperhatikan?\u201D</p></div><div class=\"ak-cycle-arrow\">\u2192</div><div class=\"ak-cycle-item\"><b>Dengarkan</b><p>Nilai bagian yang sudah benar dan yang masih salah.</p></div><div class=\"ak-cycle-arrow\">\u2192</div><div class=\"ak-cycle-item\"><b>Jelaskan ulang</b><p>Perbaiki informasi lalu lakukan teach-back kembali.</p></div></div>";
    if (t === 'ews-overview')
        return "<h2 class=\"ak-visual-title\">Apa itu EWS?</h2><p class=\"ak-visual-sub\">Sistem penilaian berbasis skor yang menggunakan tanda vital untuk mendeteksi perburukan klinis lebih dini.</p><div class=\"ak-visual-grid\">".concat(card('1', 'Deteksi dini', 'Mengenali perubahan sebelum menjadi keadaan gawat.')).concat(card('2', 'Respons cepat', 'Mendorong asesmen, eskalasi, dan tindakan yang tepat waktu.')).concat(card('3', 'Pantau tren', 'Membandingkan kondisi dari waktu ke waktu, bukan satu angka saja.'), "</div>");
    if (t === 'ews-population')
        return "<h2 class=\"ak-visual-title\">Tiga sistem berdasarkan pasien</h2><div class=\"ak-pop-grid\"><div class=\"ak-pop-card\"><h3>NEWS2</h3><p>Untuk pasien dewasa. Tidak digunakan sebagai sistem anak atau obstetri.</p></div><div class=\"ak-pop-card\"><h3>PEWS</h3><p>Untuk pasien anak; rentang dan indikator menyesuaikan usia serta perkembangan.</p></div><div class=\"ak-pop-card\"><h3>MEOWS</h3><p>Untuk kehamilan dan nifas; mempertimbangkan fisiologi serta tanda bahaya obstetri.</p></div></div>";
    if (t === 'ews-news')
        return "<h2 class=\"ak-visual-title\">NEWS2 \u00B7 Parameter Dewasa</h2><div class=\"ak-visual-grid\">".concat(['Frekuensi napas', 'Saturasi oksigen', 'Oksigen tambahan', 'Tekanan darah sistolik', 'Denyut nadi', 'Suhu tubuh', 'Kesadaran / kebingungan baru'].map(function (x, i) { return card(i + 1, x, 'Nilai dan catat secara akurat sesuai chart NEWS2.'); }).join(''), "</div>");
    if (t === 'ews-news-table')
        return "<h2 class=\"ak-visual-title\">Tabel NEWS2 \u00B7 Skala SpO\u2082 1</h2><div class=\"ak-table-wrap\"><table class=\"ak-table\"><thead><tr><th>Parameter</th><th>Skor 3</th><th>Skor 2</th><th>Skor 1</th><th>Skor 0</th><th>Skor 1</th><th>Skor 2</th><th>Skor 3</th></tr></thead><tbody><tr><td>Pernapasan /mnt</td><td class=\"score3\">\u22648</td><td></td><td class=\"score1\">9\u201311</td><td class=\"score0\">12\u201320</td><td></td><td class=\"score2\">21\u201324</td><td class=\"score3\">\u226525</td></tr><tr><td>SpO\u2082 Skala 1</td><td class=\"score3\">\u226491</td><td class=\"score2\">92\u201393</td><td class=\"score1\">94\u201395</td><td class=\"score0\">\u226596</td><td></td><td></td><td></td></tr><tr><td>Suhu \u00B0C</td><td class=\"score3\">\u226435.0</td><td></td><td class=\"score1\">35.1\u201336.0</td><td class=\"score0\">36.1\u201338.0</td><td class=\"score1\">38.1\u201339.0</td><td class=\"score2\">\u226539.1</td><td></td></tr><tr><td>Sistolik mmHg</td><td class=\"score3\">\u226490</td><td class=\"score2\">91\u2013100</td><td class=\"score1\">101\u2013110</td><td class=\"score0\">111\u2013219</td><td></td><td></td><td class=\"score3\">\u2265220</td></tr><tr><td>Nadi /mnt</td><td class=\"score3\">\u226440</td><td></td><td class=\"score1\">41\u201350</td><td class=\"score0\">51\u201390</td><td class=\"score1\">91\u2013110</td><td class=\"score2\">111\u2013130</td><td class=\"score3\">\u2265131</td></tr><tr><td>Kesadaran</td><td></td><td></td><td></td><td class=\"score0\">A</td><td></td><td></td><td class=\"score3\">V/P/U atau kebingungan baru</td></tr><tr><td>Oksigen tambahan</td><td></td><td class=\"score2\">Ya</td><td></td><td class=\"score0\">Tidak</td><td></td><td></td><td></td></tr></tbody></table></div><p class=\"ak-visual-sub\" style=\"margin-top:12px\">Pasien dengan target saturasi khusus menggunakan skala SpO\u2082 yang sesuai chart dan keputusan klinis.</p>";
    if (t === 'ews-pews')
        return "<h2 class=\"ak-visual-title\">PEWS \u00B7 Fokus B\u2013C\u2013R</h2><div class=\"ak-pop-grid\"><div class=\"ak-pop-card\"><h3>Behavior</h3><p>Kesadaran, interaksi, kerewelan, kemampuan ditenangkan, atau letargi.</p></div><div class=\"ak-pop-card\"><h3>Cardiovascular</h3><p>Warna kulit, pengisian kapiler, dan perubahan denyut nadi sesuai usia.</p></div><div class=\"ak-pop-card\"><h3>Respiratory</h3><p>Frekuensi napas, retraksi, kerja napas, dan kebutuhan oksigen.</p></div></div><div class=\"ak-notice\" style=\"margin-top:16px\">".concat(ICONS.alert, "<span>Rentang normal tanda vital anak berubah menurut usia. Gunakan chart PEWS yang ditetapkan fasilitas.</span></div>");
    if (t === 'ews-meows')
        return "<h2 class=\"ak-visual-title\">MEOWS \u00B7 Kehamilan dan Nifas</h2><div class=\"ak-visual-grid\">".concat(card('1', 'Tanda vital', 'Tekanan darah, nadi, frekuensi napas, suhu, dan kesadaran.')).concat(card('2', 'Tanda obstetri', 'Perdarahan, cairan, nyeri tidak normal, serta keluhan terkait kehamilan/nifas.')).concat(card('3', 'Sistem pemicu', 'Materi internal menggunakan satu parameter merah atau dua parameter kuning sebagai tanda perhatian segera.'), "</div>");
    if (t === 'ews-response')
        return "<h2 class=\"ak-visual-title\">Respons dan eskalasi</h2><div class=\"ak-trigger-grid\"><div class=\"ak-trigger\"><strong>1</strong><p>Ukur dan validasi hasil.</p></div><div class=\"ak-trigger\"><strong>2</strong><p>Hitung skor dengan instrumen sesuai populasi.</p></div><div class=\"ak-trigger\"><strong>3</strong><p>Lihat tren dan lakukan respons awal.</p></div><div class=\"ak-trigger\"><strong>4</strong><p>Eskalasi, reassessment, dan dokumentasikan tindak lanjut.</p></div></div><div class=\"ak-notice\" style=\"margin-top:16px\">".concat(ICONS.alert, "<span>Threshold NEWS2 tidak otomatis berlaku untuk PEWS atau MEOWS. Gunakan response chart masing-masing dan eskalasi bila ada kekhawatiran klinis.</span></div>");
    return '';
}
function handlePortalClick(event) {
    var el = event.target.closest('[data-action],[data-route]');
    if (!el || el.disabled)
        return;
    var action = el.dataset.action || '';
    if (action) {
        event.preventDefault();
        event.stopPropagation();
        switch (action) {
            case 'open-askep':
                window.open(ASKEP_URL, '_blank', 'noopener,noreferrer');
                return;
            case 'open-search':
                openSearch();
                return;
            case 'toggle-focus':
                toggleFocusMode();
                return;
            case 'close-search':
                closeSearch();
                return;
            case 'close-lightbox':
                closeLightbox();
                return;
            case 'zoom-lightbox':
                zoomLightbox(Number(el.dataset.delta || 0));
                return;
            case 'toggle-fav':
                toggleFav(String(el.dataset.module || ''), event);
                return;
            case 'back':
                history.length > 1 ? history.back() : setRoute('#/library');
                return;
            case 'switch-tab':
                switchTab(String(el.dataset.tab || 'learn'));
                return;
            case 'set-slide':
                setSlide(Number(el.dataset.index || 0));
                return;
            case 'open-lightbox':
                openLightbox(String(el.dataset.asset || ''));
                return;
            case 'answer-quiz':
                answerQuiz(Number(el.dataset.question), Number(el.dataset.choice));
                return;
            case 'next-quiz':
                nextQuiz();
                return;
            case 'restart-quiz':
                restartQuiz();
                return;
            case 'retry-wrong':
                retryWrong();
                return;
            case 'search-result':
                closeSearch();
                if (el.dataset.route)
                    setRoute(el.dataset.route);
                return;
        }
    }
    if (el.dataset.route) {
        event.preventDefault();
        setRoute(el.dataset.route);
    }
}
function showBootstrapError(err) {
    var main = $('#mainContent');
    if (main)
        main.innerHTML = '<div class="ak-runtime-error"><h2>Portal belum dapat dimuat</h2><p>Data portal gagal dimuat. Pastikan seluruh file GitHub Pages telah diunggah lengkap.</p><code>' + esc(err && err.message ? err.message : String(err)) + '</code></div>';
}
function bootPortal(data) {
    try {
        ASKEP_URL = data.askepUrl || 'https://sites.google.com/view/standar-askep/home';
        ICONS = data.icons || {};
        MODULES = data.modules || {};
        MODULE_ORDER = data.moduleOrder || [];
        document.addEventListener('click', handlePortalClick);
        $('#searchInput').addEventListener('input', function (e) { renderSearchResults(e.target.value); });
        $('#searchOverlay').addEventListener('click', function (e) { if (e.target.id === 'searchOverlay')
            closeSearch(); });
        $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox')
            closeLightbox(); });
        window.addEventListener('hashchange', route);
        window.addEventListener('scroll', handlePortalScroll, { passive: true });
        window.addEventListener('resize', function () { showBottomNav(); updateAdaptiveBottomNav(); });
        window.addEventListener('keydown', function (e) { if (e.key === 'Escape') {
            if (focusMode)
                setFocusMode(false);
            else {
                closeSearch();
                closeLightbox();
            }
        } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openSearch();
        } });
        route();
    }
    catch (err) {
        showBootstrapError(err);
    }
}
async function fetchJson(url) {
    var response = await fetch(url, { cache: 'no-store' });
    if (!response.ok)
        throw new Error('Gagal membaca ' + url + ' (' + response.status + ')');
    return response.json();
}
async function startPortal() {
    try {
        var index = await fetchJson('assets/data/modules.json');
        var loaded = await Promise.all(index.moduleOrder.map(function(id) {
            var file = index.modules[id].file || ('content/' + id + '.json');
            return fetchJson(file);
        }));
        var loadedModules = {};
        var loadedAssets = {};
        loaded.forEach(function(module) {
            module.slides = (module.slides || []).slice().sort(function(a,b) {
                return Number(a.order || 999) - Number(b.order || 999);
            });
            loadedModules[module.id] = module;
            (module.slides || []).forEach(function(slide) {
                if (slide.type === 'image' && slide.asset && slide.image) {
                    loadedAssets[slide.asset] = {
                        main: slide.image,
                        thumb: slide.thumbnail || slide.image,
                        version: slide.version || 1
                    };
                }
            });
        });
        ASSETS = loadedAssets;
        bootPortal({
            askepUrl: index.askepUrl,
            icons: index.icons,
            modules: loadedModules,
            moduleOrder: index.moduleOrder
        });
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('./sw.js').catch(function() {});
            }, { once: true });
        }
    }
    catch (err) {
        showBootstrapError(err);
    }
}
if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', startPortal, { once: true });
else
    startPortal();