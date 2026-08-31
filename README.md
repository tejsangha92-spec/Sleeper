# Sleeper Fantasy Aid

A personal fantasy football dashboard for your [Sleeper](https://sleeper.com) leagues. Runs entirely
in your browser (no backend/server, no API keys) by calling Sleeper's public read-only API directly.

## Features

- **Dashboard** — your roster, bench, and league standings at a glance.
- **Lineup Optimizer** — recommends your best starting lineup for the week, respecting your league's
  exact roster slots (including FLEX / SUPERFLEX), ranked by projected points.
- **Waiver Wire Assistant** — surfaces the best available free agents and suggests add/drop swaps
  where a free agent clearly outprojects a bench player at the same position.
- **Trade Analyzer** — pick players from your roster and an opponent's, and see a rest-of-season
  value comparison and a fairness verdict.

Point values are computed from raw player stats using *your* league's actual scoring settings
(not a generic PPR/standard assumption), so custom scoring leagues are handled correctly.

If Sleeper's projections aren't available for a given week, the app automatically falls back to
each player's trailing average over the last few completed weeks, and shows a banner noting the
estimate is a fallback.

## Running it

**Hosted:** once GitHub Pages is enabled for this repo (Settings → Pages → Source: Deploy from
branch → Branch: `main`, folder: `/docs`), the app is available at
`https://tejsangha92-spec.github.io/Sleeper/` — just open that link, no setup needed.

**Locally:** no build step or install required — it's plain HTML/CSS/JS.

```
cd docs
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. On load, enter your Sleeper username, pick
which of your leagues to work with, and pick a week.

(Opening `docs/index.html` directly by double-clicking may not work in every browser, since some
browsers restrict `fetch()` from `file://` pages — serving it locally as above avoids that.)

## Testing

`docs/test/test.html` is an offline test harness that mocks Sleeper's API with fixture data
(`docs/test/fixtures.js`) so the optimizer/waiver/trade math can be checked without hitting the
real API. Serve the `docs` directory and open `test/test.html` to run it.

## Notes

- All data comes from `api.sleeper.app`; nothing is sent to any third-party server, and no login
  or write access to your leagues is required (or possible) — this is read-only.
- Sleeper doesn't have a documented public projections endpoint for the exact one used here; it's
  used best-effort and the app degrades gracefully (see fallback above) if it ever changes shape.
