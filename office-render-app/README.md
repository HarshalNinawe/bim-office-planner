# Office Architecture Render App

Collects site/plot size and office building requirements (floors, workstations,
meeting rooms, windows, entrance style, facade, etc.) through a form, then
generates an exterior render using xAI's Grok image API (`grok-2-image`, via
`POST https://api.x.ai/v1/images/generations`).

## Why there's a small backend

xAI's image API doesn't send CORS headers for browser requests, and you never
want an API key sitting in client-side JavaScript. So `server.js` is a thin
proxy: the browser form posts your inputs (and your key) to your own local
server, which forwards the request to xAI and returns the image URL.

## Setup

```bash
cd office-render-app
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

## Using it

1. Fill in site dimensions, floors, workstation count, meeting rooms, style,
   window/entrance details, and any extra notes.
2. Paste your xAI API key (get one from https://console.x.ai) into the
   "xAI (Grok) API key" field. It's sent only to your own local server for
   that one request — it isn't stored anywhere.
3. Click **Generate render**. The app builds a descriptive prompt from your
   inputs, calls the Grok image API, and displays the resulting image plus
   the exact prompt that was sent.

## Notes

- `XAI_IMAGE_MODEL` in `server.js` is currently set to `"grok-2-image"`. If
  xAI has since renamed or added new image models (e.g. a newer
  `grok-imagine-image-*` model), change that one constant to match — the
  rest of the code stays the same.
- The `.env` approach: if you'd rather not paste your key into the form
  every time, you can hardcode it as a fallback in `server.js` by reading
  `process.env.XAI_API_KEY`, but keep that file out of version control if
  you do.
- Image generation can take 20–60 seconds depending on load.
