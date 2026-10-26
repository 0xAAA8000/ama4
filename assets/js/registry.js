/*
 * データ登録用の小さなレジストリ。
 * data/questions/*.js と data/explanations/*.js がこれを呼び出す。
 * <script> で読み込むだけなので file:// で開いても動作する。
 */
window.HAM = {
  cats: {},
  exps: {},

  addQuestions: function (d) {
    this.cats[d.key] = d;
  },

  /*
   * d = {
   *   topics: { topicKey: { title, body(HTML) } },   // 原理・背景(複数問で共有)
   *   items:  { uid: { point, exp(HTML), topics: [topicKey...] } }
   * }
   */
  addExplanations: function (key, d) {
    this.exps[key] = d;
  },

  // groups = [{ key, title, cards: [{ id, title, icon, why, rows: [[問われ方, 答え, 'uid uid ...']], topics }] }]
  addCheatsheet: function (groups) {
    this.cheatsheet = groups;
  }
};
