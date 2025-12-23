# 🚀 Easy Deployment Guide

To make the Scout feature work for **everyone on the web** (without your laptop running), you need to put the `scout_v2` service on the cloud.

I have set up everything to make this as easy as possible. Choose **ONE** option below:

## Option 1: Render (Easiest & Free)

1.  **Push this code to GitHub** (if you haven't already).
2.  **[Click Here to Sign Up for Render](https://dashboard.render.com/register)**.
3.  Click **"New +"** -> **"Blueprint"**.
4.  Connect your GitHub repository.
5.  It will automatically detect the `render.yaml` file I created.
6.  Click **"Apply"**.
7.  Wait for it to deploy (it will turn green).
8.  **Copy the URL** (e.g., `https://outlier-scout-service.onrender.com`).
9.  Go to your Vercel Project -> Settings -> Environment Variables.
10. Add `VITE_SCOUT_API_URL` with that URL.
11. Redeploy Vercel. **Done!**

## Option 2: Railway (Faster)

1.  **Push this code to GitHub**.
2.  **[Click Here to Sign Up for Railway](https://railway.app)**.
3.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
4.  Select your repo.
5.  Click **"Variables"** and add `PORT` = `5000`.
6.  Click **"Settings"** -> **"Generate Domain"**.
7.  **Copy that Domain**.
8.  Go to your Vercel Project -> Settings -> Environment Variables.
9.  Add `VITE_SCOUT_API_URL` with `https://<your-domain>`.
10. Redeploy Vercel. **Done!**

---

## Why do I need this?
The "1of10 Chrome Extension" requires a full web browser to run. Vercel's standard hosting cannot run a full browser. These services (Render/Railway) provide a "container" that CAN run the browser invisibly for you.
