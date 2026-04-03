# Deployment Guide (Vercel + Render)

This project is best deployed as:
- **Frontend (Vite React):** Vercel
- **Backend (Express API):** Render (or Railway)

## 1) Deploy Backend (Render)

1. Push this repo to GitHub.
2. Go to Render → **New +** → **Web Service**.
3. Connect your GitHub repo and set:
   - **Root Directory:** `FYP`
   - **Build Command:** `npm install && npm run server:build`
   - **Start Command:** `npm run server:start`
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=10000` (or leave Render default)
   - `MONGODB_URI=<your mongodb atlas uri>`
   - `JWT_SECRET=<strong random secret>`
   - `GOOGLE_CLIENT_ID=<google oauth client id>`
   - `EMAIL_USER=<gmail address>`
   - `EMAIL_PASSWORD=<gmail app password>`
   - `OCR_SPACE_API_KEY=<ocr api key>`
   - `GEMINI_API_KEY=<gemini key>`
   - `GEMINI_MODEL=gemini-2.0-flash-exp` (optional)
5. Deploy and copy backend URL, e.g. `https://your-backend.onrender.com`.

Set this in backend env too:
- `FRONTEND_URL=<your vercel frontend url>`

## 2) Deploy Frontend (Vercel)

1. Go to Vercel → **Add New Project** and import same repo.
2. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `FYP`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variables:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
   - `VITE_GOOGLE_CLIENT_ID=<google oauth client id>`
4. Deploy.

`vercel.json` is included so React Router routes work on refresh.

## 3) Final Production Settings

After frontend is live:
1. Copy Vercel app URL.
2. Update backend `FRONTEND_URL` on Render to that URL.
3. Redeploy backend.

## 4) Optional: Railway for Backend

If you prefer Railway:
- Build command: `npm install && npm run server:build`
- Start command: `npm run server:start`
- Add the same backend environment variables listed above.

## Local sanity before deploy

```bash
npm install
npm run build
npm run server:build
```
