# Deploying LifeFlow to Microsoft Azure (No Docker/Jenkins)

This guide explains how to host your project on **Azure App Service** using the native **GitHub Actions** integration (automatically set up by Azure).

## Architecture
You will deploy two separate "Web Apps":
1.  **Backend (API):** Node.js server (`/server` folder)
2.  **Frontend (UI):** Next.js app (`/client` folder)

---

## Part 1: Prepare the Backend (Server)

### 1. Create the App Service
1.  Log in to the [Azure Portal](https://portal.azure.com).
2.  Search for **"App Services"** -> **Create**.
3.  **Basics:**
    *   **Resource Group:** Create new (e.g., `LifeFlow_RG`).
    *   **Name:** Unique name (e.g., `lifeflow-api-prod`). This becomes `https://lifeflow-api-prod.azurewebsites.net`.
    *   **Publish:** "Code".
    *   **Runtime stack:** "Node 20 LTS" (or match your local version).
    *   **Operating System:** "Linux" (Recommended).
    *   **Region:** Select one close to you (e.g., `East US`).
    *   **Pricing Plan:** Free (F1) or Basic (B1).
4.  **Review + create**.

### 2. Configure Environment Variables
1.  Go to your new App Service -> **Settings** -> **Environment variables**.
2.  Add the variables from your local `.env`:
    *   `MONGODB_URI`: (Your Atlas Connection String)
    *   `AZURE_OPENAI_ENDPOINT`: ...
    *   `AZURE_OPENAI_API_KEY`: ...
    *   `AZURE_OPENAI_DEPLOYMENT_NAME`: ...
    *   `AZURE_SEARCH_ENDPOINT`: ...
    *   `AZURE_SEARCH_KEY`: ...
    *   `OPENROUTER_API_KEY`: ...
3.  **Important:** Do NOT add `PORT`. Azure handles this automatically.

### 3. Deploy Code
1.  Go to **Deployment** -> **Deployment Center**.
2.  **Source:** Select "GitHub".
3.  **Authorize** your GitHub account.
4.  **Organization/Repository/Branch:** Select your repo (`LifeFlow-AI`) and branch (`main` or your feature branch).
5.  **Build Provider:** "GitHub Actions".
6.  **Runtime Stack:** Node.js.
7.  **Version:** Node 20.
8.  **Save**.
9.  **Critical Step:** Azure will try to deploy the *root*. You need to tell it to deploy the `server` folder.
    *   Go to your local code, pull the latest changes (Azure created a `.github/workflows` file).
    *   Open the new `.yml` file in `.github/workflows`.
    *   Find the logic that says `working-directory` or `defaults`. If missing, you might need to edit the workflow to run `npm install` inside `./server`.
    *   *Alternative (Easiest):* Use the **"Kudu"** (Local Git) method if GitHub Actions fails with monorepos.
        *   **Source:** "Local Git".
        *   **Save**.
        *   Copy the **Git Clone Uri** from the Essentials dashboard.
        *   Run locally: `git remote add azure-api <paste-url>`
        *   Deploy: `git subtree push --prefix server azure-api master`

---

## Part 2: Prepare the Frontend (Client)

### 1. Update Frontend Configuration
Before deploying, the frontend needs to know the *Production Backend URL*.
1.  Open `client/store/workflowStore.js` (or wherever you fetch API).
2.  Ensure it points to your new backend URL (e.g., `https://lifeflow-api-prod.azurewebsites.net`) instead of `localhost:5000`.
    *   *Best Practice:* Use an environment variable `NEXT_PUBLIC_API_URL`.
    *   In `next.config.js` or your fetch calls, use `process.env.NEXT_PUBLIC_API_URL`.

### 2. Create the App Service
1.  Create a second App Service (e.g., `lifeflow-web-prod`).
2.  Runtime: **Node 20 LTS** (Linux).
3.  Plan: Same as backend.

### 3. Configure Build Variables
1.  Go to App Service -> **Settings** -> **Environment variables**.
2.  Add:
    *   `NEXT_PUBLIC_API_URL`: `https://lifeflow-api-prod.azurewebsites.net` (Your backend URL)

### 4. Deploy Code
1.  Go to **Deployment Center** -> **GitHub**.
2.  Select Repo/Branch.
3.  **Save**.
4.  **Monorepo Fix:** Again, because the client is in `/client`, you must edit the GitHub Actions workflow file that Azure generates (ends with `.yml`).
    *   Change `package-path: .` to `package-path: ./client` (or similar depending on the action).
    *   Or use the `git subtree` method:
        *   `git remote add azure-web <paste-web-app-git-url>`
        *   `git subtree push --prefix client azure-web master`

---

## Part 3: Allow Network Access (MongoDB)
1.  Go to **MongoDB Atlas** -> **Network Access**.
2.  Add IP Address: `0.0.0.0/0` (Allow Access from Anywhere).
    *   *Note:* This is easiest for Azure dynamic IPs. For better security, find the "Outbound IP Addresses" in your Azure App Service -> Networking properties and add only those.

## Summary of Commands (Local Git Method)
If Deployment Center fails because of the folder structure:
```bash
# Deploy Server
git remote add azure-api https://<app-name>.scm.azurewebsites.net/<app-name>.git
git subtree push --prefix server azure-api master

# Deploy Client
git remote add azure-web https://<app-name>.scm.azurewebsites.net/<app-name>.git
git subtree push --prefix client azure-web master
```
