"""Build the portfolio into _site/.

Usage:
    python build.py              # base path from site.yaml
    BASE=/ python build.py       # override base path (use "/" for local preview)
    OFFLINE=1 python build.py    # don't fetch READMEs, use .cache/ only

Each project is a Markdown file in content/work/. Front matter holds the
metadata (place, coordinates, links...). If it names a `readme.repo`, that
repo's README is fetched from GitHub at build time and appended to the page,
so the README stays the single source of truth.
"""
import os
import re
import shutil
import urllib.request
from pathlib import Path

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).parent
OUT = ROOT / "_site"
CACHE = ROOT / ".cache"

# README sections that are useful to developers but not to portfolio readers.
DEFAULT_DROP = ["dependencies", "package dependencies", "repository structure",
                "author", "view memo", "installation", "setup", "requirements"]


def read_front_matter(path):
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", text, re.S)
    if not match:
        return {}, text
    return yaml.safe_load(match.group(1)) or {}, match.group(2)


def fetch_readme(repo):
    """Fetch README.md for owner/repo, falling back to the local cache."""
    cached = CACHE / (repo.replace("/", "__") + ".md")
    if not os.environ.get("OFFLINE"):
        url = f"https://raw.githubusercontent.com/{repo}/HEAD/README.md"
        try:
            with urllib.request.urlopen(url, timeout=15) as resp:
                text = resp.read().decode("utf-8")
            CACHE.mkdir(exist_ok=True)
            cached.write_text(text, encoding="utf-8")
            return text
        except Exception as err:  # network down, repo renamed, etc.
            print(f"  ! could not fetch {repo}: {err}")
    return cached.read_text(encoding="utf-8") if cached.exists() else ""


def clean_readme(text, repo, drop, skip_intro=False):
    """Strip the title and developer-only sections; make relative links absolute."""
    text = re.sub(r"^\s*# .*\n", "", text, count=1)
    if skip_intro:  # drop everything before the first "## " heading
        text = text[text.find("\n## ") + 1:] if "\n## " in text else text
    drop = [d.lower() for d in DEFAULT_DROP + (drop or [])]

    # Split on level-2 headings (outside code fences) and keep the ones we want.
    parts, current, in_fence = [], [], False
    for line in text.splitlines():
        if line.startswith("```"):
            in_fence = not in_fence
        if not in_fence and line.startswith("## "):
            parts.append(current)
            current = []
        current.append(line)
    parts.append(current)

    kept = []
    for part in parts:
        heading = part[0][3:].strip().lower() if part and part[0].startswith("## ") else ""
        heading = re.sub(r"[\[\]!*`]", "", heading)
        if heading and any(heading.startswith(d) for d in drop):
            continue
        kept.append("\n".join(part))
    text = "\n".join(kept)

    # Horizontal rules between README sections just add noise here.
    text = re.sub(r"^\s*(---|\*\*\*)\s*$", "", text, flags=re.M)

    def absolutize(m):
        bang, label, target = m.group(1), m.group(2), m.group(3)
        if re.match(r"^(https?:|mailto:|#|/)", target):
            return m.group(0)
        kind = "raw" if bang else "blob"
        return f"{bang}[{label}](https://github.com/{repo}/{kind}/HEAD/{target})"

    return re.sub(r"(!?)\[([^\]]*)\]\(([^)\s]+)\)", absolutize, text).strip()


def render_md(text):
    html = markdown.markdown(text, extensions=["extra", "sane_lists", "toc"])
    # Wide tables and code scroll inside their own box, not the page.
    html = html.replace("<table>", '<div class="scroll-x"><table>').replace("</table>", "</table></div>")
    return html


def main():
    site = yaml.safe_load((ROOT / "site.yaml").read_text(encoding="utf-8"))
    base = os.environ.get("BASE", site.get("base", "/"))
    if not base.endswith("/"):
        base += "/"

    items = []
    for path in sorted((ROOT / "content" / "work").glob("*.md")):
        meta, body = read_front_matter(path)
        if meta.get("draft"):
            continue
        meta.setdefault("slug", path.stem)
        meta["body_html"] = render_md(body) if body.strip() else ""
        meta["readme_html"] = ""
        readme = meta.get("readme")
        if readme:
            print(f"  readme: {readme['repo']}")
            raw = fetch_readme(readme["repo"])
            if raw:
                meta["readme_html"] = render_md(clean_readme(
                    raw, readme["repo"], readme.get("drop"), readme.get("skip_intro", False)))
        items.append(meta)

    items.sort(key=lambda m: (m.get("order", 99), -int(m.get("year", 0))))
    work = [m for m in items if m.get("kind") != "publication"]
    pubs = [m for m in items if m.get("kind") == "publication"]
    for i, m in enumerate(work, 1):
        m["num"] = f"{i:02d}"

    env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=True)
    # Links in front matter may be site-relative ("files/x.pdf"); prefix the base path.
    env.filters["href"] = lambda url: url if re.match(r"^(https?:|mailto:|/|#)", url) else base + url
    ctx = {"site": site, "base": base}

    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "static", OUT)
    (OUT / ".nojekyll").touch()

    (OUT / "index.html").write_text(env.get_template("home.html").render(
        **ctx, work=work, pubs=pubs), encoding="utf-8")

    for i, m in enumerate(work):
        page = OUT / "work" / m["slug"] / "index.html"
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(env.get_template("work.html").render(
            **ctx, p=m, next=work[(i + 1) % len(work)]), encoding="utf-8")

    print(f"Built {len(work)} projects + {len(pubs)} publications → {OUT} (base {base})")


if __name__ == "__main__":
    main()
