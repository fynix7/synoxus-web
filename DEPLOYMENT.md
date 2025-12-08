# Deployment Guide for Synoxus Web App

This guide will help you deploy the Synoxus web application to a live domain using Vercel and Supabase. This setup ensures the app is accessible to everyone and data (like CRM tasks and Chat Configuration) is shared and persistent, removing the dependency on local storage.

## Prerequisites

1.  **GitHub Account**: To host your code.
2.  **Vercel Account**: To host the live website (frontend).
3.  **Supabase Account**: To host the database (backend).

---

## Step 1: Set up the Database (Supabase)

1.  Go to [Supabase](https://supabase.com/) and create a new project.
2.  Once the project is created, go to the **SQL Editor** in the left sidebar.
3.  Click **New Query**.
4.  Copy the contents of the `supabase_schema.sql` file located in your project root.
5.  Paste the SQL into the editor and click **Run**. This will create all the necessary tables (`crm_tasks`, `chat_config`, etc.).
6.  Go to **Project Settings** (gear icon) -> **API**.
7.  Copy the **Project URL** and **anon public key**. You will need these for Step 3.

---

## Step 2: Push Code to GitHub

1.  Open your terminal in the project folder.
2.  Initialize a git repository if you haven't already:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
3.  Create a new repository on GitHub.
4.  Follow the instructions on GitHub to push your existing code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git branch -M main
    git push -u origin main
    ```

---

## Step 3: Deploy to Vercel

1.  Go to [Vercel](https://vercel.com/) and log in.
2.  Click **Add New...** -> **Project**.
3.  Select your GitHub repository (`synoxus-web` or whatever you named it) and click **Import**.
4.  In the **Configure Project** screen, find the **Environment Variables** section.
5.  Add the following variables using the values from Step 1:
    *   `VITE_SUPABASE_URL`: Your Supabase Project URL
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key
6.  Click **Deploy**.

---

## Step 4: Verify Live Site

1.  Once deployment is complete, Vercel will give you a live URL (e.g., `https://synoxus-web.vercel.app`).
2.  Visit the URL.
3.  Log in to the portal (Key: `synoxus`, User: `admin` or `synoxus2004`).
4.  Test the **CRM** (add a task) and **Chat Configuration** (save a persona).
5.  Refresh the page or open it in a new browser/incognito window to verify the data persists.

## Updating the Site

To update the live site, simply make changes in your local code, commit them, and push to GitHub:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel will automatically detect the push and redeploy your site within minutes.
