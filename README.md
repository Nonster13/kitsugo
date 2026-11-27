# Kitsugo

A Japanese-learning web app starter built with plain HTML, CSS and JavaScript.

## Files
- `index.html` — app layout and pages
- `style.css` — responsive visual design
- `data.js` — starter vocabulary, kanji and quiz content
- `app.js` — navigation, learning interactions and local progress
- `manifest.json` — installable web app metadata
- `service-worker.js` — basic offline caching

## Run locally
Open `index.html` in a browser. For service-worker/PWA testing, use a local web server or deploy over HTTPS.

## Publish with GitHub Pages
1. Upload all files to the root of your `kitsugo` repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`, then save.
5. Wait for GitHub Pages to publish the site.

Progress is currently saved in the browser using localStorage. It does not sync between devices yet.
