# Deployment Guide

Detailed steps to deploy the ConceptBIM AI platform to production.

---

## 1. Frontend: Deploying to Vercel
Vercel is optimized for static React apps:

1. Import your project repository into Vercel.
2. Select `/client` as the root directory.
3. Configure the build settings:
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Set the environment variable:
   * `VITE_API_BASE_URL` (URL of your deployed backend service on Render).
5. Click **Deploy**.

---

## 2. Backend: Deploying to Render.com
Render is optimized for Web Service nodes:

1. Select **New Web Service** in Render.
2. Link your project repository.
3. Configure settings:
   * **Root Directory:** `server`
   * **Runtime:** Node
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
4. Configure environment variables:
   * `PORT=3001`
   * `GROQ_API_KEY` (Your Groq API key).
5. Click **Deploy**.
