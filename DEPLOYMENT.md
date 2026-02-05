# Deploying TitanLift

This guide explains how to deploy the TitanLift application (Backend + Frontend + Database).

## 🚀 Free Tier Strategy (Zero Cost)

You can host this entire stack for **free** by splitting the services across specialized providers.

| Service | Provider | Why? |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** / Netlify | Excellent free tier for React/SPA sites. Global CDN. |
| **Backend** | **Render** / Koyeb | Allows running Docker containers or Rust binaries for free. |
| **Database** | **Neon** / Supabase | Managed PostgreSQL with a generous free tier. |

---

### Step 1: Database (Neon / Supabase)
1. Go to [Neon.tech](https://neon.tech) and create a free account.
2. Create a new project.
3. Copy the **Connection String** (e.g., `postgres://user:pass@ep-xyz.region.aws.neon.tech/neondb?sslmode=require`).
   > ⚠️ **Important:** Ensure you append `?sslmode=require` if it's not present.

### Step 2: Backend (Render)
1. Fork/Push your `titanlift` code to GitHub.
2. Log in to [Render.com](https://render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. **Configuration:**
   - **Name:** titanlift-backend
   - **Root Directory:** `backend`
   - **Environment:** `Rust`
   - **Build Command:** `cargo build --release --bin backend`
   - **Start Command:** `./target/release/backend`
   - **Health Check Path:** `/`
6. **Environment Variables:**
   - `DATABASE_URL`: Paste your Neon connection string from Step 1.
   - `RUST_LOG`: `info`
   - `PORT`: `10000` (Render sets this automatically, but our app now reads it!).
7. Click **Create Web Service**. Wait for the build to finish.
8. **Copy your Backend URL** (e.g., `https://titanlift-backend.onrender.com`).

### Step 3: Frontend (Vercel)
1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your `titanlift` GitHub repository.
4. **Configuration:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables:**
   - Create a file `.env.production` in your frontend folder OR add this env var in Vercel settings:
   - `VITE_API_BASE_URL`: Your Render Backend URL from Step 2 (e.g., `https://titanlift-backend.onrender.com`).
   > **Note:** The current frontend code proxies `/api` calls. For production, you may need to update `frontend/src/api/client.ts` to use a full URL if not on the same domain, OR configure Vercel Rewrites.

#### Setting up Vercel Rewrite (Recommended)
To avoid CORS issues, simple add a `vercel.json` to your `frontend` folder:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RENDER-BACKEND-URL.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 💻 Local Docker Deployment

To run the entire stack locally on your machine:

1. **Start the services:**
   ```bash
   docker compose up --build -d
   ```
   This will:
   - Build the backend Rust application.
   - Build the frontend React application.
   - Start a PostgreSQL database.
   - Connect everything together.

2. **Access the App:**
   - Frontend: `http://localhost:8080`
   - API: `http://localhost:3000`

3. **Stop the services:**
   ```bash
   docker compose down
   ```
