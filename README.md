# Portfolio Atlas

Rushikesh Jadhav's portfolio: a map of projects on the home page, with a magazine-style page for each project.
It's plain HTML, CSS and D3, built by a small Python script and hosted free on GitHub Pages.

## Add or edit a project

Create `content/work/<slug>.md`:

```yaml
---
title: How do TIFs reshape Chicago's tax base?
kind: research            # research | app | publication
order: 1                  # position on the home page
year: 2026
place: Chicago, Illinois
coords: [-87.63, 41.88]   # [longitude, latitude]; leave out for work with no single place
dek: One-sentence hook shown on cards and under the title.
image: images/TIF.png     # file in static/images/
tags: [SQL, R, Plotly]
links:
  - {label: Read the memo, url: "https://…"}
  - {label: Report (PDF), url: "files/report.pdf"}   # file in static/files/
note: Optional disclaimer shown in a box.
readme:                   # optional: pull a GitHub README into the page
  repo: rushikeshay/some-repo
  drop: [pipeline]        # README "##" sections to leave out (Dependencies etc. are dropped by default)
  skip_intro: true        # drop the README text above its first "##" heading
draft: true               # optional: hide the project
---
Opening paragraph(s) in Markdown. Anything written here appears above the README content.
```

Publications use `kind: publication` with `venue`, `authors` and `url`, and they have no body text.
Related publications can share a `series: <key>` (defined under `series` in `site.yaml`); give them
consecutive `order` values and they are listed together under the series name.

Site-wide text (headline, about, links) is in `site.yaml`.

## Preview locally

```sh
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # first time only
BASE=/ .venv/bin/python build.py
python3 -m http.server 8000 -d _site     # open http://localhost:8000
```

## Deploy

Push to `main`. GitHub Actions builds and publishes the site. It also rebuilds every Monday
so it picks up README edits in your project repos. To rebuild right away, open the Actions tab, choose
"Build and deploy", then "Run workflow".

## Layout

```
content/work/   one Markdown file per project
templates/      Jinja HTML: base, home (atlas), work (project page)
static/         css, js (atlas.js = home map, story.js = locator globe), images, files, protests/
build.py        builds everything into _site/
```
