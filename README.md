# Carla's Learn

Simple static quiz site built with HTML/CSS/vanilla JS. Designed to be hosted on GitHub Pages.

Features
- Read course manifest from `/courses/index.json` and load course JSON files.
- Single page app with hash routing.
- Module-based quiz: one question per view, immediate feedback, discussion shown.
- Saves last submit per module to localStorage using key prefix `carla_learn_v1`.
- Accessible basics: keyboard navigable, focus outlines, ARIA roles for list items.

Files
- `index.html` — entry
- `styles.css` — styling (pink theme)
- `app.js` — main app logic
- `/courses/index.json` — manifest (array of filenames)
- `/courses/cyber_media.json` — sample course

How to deploy to GitHub Pages
1. Create a new GitHub repository (or use existing).
2. Copy all files (including `/courses`) into the repo root and commit.
3. Push to GitHub: `git push origin main` (or your branch).
4. Go to repository Settings → Pages. Under 'Build and deployment', choose branch `main` (or your branch) and folder `/ (root)` then Save.
5. After a few minutes your site will be available at `https://<username>.github.io/<repo>`.

How to add a new course
1. Create a JSON file following the schema (see `courses/cyber_media.json`).
2. Upload the JSON to `/courses` in the repository.
3. Edit `/courses/index.json` and add the filename string to the array, e.g. `"new_course.json"`.
4. Commit & push; the site will automatically show the new course.

Local storage details
- Key: `carla_learn_v1.scores` — a JSON object mapping `"<courseFile>#<moduleId>"` to `{ score, total, timestamp }`.

Manual test checklist
- [ ] Open homepage: manifest loads and cards appear (Dev info shows count).
- [ ] Click a course: course page shows modules and counts.
- [ ] Start module: questions shown one by one, can select option via keyboard and click Submit.
- [ ] After answer: feedback appears, correct/incorrect styles visible, and discussion shown.
- [ ] Finish module: final score shown; localStorage updated (`carla_learn_v1.scores`).
- [ ] Reload: course page still shows last submit history for module.

Notes & developer hints
- All fetches are relative: `fetch('./courses/index.json')` and `fetch('./courses/<file>')`.
- GitHub Pages won't list directories; that's why the manifest (`courses/index.json`) is required.
- If you add large course JSON files, the app shows a loading state.

Accessibility
- Buttons use focus outlines. Option items are rendered as buttons with `role=listitem` and `aria-pressed` on selection.

If you want enhancements
- Add images for course covers, richer history UI, or export/import scores.
