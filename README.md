# Think Clear, Decide Well

A self-help book landing page about soft skills, computer soft skills and data-driven career decisions.

- **Skills** page: 20 skill lessons (pop-ups with knowledge, official links and books) and a progress tracker
- **Data** page: data analyst → data science → AI innovation roadmap, plus leader profiles
- **Media** page: podcast, BBC, TIME, Forbes rich lists, and a "get the right data" mentor guide
- **Backend** (optional): Google Sheet + Google Apps Script stores the reader list and anonymous progress

## How it works

```
Browser (GitHub Pages: index.html)
        │  fetch() JSON
        ▼
Google Apps Script web app  (backend/Code.gs, runs on Google Cloud)
        │  SpreadsheetApp
        ▼
Google Sheet  (tabs: Subscribers, Progress)
```

GitHub Actions deploys the site automatically on every push to `main`.
Another workflow can deploy the Apps Script backend automatically (optional).

## Repository layout

```
.
├── index.html                      the whole site (HTML + CSS + JS)
├── config.js                       holds the backend URL (filled in by CI)
├── .nojekyll
├── backend/
│   ├── Code.gs                     Apps Script backend
│   ├── appsscript.json             manifest (web app, runs as you)
│   └── .clasp.json.example
└── .github/workflows/
    ├── pages.yml                   deploys the site to GitHub Pages
    └── apps-script.yml             optional: deploys the backend with clasp
```

## Quick start (about 15 minutes)

You need: a Google account, a GitHub account, and Git installed.

### Step 1 — Create the Google Sheet and backend

1. Go to <https://sheets.google.com> and create a blank sheet named **Think Clear Reader Data**.
2. Open **Extensions → Apps Script**. A script editor opens, attached to this sheet.
3. Delete the sample code and paste the contents of `backend/Code.gs`.
4. Open **Project Settings** (gear icon), tick **Show "appsscript.json" manifest file in editor**, go back to the editor, open `appsscript.json` and paste the contents of `backend/appsscript.json`.
5. In the editor choose the function **setup** and click **Run**. Approve the permission request (it only asks for access to spreadsheets). This creates the tabs `Subscribers` and `Progress`.

### Step 2 — Deploy the backend as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon, choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy** and copy the **Web app URL**. It ends with `/exec`.
5. Test it in your browser. You should see: `{"ok":true,"service":"think-clear-decide-well"}`.

Test the reader list from a terminal (replace the URL):

```bash
curl -L -X POST "YOUR_EXEC_URL" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"subscribe","name":"Test","email":"test@example.com","goal":"Data Analyst","consent":true}'
```

A new row should appear in the `Subscribers` tab.

> Whenever you change `Code.gs`, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**.
> The URL stays the same. Creating a *new* deployment gives a new URL.

### Step 3 — Put the project on GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### Step 4 — Turn on GitHub Pages (CI/CD)

1. In your repo go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Go to **Settings → Secrets and variables → Actions → Variables → New repository variable**.
   - Name: `APPS_SCRIPT_URL`
   - Value: the `/exec` URL from Step 2
4. Open the **Actions** tab, select **Deploy site to GitHub Pages**, click **Run workflow**.
5. When it turns green, your site is live at `https://YOUR_USER.github.io/YOUR_REPO/`.

From now on, every push to `main` redeploys the site. The workflow:
1. checks that the three pages exist (smoke check),
2. copies the site files into `_site/` and writes your backend URL into `config.js`,
3. uploads and deploys the Pages artifact.

### Step 5 — Check everything works

- Open the site, tick a skill as completed, wait a moment: a row appears in the `Progress` tab.
- Fill in the **Join the reader list** form: a row appears in `Subscribers`.
- If the form says "backend URL not set", check the `APPS_SCRIPT_URL` variable and re-run the workflow.

## Optional: CI/CD for the Apps Script backend (clasp)

This lets GitHub deploy `backend/` automatically when you change it.
Do Steps 1 and 2 by hand first, because you need an existing deployment.

### A. Link a Google Cloud project (recommended)

1. In <https://console.cloud.google.com> create or choose a project.
2. In the Apps Script editor open **Project Settings → Google Cloud Platform (GCP) Project → Change project** and enter the project number. (Apps Script then logs errors to that project in Cloud Logging.)
3. In the Cloud project, **APIs & Services → Library**: enable **Apps Script API**.
4. Go to <https://script.google.com/home/usersettings> and switch **Google Apps Script API** to **On**.

### B. Collect the values

On your computer:

```bash
npm install -g @google/clasp@2.4.2
clasp login            # opens a browser; creates ~/.clasprc.json
```

| Value | Where to find it |
|---|---|
| `SCRIPT_ID` | Apps Script editor → Project Settings → **Script ID** |
| `DEPLOYMENT_ID` | Deploy → Manage deployments → the Web app row → **Deployment ID** (starts with `AKfy…`) |
| `CLASPRC_JSON` | the full contents of the file `~/.clasprc.json` |

### C. Add them to GitHub

**Settings → Secrets and variables → Actions**

- Secrets: `SCRIPT_ID`, `DEPLOYMENT_ID`, `CLASPRC_JSON`
- Variable: `ENABLE_APPS_SCRIPT_DEPLOY` = `true`

Now a push that changes `backend/**` runs **Deploy Apps Script backend**: it pushes the code and redeploys your existing web app, so the URL does not change.

> `CLASPRC_JSON` holds your personal Google login token. Keep it only in GitHub Secrets, never commit it, and use a dedicated Google account if you can. These tokens can expire or be revoked. If the workflow starts failing with an auth error, run `clasp login` again and update the secret.

## Local development

```bash
python -m http.server 8000
# open http://localhost:8000
```

For local testing paste your `/exec` URL into `config.js` (do not commit private URLs if you prefer to keep them secret).

## Security and privacy notes

- The web app is public ("Anyone"). The URL is visible in the browser. Do not put secrets in `config.js` or `index.html`.
- The backend validates email format, limits text length, blocks spreadsheet formulas, ignores a hidden honeypot field, and never returns emails from any endpoint.
- Progress is stored under a random ID kept in the visitor's browser. It contains no personal data.
- Keep the Google Sheet private. Share it only with people who must see the reader list.
- You collect email addresses: add a short privacy notice and a way to unsubscribe (delete the row) to follow your local data-protection rules.
- Apps Script has daily quotas. It is suitable for a book landing page, not for heavy traffic.

## Troubleshooting

| Problem | Fix |
|---|---|
| Pages workflow fails at deploy | Settings → Pages → Source must be **GitHub Actions** |
| Form says backend URL not set | Add `APPS_SCRIPT_URL` as a repository **variable**, re-run the workflow |
| Nothing is written to the sheet | Re-deploy as **New version**; check **Who has access: Anyone** |
| Browser blocks the request | Use the URL ending in `/exec`, not `/dev` |
| `clasp` auth error in CI | Run `clasp login` again and update `CLASPRC_JSON` |
| "Apps Script API has not been used" | Enable it in Cloud Console and in script.google.com/home/usersettings |

## Updating content

Edit the data arrays in `index.html` (skills `S` and `C`, roadmap `RM`, leaders `PP`, media `MD`), commit and push. GitHub Actions redeploys automatically.

## Licence

Add your own licence here.
