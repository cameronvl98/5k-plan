Paste this as your first message in Claude Code, from inside the unzipped 5k-plan folder:

---

This folder is a finished, working PWA for my wife Chloe's running training plan.
Read CLAUDE.md first — it has the architecture, storage layout, data model,
design rules and a list of things we tried and removed. Then run `npm install`
and `npm test` to confirm everything passes before changing anything.

Ground rules:
- Keep it a single index.html with no framework and no build step.
- Bump CACHE_NAME in sw.js every time index.html changes.
- Stick to the pink palette, the Fraunces/Inter fonts and the two-tone badge icons.
- Short plain copy, no explanatory text above controls.
- Add a jsdom test for anything you add.

First job: [describe what you want next — e.g. "add a start date to each plan
so the grid highlights today" or "test the AI plan builder with my API key"].
