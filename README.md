# 5K Plan — installable iPhone app (PWA)

This folder is the whole app. Host it on any free static site and it installs
to an iPhone home screen like a normal app: own icon, full screen, works offline,
and Chloe's progress saves on the phone automatically.

Files:
- `index.html` — the app
- `manifest.webmanifest` — tells iOS the app name, icon and colours
- `sw.js` — service worker, caches the app so it opens with no signal
- `icon-180.png`, `icon-192.png`, `icon-512.png` — home screen icons

## 1. Where it lives

Live at **https://cameronvl98.github.io/5k-plan/** — GitHub Pages, served from
the `main` branch of https://github.com/cameronvl98/5k-plan (a public repo:
Pages on the free plan needs that). Every push to `main` redeploys in about a
minute.

Fallback if GitHub is ever a problem: log in to Netlify and drag this folder
onto https://app.netlify.com/drop. Either way the link must be `https://` —
the service worker won't run on plain `http://`.

## 2. Install on Chloe's iPhone

1. Open https://cameronvl98.github.io/5k-plan/ in **Safari** (not Chrome, not the Gmail in-app browser — iOS only installs from Safari)
2. Tap the Share button (square with an arrow)
3. Scroll down, tap **Add to Home Screen**
4. Tap **Add**

Done. Open it from the icon from now on. Progress saves as she taps.

If Safari is missing from the phone: Settings → Screen Time → Content & Privacy
Restrictions → Allowed Apps → make sure Safari is on.

## 3. Updating the app later

1. Edit `index.html`
2. In `sw.js`, change `CACHE_NAME` (e.g. `5k-plan-v26` → `5k-plan-v27`)
3. `npm test`, then commit and `git push` — Pages rebuilds in about a minute
4. On the phone, close the app fully and reopen it twice — the new version loads

## iOS app (Capacitor)

The same app also builds as a native iPhone app: `ios/App/App.xcodeproj`.

1. After changing `index.html`: `npm run ios:sync`
2. `npm run ios:open`, pick your team if Xcode asks, bump the version/build
   number in the App target
3. Product → Archive → Distribute App → TestFlight. Chloe installs it from the
   TestFlight app on her phone (invite her Apple ID as a tester once).

First time only: create the app in App Store Connect (My Apps → + → New App,
bundle id `com.cameronvl.trainingplan`, name "5K Plan"); Xcode also offers to
do this during Distribute. A signed build already sits in `ios/App/output/`
and in Xcode's Organizer (Window → Organizer → Archives).

Inside the app, **Export backup** opens the share sheet (Save to Files, AirDrop,
Mail) instead of downloading. The app keeps its own data, separate from the
Safari version — use Export/Import to move progress across.

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
