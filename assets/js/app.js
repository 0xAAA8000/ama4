(function () {
  'use strict';

  var HAM = window.HAM;

  /* ---------- カテゴリ定義 ---------- */
  var CATS = [
    { key: 'law1', group: 'law', name: '無線局の免許', icon: '📜', desc: '免許・再免許・変更手続き' },
    { key: 'law2', group: 'law', name: '無線設備', icon: '📡', desc: '電波の質・型式・周波数の許容値' },
    { key: 'law3', group: 'law', name: '無線従事者', icon: '🪪', desc: '操作範囲・免許証・欠格事由' },
    { key: 'law4', group: 'law', name: '運用', icon: '🎙️', desc: '呼出し・応答・非常通信・混信' },
    { key: 'law5', group: 'law', name: '監督', icon: '⚖️', desc: '電波の発射停止・検査・罰則' },
    { key: 'law6', group: 'law', name: '業務書類', icon: '🗂️', desc: '免許状の掲示・訂正・返納' },
    { key: 'tech1', group: 'tech', name: '基礎', icon: '⚡', desc: '電気の単位・オームの法則・交流' },
    { key: 'tech2', group: 'tech', name: '電子回路', icon: '🔌', desc: 'ダイオード・トランジスタ・増幅' },
    { key: 'tech3', group: 'tech', name: '送信機', icon: '📻', desc: '変調方式・逓倍・FM/SSB送信機' },
    { key: 'tech4', group: 'tech', name: '受信機', icon: '🎧', desc: 'スーパーヘテロダイン・感度・選択度' },
    { key: 'tech5', group: 'tech', name: '電波障害', icon: '📺', desc: 'TVI・BCI・高調波・対策' },
    { key: 'tech6', group: 'tech', name: '電源', icon: '🔋', desc: '整流・平滑・電池の接続' },
    { key: 'tech7', group: 'tech', name: 'アンテナ', icon: '🗼', desc: 'ダイポール・八木・給電線' },
    { key: 'tech8', group: 'tech', name: '電波伝搬', icon: '🌐', desc: '電離層・スポラジックE・見通し' },
    { key: 'tech9', group: 'tech', name: '測定法', icon: '📏', desc: 'テスタ・計器の接続・SWR' }
  ];
  var CAT = {};
  CATS.forEach(function (c) { CAT[c.key] = c; });

  // 模擬試験の出題配分(原典サイトの模試に準拠)
  var EXAM = {
    law: { title: '模擬試験 - 法規', dist: { law1: 2, law2: 1, law3: 1, law4: 5, law5: 2, law6: 1 } },
    tech: { title: '模擬試験 - 無線工学', dist: { tech1: 1, tech2: 1, tech3: 2, tech4: 2, tech5: 2, tech6: 1, tech7: 1, tech8: 1, tech9: 1 } }
  };
  var PASS_LINE = 8; // 12問中8問(40点/60点)

  /* ---------- 便利関数 ---------- */
  var $main = document.getElementById('main');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function stripTags(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function questions(key) { return (HAM.cats[key] && HAM.cats[key].questions) || []; }
  var UID_CAT = {};
  Object.keys(HAM.cats).forEach(function (k) {
    HAM.cats[k].questions.forEach(function (q) { UID_CAT[q.uid] = k; });
  });
  function findQ(key, uid) {
    var qs = questions(key);
    for (var i = 0; i < qs.length; i++) if (qs[i].uid === uid) return qs[i];
    return null;
  }

  /* ---------- 学習記録(localStorage) ---------- */
  var STORE_KEY = 'ham4.progress.v1';
  var progress = {};
  try { progress = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { progress = {}; }

  function recKey(cat, uid) { return cat + '/' + uid; }
  function record(cat, uid, ok) {
    var k = recKey(cat, uid);
    var r = progress[k] || { a: 0, c: 0 };
    r.a++; if (ok) r.c++;
    r.last = ok ? 1 : 0;
    r.t = Date.now();
    progress[k] = r;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) { /* 保存できなくても学習は続行 */ }
  }
  function catStats(key) {
    var qs = questions(key), done = 0, mastered = 0, wrong = 0;
    qs.forEach(function (q) {
      var r = progress[recKey(key, q.uid)];
      if (!r) return;
      done++;
      if (r.last) mastered++; else wrong++;
    });
    return { total: qs.length, done: done, mastered: mastered, wrong: wrong };
  }
  function wrongItems() {
    var out = [];
    CATS.forEach(function (c) {
      questions(c.key).forEach(function (q) {
        var r = progress[recKey(c.key, q.uid)];
        if (r && !r.last) out.push({ cat: c.key, q: q });
      });
    });
    return out;
  }

  /* ---------- 解説の描画 ---------- */
  function explanationHTML(cat, q) {
    var ex = HAM.exps[cat] || {};
    var item = (ex.items && ex.items[q.uid]) || null;
    var correct = q.options[0];
    var html = '<div class="explain">';
    if (!item) {
      html += '<div class="ex-block"><h4>解説</h4><div class="rich"><p>正解は「' + correct + '」です。</p></div></div></div>';
      return html;
    }
    if (item.point) {
      html += '<div class="ex-block ex-point"><h4>ポイント</h4><p class="point">' + item.point + '</p></div>';
    }
    if (item.exp) {
      html += '<div class="ex-block"><h4>解説</h4><div class="rich">' + item.exp + '</div></div>';
    }
    var tps = (item.topics || []).map(function (k) { return ex.topics && ex.topics[k]; }).filter(Boolean);
    if (tps.length) {
      html += '<div class="ex-block ex-principle"><h4>原理・背景 ― なぜそうなるのか</h4>';
      tps.forEach(function (t, i) {
        html += '<details' + (i === 0 ? ' open' : '') + '><summary>' + t.title + '</summary><div class="rich">' + t.body + '</div></details>';
      });
      html += '</div>';
    }
    return html + '</div>';
  }

  function tagFor(cat) {
    var c = CAT[cat];
    return '<span class="tag ' + c.group + '">' + (c.group === 'law' ? '法規' : '無線工学') + '・' + esc(c.name) + '</span>';
  }

  /* ---------- 画面: ホーム ---------- */
  function renderHome() {
    var total = 0, mastered = 0, done = 0;
    CATS.forEach(function (c) {
      var s = catStats(c.key);
      total += s.total; mastered += s.mastered; done += s.done;
    });
    var wrong = wrongItems().length;

    var html = '' +
      '<section class="hero">' +
        '<div class="hero__eyebrow">第4級アマチュア無線技士 国家試験</div>' +
        '<h1>過去問を、原理から理解する。</h1>' +
        '<p>問題文と選択肢は過去問の原文のまま。正解の理由だけでなく、「なぜそうなるのか」という法律の趣旨や電気・電波の原理まで解説します。丸暗記ではなく、腑に落ちる学習を。</p>' +
        '<div class="hero__stats">' +
          '<div class="stat"><b>' + total + '</b><span>収録問題</span></div>' +
          '<div class="stat"><b>' + done + '</b><span>解いた問題</span></div>' +
          '<div class="stat"><b>' + (total ? Math.round(mastered / total * 100) : 0) + '%</b><span>直近で正解</span></div>' +
          '<div class="stat"><b>' + wrong + '</b><span>要復習</span></div>' +
        '</div>' +
      '</section>';

    html += '<h2 class="section-title"><span class="dot"></span>模擬試験</h2><div class="grid">' +
      examCard('law', '法規 12問', '本番と同じ分野配分でランダム出題。解き終わってから採点し、全問の解説を確認できます。') +
      examCard('tech', '無線工学 12問', '計算・回路図を含む12問。合格基準は 12問中 8問以上(60点満点中 40点)。') +
      '<div class="card exam-card"><span class="tag">苦手克服</span><h3>復習モード</h3>' +
        '<p>直近で間違えた問題だけを集中して解き直します。正解すると復習リストから外れます。</p>' +
        '<div><a class="btn' + (wrong ? ' primary' : '') + '" href="#/review">復習リスト(' + wrong + '問)</a></div></div>' +
      '</div>';

    var sheetCards = 0, sheetRows = 0;
    (HAM.cheatsheet || []).forEach(function (g) {
      g.cards.forEach(function (c) { sheetCards++; sheetRows += c.rows.length; });
    });
    html += '<a class="card sheet-banner" href="#/cheatsheet"><span class="sheet-banner__icon" aria-hidden="true">🧭</span>' +
      '<span><b>チートシートで効率よく覚える</b><small>似た問題を ' + sheetRows + ' の「問われ方 → 答え」に集約(' + sheetCards + 'テーマ)。1行覚えれば複数問に対応できます。</small></span>' +
      '<span class="sheet-banner__go" aria-hidden="true">→</span></a>';

    html += catSection('law', '法規');
    html += catSection('tech', '無線工学');

    html += '<h2 class="section-title"><span class="dot"></span>このサイトの使い方</h2><div class="how">' +
      howCard('01', '10問で腕試し', '分野を選んでランダム10問。答えるとすぐに正誤と解説が表示されます。') +
      howCard('02', '解説と原理を読む', '「ポイント」で結論、「解説」で選択肢の見分け方、「原理・背景」で仕組みを理解。') +
      howCard('03', '一覧で総復習', '「一覧」では分野の全問題を正解・解説つきで読めます。試験直前の確認に。') +
      howCard('04', '模試で仕上げ', '本番形式の12問で実力チェック。8問正解で合格ラインです。') +
      '</div>';

    $main.innerHTML = html;
  }

  function examCard(kind, title, text) {
    return '<div class="card exam-card"><span class="tag ' + kind + '">' + (kind === 'law' ? '法規' : '無線工学') + '</span>' +
      '<h3>模擬試験 ' + esc(title) + '</h3><p>' + esc(text) + '</p>' +
      '<div><a class="btn primary" href="#/exam/' + kind + '">はじめる</a></div></div>';
  }
  function howCard(n, t, p) {
    return '<div class="card"><div class="num">' + n + '</div><h3>' + esc(t) + '</h3><p>' + esc(p) + '</p></div>';
  }
  function catSection(group, label) {
    var html = '<h2 class="section-title ' + group + '"><span class="dot"></span>' + label + '</h2><div class="grid">';
    CATS.filter(function (c) { return c.group === group; }).forEach(function (c) {
      var s = catStats(c.key);
      var pct = s.total ? Math.round(s.mastered / s.total * 100) : 0;
      html += '<div class="card cat-card ' + group + '">' +
        '<div class="cat-card__head"><div class="cat-card__icon" aria-hidden="true">' + c.icon + '</div>' +
        '<div><h3>' + esc(c.name) + '</h3><small>' + esc(c.desc) + ' ・ ' + s.total + '問</small></div></div>' +
        '<div><div class="meter-label"><span>習得 ' + s.mastered + '/' + s.total + '</span><span>' + pct + '%</span></div>' +
        '<div class="meter"><i style="width:' + pct + '%"></i></div></div>' +
        '<div class="cat-card__actions">' +
          '<a class="btn primary small" href="#/quiz/' + c.key + '?n=10">10問</a>' +
          '<a class="btn small" href="#/quiz/' + c.key + '">全問</a>' +
          '<a class="btn ghost small" href="#/study/' + c.key + '">一覧で学ぶ</a>' +
        '</div></div>';
    });
    return html + '</div>';
  }

  /* ---------- クイズ(練習・模試・復習 共通) ---------- */
  var session = null;

  function makeItem(cat, q) {
    return { cat: cat, q: q, order: shuffle(range(q.options.length)), pick: null };
  }

  function startPractice(cat, n) {
    var qs = shuffle(questions(cat).slice());
    if (n) qs = qs.slice(0, n);
    session = {
      mode: 'practice', title: (CAT[cat].group === 'law' ? '法規' : '無線工学') + ' ・ ' + CAT[cat].name,
      back: '#/', items: qs.map(function (q) { return makeItem(cat, q); }), idx: 0
    };
    renderQuestion();
  }

  function startList(title, back, refs) {
    var items = shuffle(refs.slice()).map(function (r) { return makeItem(r.cat, r.q); });
    if (!items.length) { location.hash = back; return; }
    session = { mode: 'practice', title: title, back: back, items: items, idx: 0 };
    renderQuestion();
  }

  function startExam(kind) {
    var def = EXAM[kind];
    var items = [];
    Object.keys(def.dist).forEach(function (cat) {
      shuffle(questions(cat).slice()).slice(0, def.dist[cat]).forEach(function (q) { items.push(makeItem(cat, q)); });
    });
    session = { mode: 'exam', kind: kind, title: def.title, back: '#/', items: items, idx: 0 };
    renderQuestion();
  }

  function startReview() {
    var items = shuffle(wrongItems()).map(function (w) { return makeItem(w.cat, w.q); });
    if (!items.length) { location.hash = '#/review'; return; }
    session = { mode: 'practice', title: '復習モード', back: '#/review', items: items, idx: 0 };
    renderQuestion();
  }

  function renderQuestion() {
    var s = session, it = s.items[s.idx], q = it.q;
    var n = s.items.length;
    var keys = ['1', '2', '3', '4', '5', '6'];
    var opts = it.order.map(function (oi, pos) {
      return '<li><button class="opt" type="button" data-oi="' + oi + '"><span class="opt__key">' + keys[pos] + '</span>' +
        '<span class="opt__body">' + q.options[oi] + '</span></button></li>';
    }).join('');

    var html = '<div class="narrow">' +
      '<div class="quiz-head"><a class="back" href="' + s.back + '" aria-label="戻る">←</a><h1>' + esc(s.title) + '</h1>' +
      '<span class="count">' + (s.idx + 1) + ' / ' + n + '</span></div>' +
      '<div class="progress"><i style="width:' + ((s.idx + (it.pick !== null ? 1 : 0)) / n * 100) + '%"></i></div>' +
      '<article class="card qcard">' +
        '<div class="qmeta">' + tagFor(it.cat) + '<span class="tag mono">' + esc(q.id) + '</span></div>' +
        '<div class="qtext">' + q.q + '</div>' +
        '<ol class="options">' + opts + '</ol>' +
        '<div id="feedback"></div>' +
        '<div class="quiz-actions" id="actions"></div>' +
      '</article>' +
      '<p class="kbd-hint"><kbd>1</kbd>〜<kbd>4</kbd> で選択 ・ <kbd>Enter</kbd> で次へ</p>' +
      '</div>';
    $main.innerHTML = html;
    window.scrollTo(0, 0);

    var btns = $main.querySelectorAll('.opt');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () { choose(parseInt(b.getAttribute('data-oi'), 10)); });
    });
    if (it.pick !== null) applyPick(false);
    else if (s.mode === 'exam') renderExamActions();
  }

  function choose(oi) {
    var s = session, it = s.items[s.idx];
    if (s.mode === 'practice') {
      if (it.pick !== null) return;
      it.pick = oi;
      record(it.cat, it.q.uid, oi === 0);
      applyPick(true);
    } else {
      it.pick = oi;
      applyPick(false);
    }
  }

  function applyPick(fresh) {
    var s = session, it = s.items[s.idx];
    var btns = $main.querySelectorAll('.opt');
    var fb = document.getElementById('feedback');

    if (s.mode === 'exam') {
      Array.prototype.forEach.call(btns, function (b) {
        b.classList.toggle('is-picked', parseInt(b.getAttribute('data-oi'), 10) === it.pick);
      });
      $main.querySelector('.progress > i').style.width = ((s.idx + 1) / s.items.length * 100) + '%';
      renderExamActions();
      return;
    }

    var ok = it.pick === 0;
    Array.prototype.forEach.call(btns, function (b) {
      var oi = parseInt(b.getAttribute('data-oi'), 10);
      b.disabled = true;
      if (oi === 0) b.classList.add('is-correct');
      else if (oi === it.pick) b.classList.add('is-wrong');
      else b.classList.add('is-dim');
    });
    $main.querySelector('.progress > i').style.width = ((s.idx + 1) / s.items.length * 100) + '%';
    fb.innerHTML = '<div class="verdict ' + (ok ? 'ok' : 'ng') + '" role="status">' +
      (ok ? '◎ 正解' : '× 不正解') +
      (ok ? '' : '<span class="answer">正解: ' + stripTags(it.q.options[0]) + '</span>') + '</div>' +
      explanationHTML(it.cat, it.q);

    var last = s.idx === s.items.length - 1;
    document.getElementById('actions').innerHTML =
      '<button class="btn primary" type="button" id="next">' + (last ? '結果を見る' : '次の問題へ →') + '</button>';
    document.getElementById('next').addEventListener('click', next);
    if (fresh) {
      var v = fb.querySelector('.verdict');
      if (v && v.getBoundingClientRect().top > window.innerHeight * 0.7) v.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderExamActions() {
    var s = session, it = s.items[s.idx];
    var last = s.idx === s.items.length - 1;
    var answered = s.items.filter(function (x) { return x.pick !== null; }).length;
    var html = '';
    if (s.idx > 0) html += '<button class="btn ghost" type="button" id="prev">← 前へ</button>';
    if (last) {
      html += '<button class="btn primary" type="button" id="next">採点する(' + answered + '/' + s.items.length + ' 回答済)</button>';
    } else {
      html += '<button class="btn' + (it.pick !== null ? ' primary' : '') + '" type="button" id="next">' +
        (it.pick !== null ? '次へ →' : 'スキップ →') + '</button>';
    }
    document.getElementById('actions').innerHTML = html;
    var p = document.getElementById('prev');
    if (p) p.addEventListener('click', function () { s.idx--; renderQuestion(); });
    document.getElementById('next').addEventListener('click', next);
  }

  function next() {
    var s = session;
    if (s.idx < s.items.length - 1) { s.idx++; renderQuestion(); return; }
    if (s.mode === 'exam') {
      s.items.forEach(function (it) { if (it.pick !== null) record(it.cat, it.q.uid, it.pick === 0); });
    }
    renderResult();
  }

  function renderResult() {
    var s = session, n = s.items.length;
    var score = s.items.filter(function (it) { return it.pick === 0; }).length;
    var pct = Math.round(score / n * 100);
    var isExam = s.mode === 'exam';
    var pass = score >= PASS_LINE;

    var html = '<div class="narrow">' +
      '<div class="quiz-head"><a class="back" href="#/">←</a><h1>' + esc(s.title) + ' の結果</h1></div>' +
      '<div class="card result-hero">' +
        '<div class="ring" style="--p:' + pct + ';--ring-color:' + (isExam ? (pass ? 'var(--ok)' : 'var(--ng)') : 'var(--accent)') + '">' +
          '<div class="ring__inner"><div><b>' + score + '</b><span> / ' + n + '</span></div></div></div>' +
        (isExam
          ? '<div class="pass-badge ' + (pass ? 'ok' : 'ng') + '">' + (pass ? '合格ライン到達' : 'あと ' + (PASS_LINE - score) + '問で合格ライン') + '</div>' +
            '<p class="muted">得点 ' + (score * 5) + ' / 60 点(合格基準 40 点 = 12問中 8問)</p>'
          : '<p class="muted">正答率 ' + pct + '%</p>') +
        '<div class="quiz-actions" style="justify-content:center">' +
          '<button class="btn primary" type="button" id="retry">もう一度</button>' +
          '<a class="btn" href="#/">ホームへ</a>' +
        '</div>' +
      '</div>' +
      '<h2 class="section-title"><span class="dot"></span>全問の解説</h2>' +
      '<div class="review-list">' + s.items.map(reviewItem).join('') + '</div></div>';
    $main.innerHTML = html;
    window.scrollTo(0, 0);
    document.getElementById('retry').addEventListener('click', function () { route(true); });
  }

  function reviewItem(it, i) {
    var q = it.q;
    var status = it.pick === null ? 'na' : (it.pick === 0 ? 'ok' : 'ng');
    var mark = { ok: '○', ng: '×', na: '−' }[status];
    var ans = '<div class="answer-line">';
    if (it.pick !== null && it.pick !== 0) ans += '<div class="ng"><small>あなたの解答</small>' + q.options[it.pick] + '</div>';
    if (it.pick === null) ans += '<div><small>あなたの解答</small>未回答</div>';
    ans += '<div class="ok"><small>正解</small>' + q.options[0] + '</div></div>';
    return '<details class="card review-item"' + (status !== 'ok' ? ' open' : '') + '>' +
      '<summary><span class="mark ' + status + '">' + mark + '</span><span class="sum-text">' +
      '<span class="qmeta">' + tagFor(it.cat) + '<span class="tag mono">Q' + (i + 1) + ' ・ ' + esc(q.id) + '</span></span>' +
      '<p>' + esc(stripTags(q.q)) + '</p></span></summary>' +
      '<div class="body"><div class="qtext">' + q.q + '</div>' + ans + explanationHTML(it.cat, q) + '</div></details>';
  }

  /* ---------- 画面: 一覧で学ぶ ---------- */
  function renderStudy(cat) {
    var c = CAT[cat];
    var qs = questions(cat);
    var html = '<div class="narrow"><div class="page-head"><a class="back" href="#/">← ホーム</a>' +
      '<h1>' + c.icon + ' ' + esc(c.name) + '</h1>' +
      '<p class="muted">' + (c.group === 'law' ? '法規' : '無線工学') + ' ・ 全' + qs.length + '問。問題をタップすると正解と解説が開きます。</p></div>' +
      '<div class="toolbar"><input class="search" id="filter" type="search" placeholder="この分野内を検索(例: 空中線、周波数)" aria-label="分野内検索">' +
      '<a class="btn primary" href="#/quiz/' + cat + '?n=10">10問に挑戦</a></div>' +
      '<div class="review-list" id="list"></div></div>';
    $main.innerHTML = html;

    var items = qs.map(function (q, i) {
      var r = progress[recKey(cat, q.uid)];
      var st = !r ? 'na' : (r.last ? 'ok' : 'ng');
      return { q: q, html: studyItem(cat, q, i, st), text: (stripTags(q.q) + ' ' + q.options.map(stripTags).join(' ')).toLowerCase() };
    });
    var list = document.getElementById('list');
    function draw(f) {
      var shown = items.filter(function (x) { return !f || x.text.indexOf(f) !== -1; });
      list.innerHTML = shown.length ? shown.map(function (x) { return x.html; }).join('') : '<div class="empty">該当する問題がありません</div>';
    }
    draw('');
    document.getElementById('filter').addEventListener('input', function (e) { draw(e.target.value.trim().toLowerCase()); });
  }

  function studyItem(cat, q, i, st) {
    var mark = { ok: '○', ng: '×', na: (i + 1) }[st];
    return '<details class="card review-item">' +
      '<summary><span class="mark ' + st + '">' + mark + '</span><span class="sum-text">' +
      '<span class="qmeta"><span class="tag mono">' + esc(q.id) + '</span></span>' +
      '<p>' + esc(stripTags(q.q)) + '</p></span></summary>' +
      '<div class="body"><div class="qtext">' + q.q + '</div>' +
      '<ol class="options">' + q.options.map(function (o, k) {
        return '<li><div class="opt ' + (k === 0 ? 'is-correct' : 'is-dim') + '"><span class="opt__key">' + (k === 0 ? '✓' : '·') + '</span><span class="opt__body">' + o + '</span></div></li>';
      }).join('') + '</ol>' +
      '<div style="margin-top:14px">' + explanationHTML(cat, q) + '</div></div></details>';
  }

  /* ---------- 画面: 復習リスト ---------- */
  function renderReviewPage() {
    var w = wrongItems();
    var html = '<div class="narrow"><div class="page-head"><a class="back" href="#/">← ホーム</a>' +
      '<h1>復習リスト</h1><p class="muted">直近の解答が不正解だった問題です。解き直して正解すると、このリストから外れます。</p></div>';
    if (!w.length) {
      html += '<div class="card empty"><p style="font-size:40px;margin:0">🎉</p><p>復習が必要な問題はありません。<br>分野別の問題や模擬試験に挑戦しましょう。</p><a class="btn primary" href="#/">ホームへ</a></div>';
    } else {
      html += '<div class="toolbar"><a class="btn primary" href="#/quiz/review">' + w.length + '問をまとめて解き直す</a>' +
        '<button class="btn ghost" type="button" id="reset">学習記録をリセット</button></div>' +
        '<div class="review-list">' + w.map(function (x, i) {
          return '<details class="card review-item"><summary><span class="mark ng">×</span><span class="sum-text">' +
            '<span class="qmeta">' + tagFor(x.cat) + '<span class="tag mono">' + esc(x.q.id) + '</span></span>' +
            '<p>' + esc(stripTags(x.q.q)) + '</p></span></summary><div class="body"><div class="qtext">' + x.q.q + '</div>' +
            '<div class="answer-line"><div class="ok"><small>正解</small>' + x.q.options[0] + '</div></div>' +
            explanationHTML(x.cat, x.q) + '</div></details>';
        }).join('') + '</div>';
    }
    $main.innerHTML = html + '</div>';
    var r = document.getElementById('reset');
    if (r) r.addEventListener('click', function () {
      if (!confirm('すべての学習記録を削除します。よろしいですか?')) return;
      progress = {};
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      renderReviewPage();
    });
  }

  /* ---------- 画面: 全体検索 ---------- */
  function renderSearch(initial) {
    var html = '<div class="narrow"><div class="page-head"><a class="back" href="#/">← ホーム</a>' +
      '<h1>問題を検索</h1><p class="muted">全' + CATS.reduce(function (a, c) { return a + questions(c.key).length; }, 0) +
      '問の問題文・選択肢・解説から検索します。</p></div>' +
      '<div class="toolbar"><input class="search" id="q" type="search" placeholder="例: スポラジックE層、実効値、免許状" value="' + esc(initial || '') + '" aria-label="検索語"></div>' +
      '<div class="review-list" id="list"></div></div>';
    $main.innerHTML = html;

    var index = [];
    CATS.forEach(function (c) {
      var ex = HAM.exps[c.key] || {};
      questions(c.key).forEach(function (q) {
        var e = ex.items && ex.items[q.uid];
        index.push({
          cat: c.key, q: q,
          text: [stripTags(q.q), q.options.map(stripTags).join(' '), e ? stripTags((e.point || '') + ' ' + (e.exp || '')) : '', q.id].join(' ').toLowerCase()
        });
      });
    });
    var list = document.getElementById('list');
    var input = document.getElementById('q');
    function draw() {
      var f = input.value.trim().toLowerCase();
      if (!f) { list.innerHTML = '<div class="empty">キーワードを入力してください</div>'; return; }
      var terms = f.split(/\s+/);
      var hits = index.filter(function (x) { return terms.every(function (t) { return x.text.indexOf(t) !== -1; }); });
      list.innerHTML = hits.length
        ? '<p class="muted" style="margin:0">' + hits.length + '件</p>' + hits.slice(0, 60).map(function (x) {
            return '<details class="card review-item"><summary><span class="mark na">?</span><span class="sum-text">' +
              '<span class="qmeta">' + tagFor(x.cat) + '<span class="tag mono">' + esc(x.q.id) + '</span></span>' +
              '<p>' + esc(stripTags(x.q.q)) + '</p></span></summary><div class="body"><div class="qtext">' + x.q.q + '</div>' +
              '<div class="answer-line"><div class="ok"><small>正解</small>' + x.q.options[0] + '</div></div>' +
              explanationHTML(x.cat, x.q) + '</div></details>';
          }).join('')
        : '<div class="empty">該当する問題がありません</div>';
    }
    draw();
    input.addEventListener('input', draw);
    input.focus();
  }

  /* ---------- 画面: チートシート ---------- */
  function sheetCard(id) {
    var found = null;
    (HAM.cheatsheet || []).forEach(function (g) {
      g.cards.forEach(function (c) { if (c.id === id) found = c; });
    });
    return found;
  }
  function rowRefs(uids) {
    return uids.split(' ').map(function (u) { return { cat: UID_CAT[u], q: findQ(UID_CAT[u], u) }; });
  }
  function cardRefs(card) {
    var seen = {}, out = [];
    card.rows.forEach(function (row) {
      rowRefs(row[2]).forEach(function (r) { if (!seen[r.q.uid]) { seen[r.q.uid] = 1; out.push(r); } });
    });
    return out;
  }
  // 行の習得状態:全問が直近正解なら done、1問でも直近不正解なら ng
  function rowState(refs) {
    var done = 0, ng = 0;
    refs.forEach(function (r) {
      var rec = progress[recKey(r.cat, r.q.uid)];
      if (rec && rec.last) done++;
      else if (rec) ng++;
    });
    return ng ? 'ng' : (done === refs.length ? 'ok' : '');
  }

  function renderCheatsheet() {
    var groups = HAM.cheatsheet || [];
    var nRows = 0, nQ = 0;
    groups.forEach(function (g) {
      g.cards.forEach(function (c) { nRows += c.rows.length; nQ += cardRefs(c).length; });
    });

    var html = '<div class="sheet"><div class="page-head"><a class="back" href="#/">← ホーム</a>' +
      '<h1>チートシート</h1>' +
      '<p class="muted">似た問題を「問われ方 → 答え」の型にまとめました。全' + nQ + '問を ' + nRows +
      ' 行に集約しています。各行の<b class="chip-demo">N問</b>を押すと、その型の問題だけを解けます。</p></div>' +
      '<div class="toolbar sheet-tools"><input class="search" id="sheetFilter" type="search" placeholder="まとめ内を検索(例: 10分、λ/4、非常)" aria-label="チートシート内検索">' +
      '<button class="btn ghost" type="button" id="printSheet">印刷 / PDF</button></div>' +
      '<nav class="sheet-nav" aria-label="テーマ一覧">';
    groups.forEach(function (g) {
      html += '<div class="sheet-nav__group"><span class="tag ' + g.key + '">' + esc(g.title) + '</span>';
      g.cards.forEach(function (c) {
        html += '<button type="button" class="sheet-nav__chip" data-jump="sheet-' + c.id + '">' + c.icon + ' ' + esc(c.title) + '</button>';
      });
      html += '</div>';
    });
    html += '</nav>';

    groups.forEach(function (g) {
      html += '<h2 class="section-title ' + g.key + '"><span class="dot"></span>' + esc(g.title) + '</h2><div class="sheet-grid">';
      g.cards.forEach(function (c) {
        var refs = cardRefs(c);
        html += '<section class="card sheet-card ' + g.key + '" id="sheet-' + c.id + '">' +
          '<header class="sheet-card__head"><span class="sheet-card__icon" aria-hidden="true">' + c.icon + '</span>' +
          '<h3>' + esc(c.title) + '</h3><span class="tag">' + refs.length + '問</span></header>' +
          '<p class="sheet-why"><b>原理</b>' + c.why + '</p><ul class="sheet-rows">';
        c.rows.forEach(function (row, i) {
          var rr = rowRefs(row[2]);
          html += '<li class="sheet-row" data-text="' + esc((stripTags(row[0]) + ' ' + stripTags(row[1])).toLowerCase()) + '">' +
            '<div class="sheet-row__q">' + row[0] + '</div>' +
            '<div class="sheet-row__a">' + row[1] + '</div>' +
            '<a class="sheet-row__n ' + rowState(rr) + '" href="#/quiz/sheet/' + c.id + '/' + i + '" title="この型の' + rr.length + '問を解く">' + rr.length + '問</a></li>';
        });
        html += '</ul><div class="sheet-card__foot">' +
          '<a class="btn primary small" href="#/quiz/sheet/' + c.id + '">このテーマを解く(' + refs.length + '問)</a>' +
          ((c.topics || []).length ? '<details class="sheet-more" data-card="' + c.id + '"><summary>詳しい原理を読む</summary><div class="sheet-more__body"></div></details>' : '') +
          '</div></section>';
      });
      html += '</div>';
    });
    $main.innerHTML = html + '</div>';

    Array.prototype.forEach.call($main.querySelectorAll('[data-jump]'), function (b) {
      b.addEventListener('click', function () {
        var el = document.getElementById(b.getAttribute('data-jump'));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    // 詳しい原理は開いたときに描画する(SVG を含むので初期表示を軽くする)
    Array.prototype.forEach.call($main.querySelectorAll('.sheet-more'), function (d) {
      d.addEventListener('toggle', function () {
        var body = d.querySelector('.sheet-more__body');
        if (!d.open || body.childElementCount) return;
        body.innerHTML = sheetCard(d.getAttribute('data-card')).topics.map(function (t) {
          var kv = t.split(':'), tp = HAM.exps[kv[0]].topics[kv[1]];
          return '<div class="rich sheet-topic"><h4>' + tp.title + '</h4>' + tp.body + '</div>';
        }).join('');
      });
    });
    document.getElementById('printSheet').addEventListener('click', function () { window.print(); });
    document.getElementById('sheetFilter').addEventListener('input', function (e) {
      var f = e.target.value.trim().toLowerCase();
      Array.prototype.forEach.call($main.querySelectorAll('.sheet-card'), function (card) {
        var any = false;
        Array.prototype.forEach.call(card.querySelectorAll('.sheet-row'), function (row) {
          var hit = !f || row.getAttribute('data-text').indexOf(f) !== -1;
          row.hidden = !hit;
          if (hit) any = true;
        });
        card.hidden = !any;
      });
    });
  }

  function startSheetQuiz(id, rowIdx) {
    var c = sheetCard(id);
    if (!c) { location.hash = '#/cheatsheet'; return; }
    var row = !isNaN(rowIdx) && c.rows[rowIdx];
    startList(row ? c.title + ' ・ ' + stripTags(row[0]) : c.title,
      '#/cheatsheet', row ? rowRefs(row[2]) : cardRefs(c));
  }

  /* ---------- ルーティング ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?');
    var path = qi === -1 ? h : h.slice(0, qi);
    var params = {};
    if (qi !== -1) h.slice(qi + 1).split('&').forEach(function (kv) {
      var p = kv.split('=');
      params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { parts: path.split('/').filter(Boolean), params: params };
  }

  function route() {
    var r = parseHash(), p = r.parts;
    var nav = p[0] === 'review' || (p[0] === 'quiz' && p[1] === 'review') ? 'review'
      : p[0] === 'cheatsheet' || (p[0] === 'quiz' && p[1] === 'sheet') ? 'cheatsheet'
      : p[0] === 'search' ? 'search' : (p.length ? '' : 'home');
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-nav') === nav);
    });
    session = null;

    if (p[0] === 'quiz' && p[1] === 'review') startReview();
    else if (p[0] === 'quiz' && p[1] === 'sheet') startSheetQuiz(p[2], parseInt(p[3], 10));
    else if (p[0] === 'cheatsheet') renderCheatsheet();
    else if (p[0] === 'quiz' && CAT[p[1]]) startPractice(p[1], parseInt(r.params.n, 10) || 0);
    else if (p[0] === 'exam' && EXAM[p[1]]) startExam(p[1]);
    else if (p[0] === 'study' && CAT[p[1]]) renderStudy(p[1]);
    else if (p[0] === 'review') renderReviewPage();
    else if (p[0] === 'search') renderSearch(r.params.q);
    else renderHome();
    if (!session) window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);

  document.addEventListener('keydown', function (e) {
    if (!session || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    var n = parseInt(e.key, 10);
    var btns = $main.querySelectorAll('.opt');
    if (n >= 1 && n <= btns.length && !btns[n - 1].disabled) { btns[n - 1].click(); e.preventDefault(); return; }
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      var nx = document.getElementById('next');
      if (nx && document.activeElement !== nx) { nx.click(); e.preventDefault(); }
    }
  });

  /* ---------- テーマ切替 ---------- */
  document.getElementById('themeToggle').addEventListener('click', function () {
    var root = document.documentElement;
    var cur = root.getAttribute('data-theme') ||
      (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var nextTheme = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    try { localStorage.setItem('ham4.theme', nextTheme); } catch (e) {}
  });

  route();
})();
