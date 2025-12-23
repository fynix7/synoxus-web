# Deploying the Outlier Scout Service

To enable web-based scouting without requiring users to run local scripts, you must deploy the `scout_v2` folder as a Docker container to a cloud provider.

This service runs a headless Chrome browser with the 1of10 extension and exposes an API endpoint for the web app to trigger.

## Recommended: Deploy to Railway (Easiest)

1.  **Create a GitHub Repository** for just the `scout_v2` folder (or the whole repo, but configure the root).
2.  **Sign up for Railway.app** (Free trial available).
3.  **New Project** -> **Deploy from GitHub Repo**.
4.  **Settings**:
    *   **Root Directory**: `scout_v2`
    *   **Environment Variables**:
        *   `PORT`: `5000` (Railway usually sets this automatically, but good to be safe)
5.  **Wait for Deployment**. Railway will build the Dockerfile and start the service.
6.  **Copy the URL**: It will look like `https://scout-v2-production.up.railway.app`.

## Configure Frontend

Once deployed, you need to tell your Vercel frontend where the scout service is.

1.  Go to your **Vercel Project Settings**.
2.  **Environment Variables**.
3.  Add `VITE_SCOUT_API_URL` with the value of your deployed service URL (e.g., `https://scout-v2-production.up.railway.app`).
4.  **Redeploy** your frontend.

## Testing

1.  Open your deployed website.
2.  Go to Outlier Scout.
3.  Enter a channel URL and click Scout.
4.  It should now work purely via the web!
