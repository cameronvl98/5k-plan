# 5K Plan — installable iPhone app (PWA)

This folder is the whole app. Host it on any free static site and it installs
to an iPhone home screen like a normal app: own icon, full screen, works offline,
and Chloe's progress saves on the phone automatically.

Files:
- `index.html` — the app
- `manifest.webmanifest` — tells iOS the app name, icon and colours
- `sw.js` — service worker, caches the app so it opens with no signal
- `icon-180.png`, `icon-192.png`, `icon-512.png` — home screen icons

## 1. Put it online (pick one)

**Option A — Netlify Drop (fastest, about 2 minutes)**
1. Go to https://app.netlify.com/drop
2. Drag this whole folder onto the page
3. It gives you a link like `https://something-random.netlify.app`
4. Optional: rename the site in Site settings so the link is tidier

**Option B — GitHub Pages**
1. Make a new repo (public or private both work for Pages on a paid plan; public is simplest)
2. Upload these files to the root of the repo
3. Settings → Pages → Source: "Deploy from a branch" → main / root → Save
4. Link is `https://<username>.github.io/<repo-name>/`

Either way the link must be `https://` — the service worker won't run on plain `http://`.

## 2. Install on Chloe's iPhone

1. Open the link in **Safari** (not Chrome, not the Gmail in-app browser — iOS only installs from Safari)
2. Tap the Share button (square with an arrow)
3. Scroll down, tap **Add to Home Screen**
4. Tap **Add**

Done. Open it from the icon from now on. Progress saves as she taps.

If Safari is missing from the phone: Settings → Screen Time → Content & Privacy
Restrictions → Allowed Apps → make sure Safari is on.

## 3. Updating the app later

1. Edit `index.html`
2. In `sw.js`, change `CACHE_NAME` (e.g. `5k-plan-v1` → `5k-plan-v2`)
3. Re-upload the folder
4. On the phone, close the app fully and reopen it twice — the new version loads

## Plans

Tap "Plans & settings" at the top of the Plan tab to edit the current plan
(name, distance, PB, goal, weeks, phases, paces, session steps, notes), start a
new plan, copy the current one, or switch between plans. Each plan keeps its
own ticks and logs. Progress photos and weight entries are shared across plans.

Set a **Start date** in Edit current plan (or tap "Start this week") and the
grid marks today, the header shows which week she's in, and the app opens on
today's session. Leave it blank and weeks stay unnumbered by date.

## Backups

Progress lives in Safari's storage on the phone. It survives closing the app
and restarting the phone. It will be lost if she clears Safari website data or
deletes the icon. Tap **Export backup** every so often to download a JSON file,
and **Import backup** to restore it.
