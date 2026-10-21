#!/usr/bin/env python3
"""Evidence check for the status card: are the exact values of each item found in its basis files?

Report only; never changes a file. For every item with a basis link ([[file]], [[file|label]],
[[file#section]] or a Markdown link to a .md file), it takes the values a reader would rely on
and looks each one up in the linked files:

  - dates: 2026-03-05, 2026-03, 2026/3/5, 2026.3.5, 2026年3月5日, 2026年3月; a date counts as
    found when the basis file has the same day (or month) in any of these forms
  - quotes: text in “”, 「」, 『』 or "" of at least 6 characters when it holds CJK, else 15
  - numbers: with a decimal point (5.6), thousands separators (12,000), a suffix (12%, 3万, 42K)
    or at least four digits (2026)
Small plain integers, derived values and paraphrase are not checked: the "quote or no change"
rule of the skill covers them. A value is found when it occurs in a basis file with no digit
right before or after it, after both sides are folded (full-width to half-width, spaces dropped).

Items without a basis link are counted as "no basis"; numbered items only, so headings, header
fields and introductory lines are skipped. A basis file that is not in the sources folder is
reported as missing, and that item's values are not judged.

  python3 evidence_check.py STATUS_CARD --sources DIR [--item N ...]

DIR holds the basis files, read from the library into the work folder (subfolders are searched
too, so entity pages can sit in their own folder). --item limits the check to those item numbers.
stdout: one line per suspect and a summary line. stderr: log.
Exit code: 0 report printed (suspects or not); 2 bad arguments or unreadable file.
"""
import argparse
import logging
import os
import re
import sys
import unicodedata

log = logging.getLogger("evidence_check")
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s.%(funcName)s:%(lineno)d - %(message)s"

ITEM_RE = re.compile(r"^\s*(?:第\s*(\d+)\s*条\s*[：:、.]?|item\s*(\d+)\s*[:.]|(\d+)\s*[.、．)）])\s*", re.I)
WIKI_RE = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")
MDLINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+?\.md)(?:#[^)]*)?\)")
DATE_RES = [
    re.compile(r"(?<!\d)(\d{4})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*[日号])?"),
    re.compile(r"(?<![\d.])(\d{4})([-/.])(\d{1,2})(?:\2(\d{1,2}))?(?![\d])"),
]
QUOTE_RE = re.compile(r"“([^”\n]+)”|「([^」\n]+)」|『([^』\n]+)』|\"([^\"\n]+)\"")
NUMBER_RE = re.compile(r"(?<![\d.])(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*(%|‰|万|亿|千|百万|K|M|B)?(?![\d])")
CJK_RE = re.compile(r"[㐀-鿿]")
SPACE_RE = re.compile(r"\s+")


def read(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().replace("\r\n", "\n")
    except OSError as e:
        log.error("cannot read: %s", e)
        sys.exit(2)


def fold(text):
    """Full-width to half-width (NFKC), spaces dropped: 2０26 年 ３ 月 -> 2026年3月."""
    return SPACE_RE.sub("", unicodedata.normalize("NFKC", text))


def strip_frontmatter(lines):
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                return i + 1, lines[i + 1:]
    return 0, lines


def items(text):
    """Numbered lines of the card outside code blocks: (line number, item number, text)."""
    offset, lines = strip_frontmatter(text.split("\n"))
    out, in_code = [], False
    for i, line in enumerate(lines):
        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        m = ITEM_RE.match(line)
        if m:
            out.append((offset + i + 1, next(g for g in m.groups() if g), line[m.end():].strip()))
    return out


def links(text):
    found = [m.group(1).strip() for m in WIKI_RE.finditer(text)]
    found += [os.path.basename(m.group(1)) for m in MDLINK_RE.finditer(text)]
    seen, out = set(), []
    for name in found:
        stem = name[:-3] if name.lower().endswith(".md") else name
        if stem and stem not in seen:
            seen.add(stem)
            out.append(stem)
    return out


def date_forms(y, m, d):
    """Every written form of one day (or month) that counts as the same date."""
    mi = int(m)
    ms = {str(mi), f"{mi:02d}"}
    if d is None:
        out = {f"{y}年{x}月" for x in ms}
        out |= {f"{y}{sep}{x}" for x in ms for sep in "-/."}
        return out
    di = int(d)
    ds = {str(di), f"{di:02d}"}
    out = {f"{y}年{x}月{z}{suf}" for x in ms for z in ds for suf in "日号"}
    out |= {f"{y}{sep}{x}{sep}{z}" for x in ms for z in ds for sep in "-/."}
    return out


def candidates(text):
    """The values of one item: (kind, as written, forms that count as found)."""
    body = unicodedata.normalize("NFKC", MDLINK_RE.sub(" ", WIKI_RE.sub(" ", text)))
    out = []
    for m in QUOTE_RE.finditer(body):
        q = next(g for g in m.groups() if g is not None).strip()
        if len(q) >= (6 if CJK_RE.search(q) else 15):
            out.append(("quote", q, {fold(q)}))
            body = body.replace(m.group(0), " ")
    for rx in DATE_RES:
        for m in list(rx.finditer(body)):
            if rx is DATE_RES[0]:
                y, mo, d = m.group(1), m.group(2), m.group(3)
            else:
                y, mo, d = m.group(1), m.group(3), m.group(4)
            if not 1 <= int(mo) <= 12 or (d is not None and not 1 <= int(d) <= 31):
                continue
            out.append(("date", m.group(0).strip(), date_forms(y, mo, d)))
            body = body.replace(m.group(0), " ")
    for m in NUMBER_RE.finditer(body):
        whole, frac, suf = m.group(1), m.group(2) or "", m.group(3) or ""
        if not (frac or suf or "," in whole or len(whole) >= 4):
            continue
        plain = whole.replace(",", "") + frac
        forms = {fold(whole + frac + suf), fold(plain + suf)}
        if len(whole.replace(",", "")) > 3 and "," not in whole:
            forms.add(fold(f"{int(whole):,}" + frac + suf))
        out.append(("number", m.group(0).strip(), forms))
    return out


def occurs(form, source):
    """form occurs in source with no digit (or decimal part) glued on either side."""
    start = 0
    while True:
        i = source.find(form, start)
        if i < 0:
            return False
        before = source[i - 1] if i > 0 else ""
        after = source[i + len(form):i + len(form) + 2]
        glued_before = before.isdigit() or (before == "." and form[:1].isdigit())
        glued_after = after[:1].isdigit() or (after[:1] in ".," and after[1:2].isdigit() and form[-1:].isdigit())
        if not (glued_before or glued_after):
            return True
        start = i + 1


def index_sources(folder):
    found = {}
    for root, _, files in os.walk(folder):
        for name in files:
            if name.lower().endswith(".md"):
                found.setdefault(name[:-3], os.path.join(root, name))
    return found


def utf8_stdio():
    """Windows consoles default to a legacy code page; library names may be CJK."""
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            # streams without reconfigure (redirected or replaced): keep their encoding
            pass


def main():
    utf8_stdio()
    ap = argparse.ArgumentParser(description="Evidence check: values of status-card items against their basis files")
    ap.add_argument("card", help="status card (or a draft of it) in the work folder")
    ap.add_argument("--sources", required=True, help="folder holding the basis files read from the library")
    ap.add_argument("--item", action="append", default=[], help="check only this item number (repeatable)")
    ap.add_argument("--log-level", default=os.environ.get("LOG_LEVEL", "INFO").upper(),
                    choices=["DEBUG", "INFO", "WARNING", "ERROR"], help="default: LOG_LEVEL, else INFO")
    a = ap.parse_args()
    logging.basicConfig(level=a.log_level, format=LOG_FORMAT, stream=sys.stderr)
    if not os.path.isdir(a.sources):
        log.error("sources folder not found: %s", a.sources)
        sys.exit(2)
    only = {x.strip() for x in a.item}
    sources = index_sources(a.sources)
    log.info("card: %s; sources: %s (%d .md files); items: %s", a.card, a.sources, len(sources),
             sorted(only, key=int) if only else "all")

    cache = {}
    n_items = n_values = n_suspect = n_nobasis = n_missing = 0
    for line_no, num, text in items(read(a.card)):
        if only and num not in only:
            continue
        n_items += 1
        stems = links(text)
        if not stems:
            n_nobasis += 1
            print(f"Item {num} (line {line_no}): no basis link")
            continue
        missing = [s for s in stems if s not in sources]
        if missing:
            n_missing += 1
            print(f"Item {num} (line {line_no}): basis file not in sources folder: {', '.join(missing)}")
            continue
        texts = []
        for s in stems:
            if s not in cache:
                cache[s] = fold(read(sources[s]))
            texts.append(cache[s])
        for kind, written, forms in candidates(text):
            n_values += 1
            if any(occurs(f, t) for f in forms for t in texts):
                log.debug("item %s: %s %r found", num, kind, written)
                continue
            n_suspect += 1
            print(f"Item {num} (line {line_no}): {kind} not found in {', '.join(stems)}: {written}")
    print(f"Evidence check: {n_items} items, {n_values} values checked, {n_suspect} not found, "
          f"{n_nobasis} without basis link, {n_missing} with basis file missing")
    log.info("done: %d items, %d values, %d not found", n_items, n_values, n_suspect)


if __name__ == "__main__":
    main()
