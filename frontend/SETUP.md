# Frontend Setup — Meraki Web App

Step-by-step guide to set up and run the Meraki frontend built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ (ships with Node.js) |

You will also need:
- A **Supabase** project (same one used by the backend) — [supabase.com](https://supabase.com)
- A **Google Cloud** API key with **Maps JavaScript API** enabled — [console.cloud.google.com](https://console.cloud.google.com)
- The Meraki **backend running** on `http://localhost:8000` (see `backend/SETUP.md`)

---

## 1. Clone and Navigate

```bash
git clone <repo-url>
cd Meraki/frontend
```

---

## 2. Install Dependencies

```bash
npm install
```

This installs all packages defined in `package.json`, including:
- **Next.js 16** + **React 19** — framework and UI
- **@supabase/ssr** + **@supabase/supabase-js** — auth and database client
- **Framer Motion** — animations
- **Tailwind CSS 4** — styling
- **Lucide React** — icons

---

## 3. Configure Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.exemple .env.local
```


### Where to Find These Values

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` `public` key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs & Services → Credentials |
| `CREWAI_API_URL` | Your backend URL (`http://localhost:8000` for local dev) |

---

## 4. Set Up Supabase Authentication

The frontend uses Supabase Auth for user management. Configure it in your Supabase dashboard:

### Email/Password Auth (required)
1. Go to **Authentication → Providers** in your Supabase dashboard
2. Ensure **Email** provider is enabled
3. Under **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

### Google OAuth (optional)
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Set the authorized redirect URI to: `https://<your-project>.supabase.co/auth/v1/callback`
3. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable the Google provider
   - Paste your **Client ID** and **Client Secret**

---

## 5. Set Up the Database

If you haven't already done this during backend setup, run the migration files in your Supabase SQL Editor. The migrations are located in `supabase/migrations/` and must be executed **in order** (001 through 008).

See `backend/SETUP.md` → Step 4 for the full migration table.

---

## 6. Run the Development Server

```bash
npm run dev
```

The app starts on:

```
▲ Next.js 16.1.4
- Local:   http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Verify the Setup

1. **Landing page loads** — You should see the Meraki hero section at `http://localhost:3000`
2. **Auth works** — Click "Get Started" and create an account at `/auth/signup`
3. **Backend connected** — After signing in and taking the quiz, the discovery results should load (requires the backend to be running)
4. **Google Maps loads** — On the local experiences page (`/discover/sampling/[hobby]/local`), the map should render

---

## Build for Production

```bash
npm run build
npm start
```

This creates an optimized production build and starts the server.

---

## Useful Commands Reference

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Troubleshooting

**"NEXT_PUBLIC_SUPABASE_URL is not defined"**
Make sure your env file is named `.env.local` (not `.env`). Next.js only loads `.env.local` automatically in development.

**Auth redirects not working**
Check that your Supabase **Site URL** is set to `http://localhost:3000` and `http://localhost:3000/auth/callback` is in the **Redirect URLs** list.

**Google Maps not loading / gray box**
Ensure the **Maps JavaScript API** is enabled in your Google Cloud project and the API key is set in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

**API calls failing (network errors)**
Make sure the backend is running on the URL specified in `NEXT_PUBLIC_CREWAI_API_URL` (default: `http://localhost:8000`). Check the backend CORS configuration includes your frontend origin.

**Styles not loading / Tailwind not working**
Run `npm install` again to ensure `tailwindcss` and `@tailwindcss/postcss` are installed. Tailwind CSS 4 requires no `tailwind.config` file — it uses the CSS-based configuration in `globals.css`.
