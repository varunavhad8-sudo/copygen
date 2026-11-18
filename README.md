# CopyGen

CopyGen is an AI-powered copy-generation platform for marketing agencies.

This repository contains both application layers:

- The Express/MongoDB backend lives at the repository root.
- The React/Vite frontend lives in [`frontend/`](frontend/).

## Run locally

Install and start the API from the repository root:

```bash
npm install
npm run dev
```

Install and start the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

### Zero-infrastructure local mode

Set `LOCAL_MODE=true` in the backend `.env` and `VITE_LOCAL_MODE=true` in `frontend/.env`. In this mode the app does not connect to MongoDB, Firebase, Redis, payments, or email. It creates a local workspace automatically. Add one OpenAI, Anthropic, or Gemini key from Settings → AI Providers and use the generator. The key stays in the browser and is sent only to the local backend for the current request; it is not persisted in a database.

The frontend uses `VITE_API_URL` to locate the backend API. Copy `frontend/.env.example` to `frontend/.env` and configure the required Firebase and API settings before running it.

For a hosted multi-user installation, copy `.env.example` to `.env` in this repository, set `LOCAL_MODE=false`, and configure the database/authentication services. Users can add their own OpenAI, Anthropic, or Gemini key from Settings → AI Providers; those keys are encrypted by the backend and are not returned to the browser in full. Set `PROVIDER_KEYS_ENCRYPTION_KEY` to a strong random value and keep it stable across restarts.

## What it does

The frontend provides the landing pages, authentication flow, dashboard, client and brand-voice management, AI content generation, SEO tools, fact checking, analytics, templates, admin controls, and payment screens. The backend exposes the API and handles authentication, MongoDB persistence, AI provider routing, usage limits, payments, file uploads, email, analytics, and scheduled jobs.

## License

CopyGen is released under the MIT License. See [`LICENSE`](LICENSE).
