"""Assemble the local proofreading edition from the supplied first-edition files."""

import argparse
import hashlib
import json
import shutil
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent
WORD = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
CHAPTERS = {
    0: "preface", 73: "basics", 118: "characters", 159: "moves",
    454: "archetypes", 648: "streets", 786: "long-game", 1040: "mc-guide",
    1333: "first-session", 1382: "storm", 1633: "shadows", 1639: "credits",
}
PLAYBOOKS = {
    477: "aware", 488: "hunter", 500: "veteran", 511: "scholar",
    520: "spectre", 533: "vamp", 542: "wolf", 552: "revenant",
    562: "oracle", 572: "wizard", 582: "hallowed", 592: "immortal",
    603: "fae", 613: "tainted", 624: "vessel", 635: "dragon",
}
GAPS = {
    67: "本作的由來", 70: "遊玩準備", 74: "對話", 154: "導入問題",
    155: "裝備", 156: "挑選動作", 157: "戲劇動作", 158: "角色介紹與人情",
    451: "自訂動作", 1041: "主持人的角色", 1299: "原型背後",
    1634: "召喚陰影", 1635: "設計自訂動作", 1636: "無所不在的陰影",
    1637: "打破框架", 1638: "陰影的終結", 1640: "製作名單", 1641: "城市推手",
}
CHAPTER_ENDS = {1630: "更多風暴、更多威脅"}
ASSETS = ("index.html", "style.css", "app.js", "content.js")
FILES = {
    "core": "UrbanShadows_SingleSpread_082315.pdf",
    "dark": "Urban Shadows - Dark Streets.pdf",
    "word": "翻譯參考/城市之影規則書翻譯參考.docx",
    "moves": "翻譯參考/UrbanShadows_BasicMoves_中文翻譯.pdf",
    "playbooks": "翻譯參考/城市之影面團扮演書(全).pdf",
}


def inspect_word(path):
    with ZipFile(path) as archive:
        doc = ElementTree.fromstring(archive.read("word/document.xml"))
    for index, paragraph in enumerate(doc.iter(WORD + "p")):
        style = paragraph.find(WORD + "pPr/" + WORD + "pStyle")
        text = "".join(node.text or "" for node in paragraph.iter(WORD + "t")).strip()
        yield index, style.get(WORD + "val") if style is not None else "", text


def import_draft(path):
    chapters = {slug: [] for slug in CHAPTERS.values()}
    playbooks = {}
    current = chapters["preface"]
    section = None
    seen = set()
    for index, style, text in inspect_word(path):
        if not text:
            continue
        if index in CHAPTERS:
            current = chapters[CHAPTERS[index]]
            section = None
            seen.add(index)
        elif index in PLAYBOOKS or style == "2" or index in GAPS or section is None:
            section = {"id": str(index), "title": GAPS.get(index, text), "blocks": []}
            if index in GAPS:
                section["status"] = "原稿僅有標題 · 待翻譯"
                if index != 1299:
                    section["blocks"].append(["paragraph", "原稿標題 " + text])
            if index in CHAPTER_ENDS:
                section["status"] = "原稿僅有標題 · 待翻譯"
            current.append(section)
            if index in PLAYBOOKS:
                playbooks[PLAYBOOKS[index]] = section
        else:
            section["blocks"].append(["heading" if style == "3" else "paragraph", text])
    if seen != set(CHAPTERS) or len(playbooks) != 16:
        raise ValueError("Word 章節已變更，請先核對段落對應。")
    return {"chapters": chapters, "playbooks": playbooks}


def load_sources(root):
    sources = {key: root / relpath for key, relpath in FILES.items()}
    missing = [str(path) for path in sources.values() if not path.is_file()]
    if missing:
        raise FileNotFoundError("\n".join(missing))
    return sources


def check_source_layout(draft):
    for slug, sections in draft["chapters"].items():
        if not sections:
            raise ValueError("章節未收錄 " + slug)
    expected = {"1", "167", "477", "1043", "1595", "1634"}
    anchors = {part["id"] for sections in draft["chapters"].values() for part in sections}
    if len(anchors) != sum(map(len, draft["chapters"].values())) or not expected <= anchors:
        raise ValueError("段落 ID 不一致")


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--sources", type=Path, default=ROOT.parent / "Urban Shadows 1st")
    args = cli.parse_args()
    sources = load_sources(args.sources.resolve())
    draft = import_draft(sources["word"])
    check_source_layout(draft)
    out = ROOT / "local-preview"
    out.mkdir(exist_ok=True)
    for filename in ASSETS:
        shutil.copyfile(ROOT / filename, out / filename)
    for key, name in (("moves", "basic-moves-zh.pdf"), ("playbooks", "playbooks-zh.pdf")):
        shutil.copyfile(sources[key], out / name)
    (out / "draft-data.js").write_text("window.localDraft = " + json.dumps(draft, ensure_ascii=False) + ";\n", encoding="utf-8")
    fingerprints = {
        key: {"file": FILES[key], "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        for key, path in sources.items()
    }
    (out / "source-fingerprints.json").write_text(json.dumps(fingerprints, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Imported", len(draft["chapters"]), "chapter groups,", sum(map(len, draft["chapters"].values())),
          "sections,", len(draft["playbooks"]), "playbooks.")


if __name__ == "__main__":
    main()

