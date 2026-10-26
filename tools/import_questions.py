"""tools/source/*.json(原典サイトの問題データ)を data/questions/*.js に変換する。

- 問題文・選択肢は一切変更しない(画像パスのみ data/img/ に付け替え)。
- 原典では options[0] が正解。表示時にシャッフルする。
- 重複 ID には "~2" などを付けた uid を振る(解説の紐付けに使用)。
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "source"
OUT = ROOT / "data" / "questions"
CATS = [f"law{i}" for i in range(1, 7)] + [f"tech{i}" for i in range(1, 10)]


def fix_img(html: str) -> str:
    return html.replace('src="./data/', 'src="data/img/')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for cat in CATS:
        d = json.loads((SRC / f"{cat}.json").read_text(encoding="utf-8"))
        seen: dict[str, int] = {}
        qs = []
        for q in d["questions"]:
            n = seen.get(q["id"], 0) + 1
            seen[q["id"]] = n
            qs.append({
                "uid": q["id"] if n == 1 else f'{q["id"]}~{n}',
                "id": q["id"],
                "q": fix_img(q["q"]),
                "options": [fix_img(o) for o in q["options"]],
            })
        body = json.dumps({"key": cat, "category": d["category"], "questions": qs},
                          ensure_ascii=False, indent=1)
        (OUT / f"{cat}.js").write_text(f"HAM.addQuestions({body});\n", encoding="utf-8")
        print(cat, len(qs))


if __name__ == "__main__":
    main()
