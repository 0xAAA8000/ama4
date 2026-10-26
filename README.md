# アマ4 解説ラボ

第4級アマチュア無線技士の過去問(472問・15分野)を、**問題文・選択肢は原文のまま**出題し、
「ポイント」「解説」「原理・背景(なぜそうなるのか)」の3段階で学べる学習サイトです。

問題データは [第4級アマチュア無線技士 過去問題集(icoro)](https://ham.icoro.com/index.html) 収録のものを使用しています。
解説・原理の文章と図はこのリポジトリ独自のものです。

## 機能

- 分野別演習(ランダム10問/全問)… 解答するとすぐに正誤と解説を表示(選択肢は毎回シャッフル)
- 模擬試験(法規12問・無線工学12問)… 本番と同じ分野配分。採点後に全問の解説を確認。合格ライン 8問/12問
- 一覧で学ぶ … 分野の全問題を正解・解説つきで閲覧、分野内検索
- 復習モード … 直近で間違えた問題だけを解き直し(学習記録はブラウザの localStorage に保存)
- 全体検索 … 問題文・選択肢・解説からキーワード検索
- ライト/ダークテーマ、スマートフォン対応、キーボード操作(1〜4で選択、Enterで次へ)

## 使い方

ビルド不要の静的サイトです。`index.html` をブラウザで開くか、任意の静的ホスティング(GitHub Pages など)に置いてください。

```sh
python3 -m http.server 8000   # http://localhost:8000/ を開く
```

## 構成

```
index.html                 画面の骨組み
assets/css/style.css       スタイル(デザイントークン・ダークモード)
assets/js/registry.js      データ登録用レジストリ
assets/js/app.js           画面描画・ルーティング・学習記録
data/questions/*.js        問題データ(tools/import_questions.py で原典 JSON から生成)
data/explanations/*.js     解説データ(分野ごと。topics=原理・背景、items=各問の解説)
data/img/                  問題の図版
tools/source/*.json        原典の問題データ
tools/import_questions.py  原典 JSON → data/questions/*.js の変換
tools/check_explanations.js 全問に解説があるかの検査(node tools/check_explanations.js)
```
