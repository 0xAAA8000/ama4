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
console.log(`${covered}/${total} questions explained, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
