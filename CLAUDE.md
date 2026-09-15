# Chloe's training plan app — project guide for Claude Code

Read this first. It explains what the app is, how it's built, the decisions
already made, and how to test and ship changes.

## What this is

A personal training-plan app for Chloe (Gold Coast, Australia), built by her
husband Cameron. It runs as a PWA on her iPhone (Safari → Add to Home Screen).
Personal use only, one user, no backend, no accounts.

Current plan: 10-week 5km plan, PB 25:15 → goal 24:30 (4:54/km), 4 runs +
3 strength sessions a week, daily dog walk (Fig and Fern) and 10,000 steps.
She'll start a new plan (10km, faster 5km, etc.) once this one is done.

## Stack — deliberately tiny

- `index.html` — the whole app: CSS, HTML and JS in one file. No framework,
  no bundler, no npm dependencies at runtime. Keep it that way.
- `manifest.webmanifest`, `sw.js` — PWA install + offline cache.
- `icon-180.png`, `icon-192.png`, `icon-512.png` — home-screen icons.
- Fonts: Fraunces (headings) + Inter (body) from Google Fonts, cached by the
  service worker after first load.
- `tests/*.test.cjs` — jsdom smoke tests. `npm install` then `npm test`.
- `README.md` — hosting + install steps for humans.

**Every time `index.html` changes, bump `CACHE_NAME` in `sw.js`** (v26 → v27
etc.) or installed phones keep the old version.

## Storage (all on-device)

| Key | What |
|---|---|
| `localStorage['5k-plan-store']` | `{version:2, activeId, plans:[{plan, state}]}` — every plan and its own progress |
| `localStorage['5k-plan-tab']` | last open tab |
| `localStorage['5k-plan-ai-key']`, `['5k-plan-ai-model']` | Anthropic API key + model for the AI plan builder |
| IndexedDB `5k-plan-progress` / store `entries` | Progress-tab entries: `{id, date, weight, feel, note, photo(dataURL)}` — shared across plans |
| `localStorage['5k-plan-v1']`, `['5k-plan-selected']` | legacy single-plan keys; migrated on first load, don't write to them |

Autosave: `render()` ends with `persist()` (debounced 150ms). Anything that
mutates state without calling `render()` must call `persist()` itself
(`updateExLog`, the exercise-name input do this). `pagehide` also flushes.

Export/Import backup (in Plans & settings) writes/reads `snapshot()` plus the
IndexedDB entries as one JSON file.

## Data model

```
plan = {
  id, name, distanceKm, currentPB:'mm:ss', goalTime:'mm:ss', weeks,
  startDate:'YYYY-MM-DD' | '',          // Monday of week 1; '' = undated, no today highlight
  phases:[{ id, label, start,           // start week; runs until next phase starts
            detail:{ Easy:{pace,desc}, Intervals:{..}, Tempo:{..}, Long:{..}, Strength:{pace} } }],
  guides:{ Easy:{what, feel, tip, sessions:{ [phaseId]: ['<b>Warm up</b> 10 min', ...] }}, Intervals, Tempo, Long },
  notes: 'Title: text\nTitle: text'     // rendered at the bottom of the Plan tab
}
state (per plan) = {
  dayRunType:{Mon:'Easy'|'Intervals'|'Tempo'|'Long'|'Rest', ...},   // the weekly pattern, repeats every week
  strengthDays:['Mon','Thu','Sun'],
  completed:{ [week]:{ [day]:{run, strength, dog, steps} } },
  exLog:{ [week]:{ [day]:{ [group]:[ {sets:[bool,bool,bool], weight:'', reps:''} ] } } },
  selectedDay:{week, day},
  strengthWorkouts:[{name, moves:[{text, alts:[]}]}], abFinisher:{moves}
}
```
Helpers: `phaseRanges()`, `phaseForWeek(w)`, `goalPace()`, `parseTime()`,
`fmtTime()`, `ensureWeek(w)`, `clampSelected()`, `loadPlan(id)`,
`syncActive()`, `snapshot()`, `applyData()`, `restore()`.
Dates: `todayISO()`, `mondayOf(iso)`, `addDays(iso,n)`, `dateFor(week,day)`,
`todayCell()` → `{week,day}` or null, `goToToday()`, `planDateLine()`,
`fmtDate()` ("Mon 14 Sep") / `fmtDayMonth()` ("14 Sep").

`exLog[...].sets` is the 3-boolean array; `reps` is the free-text field. Don't
reuse the name `sets` for anything else.

## Calendar dates

`plan.startDate` is optional (Monday of week 1, or `''`). When set,
`todayCell()` maps today to a grid tile, and `loadPlan()` plus saving a
changed start date call `goToToday()` so the app opens on today's session. A
`visibilitychange` listener re-renders and jumps to today when the calendar
date has moved on since the last render, because iOS keeps the PWA resident
and a reload can't be relied on. Any date saved from the editor snaps back to
that week's Monday (`mondayOf`), copies and AI-built plans start undated, and
the old "weeks aren't tied to calendar dates" default note is reworded on load.

## Screens

**Plan tab**
- Header: plan name, "PB → Goal (pace) · N weeks · …" (a dated plan shows
  `Week 3 of 10`, `Starts Mon 21 Sep` or `Finished Sun 22 Nov` instead of
  `N weeks`), three stat boxes, "Plans & settings" button.
- "Your week" card (`details#weekBuilder`): collapsed shows 7 mini chips +
  Edit; open shows a tray of unplaced sessions (Easy/Intervals/Tempo/Long +
  Strength ×3) and 7 day columns. Tap-to-place AND pointer-event drag/drop
  (`makeDraggable`, `dropTargetAt`, `applyDrop`). Opens itself when the week
  is invalid. No explanation text (Cameron removed it — keep it out).
- "Your 10 weeks" grid (`#wkGrid`): rows = weeks (labelled just `1`…`N`),
  columns = bold M T W T F S S. Phase name rows separate the phases. Each
  tile = two-tone badge (pale tile, soft circle, dark glyph), two dots under
  it for dog walk + steps. Tile state: run / strength / rest / part-done /
  done. Tap a tile → day opens in `#dayPanel` below with ‹ › day nav. On a
  dated plan today's tile gets a pink corner pip (`.tile.today`,
  `aria-current="date"`) and the current week's number is ringed
  (`.wk-lbl.today`).
- Day panel: heading `Week 1 · Monday 14 Sep` (date only on a dated plan)
  with a `Today` pill on today; run card (type, pace, summary, "How to run this X session"
  expandable guide with what/feel/this week's session/tip), strength card
  (2-min rest timer, editable exercise names, swap dropdown with ~7
  alternatives each, Set 1/2/3 pills, weight + reps fields, ab finisher),
  dog-walk and 10,000-steps tick boxes.
- Notes block at the bottom (`#refNote`), built from `plan.notes`.

**Plans & settings** (sub-view of Plan, not a tab)
- Your plans list (Use this plan), New plan, Copy current plan.
- Build a plan with AI: API key (stored on phone), model, brief textarea,
  Generate. Calls `https://api.anthropic.com/v1/messages` directly from the
  browser with header `anthropic-dangerous-direct-browser-access: true`,
  sends the current plan as the example shape, expects JSON only, normalises
  via `planFromAI()`, adds as a new plan and opens the editor.
- Edit current plan: all plan fields, including Start date (date input with
  "Start this week" / "Clear date" buttons); phases with per-run-type pace /
  summary / session steps (`*stars*` ↔ `<b>`); run-type descriptions; notes.
  `collectDraft()` → `validateDraft()` → save.
- Backup: Export / Import.
- Danger zone: Reset ticks & logs, Delete plan.

**Progress tab**
- Stats (entries, latest weight, change, average feeling), SVG weight line
  chart (needs ≥2 weigh-ins), log form (date, weight kg, 5 feeling faces,
  notes, photo — shrunk to ≤1200px JPEG via canvas), entry list with
  thumbnails, tap for lightbox, delete.

## Design rules (don't drift)

- Pink ramp only: `--p50`…`--p900` CSS vars. `--p600 #993556` is the brand
  pink. Rest days use the `--rest-*` greys. No new colours.
- Fraunces for headings/display, Inter for body.
- Icons: the filled set in `ICONS` (`svgFill`) — sun = Easy, bolt =
  Intervals, flame = Tempo, road = Long, dumbbell = Strength, moon = Rest,
  tick = Done. Rendered inside a soft circle ("two-tone badge"). Tab bar uses
  the thin outline `svgIcon` set. Cameron rejected emoji, thin-line session
  icons, solid-block icons, letters and abstract shapes — don't go back.
- Plain, short copy. No explanatory paragraphs above controls (removed twice).
- Mobile first: ~375px wide. Grid has 8 columns, so keep tile content tiny.
- Chloe likes being shown 2–3 visual options before a redesign.

## Things that were tried and removed — don't re-add unless asked

- "Drink enough water" habit tick box (removed; dog walk + steps stay).
- Meals tab (low-cal breakfast/lunch/dinner/snacks/dessert) — removed entirely.
- Export/Import buttons on the Plan tab — moved into Plans & settings.
- Explanatory hint text under "Your 10 weeks" and inside the week builder.
- "Wk 1" / "Week 1" labels — grid uses bare numbers.

## Plan content decisions

- Long runs: 45–50 min (Rebuild) → 55–60 with last 10 min moderate (Build) →
  60 min with surges, stretching to 75 min on one or two weeks (Sharpen) →
  race in week 10. Easy effort; 75 min is "sometimes, not every week".
- Paces: race 4:54/km; intervals 400m 1:58 / 800m 3:55 / 1000m 4:54; tempo
  5:20–5:30 → 5:10–5:20 → 5:05–5:10; easy/long ~6:00–6:15 → 5:45–6:00.
- Strength: 3 full-body workouts based on @estherrcooper's TikTok routines,
  rotated across strength days, plus an ab finisher.

## How to work on it

```bash
npm install          # jsdom + fake-indexeddb for tests
npm test             # runs tests/*.test.cjs against index.html
npm run serve        # http://localhost:8080 — use Safari responsive mode at 375px
# Claude Code's browser pane: the `5k-plan` entry in .claude/launch.json (port 4250)
```
Tests drive the DOM with jsdom; `window.scrollTo`, `scrollIntoView`, pointer
capture and `elementFromPoint` are stubbed where needed. `tests/dates.test.cjs`
covers the start date using dates relative to the real clock, and is the only
file that sets a failing exit code on a FAIL — the older three just log. Add a
test when you add a feature. Keep `node -e "new Function(script)"`-style syntax checks
passing; a broken script means a blank app on her phone.

Deploy: drag the folder onto https://app.netlify.com/drop (or push to the
GitHub Pages repo). Bump `CACHE_NAME` first. On the phone: close the app
fully and reopen twice to pick up the new version.

## Possible next steps (not started)

- Live test of the AI plan builder with a real API key (only tested with a
  stub). Check the JSON comes back clean and the paces make sense.
- "Add your own exercise" in the swap dropdown; "reset exercise list" so
  updated defaults reach a plan that has customised exercises.
- Optional: push reminders (needs iOS 16.4+ PWA notification permission).
- Optional: native wrapper via Capacitor if an App Store build is ever wanted
  (needs a Mac + Xcode).
