// 解説データの網羅性チェック: node tools/check_explanations.js
// 全問題に解説があるか、参照している topics が存在するかを確認する。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/registry.js'), 'utf8'), ctx);
ctx.HAM = ctx.window.HAM;

let problems = 0;
for (const dir of ['questions', 'explanations']) {
  for (const f of fs.readdirSync(path.join(root, 'data', dir)).sort()) {
    vm.runInContext(fs.readFileSync(path.join(root, 'data', dir, f), 'utf8'), ctx, { filename: f });
  }
}
let total = 0, covered = 0;
for (const [key, cat] of Object.entries(ctx.HAM.cats)) {
  const ex = ctx.HAM.exps[key] || { items: {}, topics: {} };
  const uids = new Set(cat.questions.map(q => q.uid));
  for (const q of cat.questions) {
    total++;
    const it = ex.items[q.uid];
    if (!it) { console.log(`MISSING ${key} ${q.uid}`); problems++; continue; }
    covered++;
    if (!it.point || !it.exp) { console.log(`INCOMPLETE ${key} ${q.uid}`); problems++; }
    for (const t of it.topics || []) if (!ex.topics[t]) { console.log(`BAD TOPIC ${key} ${q.uid} -> ${t}`); problems++; }
  }
  for (const uid of Object.keys(ex.items)) if (!uids.has(uid)) { console.log(`UNKNOWN UID ${key} ${uid}`); problems++; }
}

// チートシート:全問題がいずれかの行に含まれ、未知の uid や topic を参照していないか
vm.runInContext(fs.readFileSync(path.join(root, 'data/cheatsheet.js'), 'utf8'), ctx);
const uidCat = {};
for (const [key, cat] of Object.entries(ctx.HAM.cats)) for (const q of cat.questions) uidCat[q.uid] = key;
const inSheet = new Set();
let cards = 0;
for (const g of ctx.HAM.cheatsheet) for (const c of g.cards) {
  cards++;
  for (const [, , uids] of c.rows) for (const u of uids.split(' ')) {
    if (!uidCat[u]) { console.log(`CHEATSHEET UNKNOWN UID ${c.id} ${u}`); problems++; }
    inSheet.add(u);
  }
  for (const t of c.topics || []) {
    const [k, name] = t.split(':');
    if (!(ctx.HAM.exps[k] && ctx.HAM.exps[k].topics[name])) { console.log(`CHEATSHEET BAD TOPIC ${c.id} ${t}`); problems++; }
  }
}
for (const u of Object.keys(uidCat)) if (!inSheet.has(u)) { console.log(`NOT IN CHEATSHEET ${u}`); problems++; }
console.log(`cheatsheet: ${cards} cards cover ${inSheet.size}/${total} questions`);
console.log(`${covered}/${total} questions explained, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
