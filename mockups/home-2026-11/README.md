# Home page mockups, November 2026

Design mockups only. Nothing here is part of the site: Astro builds from `src/` and
`public/`, so this folder is never published.

- `pro.html` is the pick (Ethan, 2026-11-12: "the best thing yet").
- `1-ask.html` to `5-chat.html` are round one, rejected as cartoony.
- `index.html` lists them all.

## View them

From the repo root:

```bash
python3 -m http.server 8790 -d mockups/home-2026-11
```

Then open http://127.0.0.1:8790/. The `demo` link in this folder points to
`public/demo`, so the live demo inside `pro.html` works locally.

## Before pro.html becomes the real home page

- Build it in Astro under `src/`, not by copying this file.
- Add rows to `docs/FACTS.md` for the five sources, the 13 search steps and the
  eight product views. They come from one Wake County demo property and need
  confirming for every live county.
- Replace or remove the yellow "Placeholder" slots: firm logos, the client quote,
  security, the team and the three "coming next" cards.
- The talk-to-us form needs the Netlify form attributes kept or added.
- The screenshots in `img/` were taken from the demo after the name fix in PR #27.
