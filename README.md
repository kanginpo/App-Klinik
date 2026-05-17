# PhysioCare – Clinic Management App

A full-featured physiotherapy clinic management app built with **Next.js 15**, **React 19**, and **Tailwind CSS**. All data is stored locally in the browser (no server, no database required).

## Features

- 📊 **Dashboard** — Revenue/cost charts, upcoming appointments at a glance
- 🧑‍⚕️ **Patients** — Add, search, and manage patient records
- 📅 **Schedule** — Interactive calendar with appointment management and status tracking
- 💰 **Finance** — Revenue & expense tracking with CSV export
- ⚙️ **Settings** — JSON backup/restore, clear all data

---

## Deploy to Vercel (recommended)

### One-click from GitHub

1. Push this folder to a new GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Click **Deploy** — no environment variables needed!

Vercel auto-detects Next.js. Your app will be live at `https://your-project.vercel.app`.

### From Vercel CLI

```bash
npm install -g vercel
cd clinic-management-app
vercel
```

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

| Package | Version |
|---|---|
| Next.js | ^15.2 |
| React | ^19 |
| Tailwind CSS | ^3.4 |
| Recharts | ^2.12 |
| date-fns | ^3.6 |
| lucide-react | ^0.460 |

---

## Data & Privacy

All data is stored in **localStorage** on your device. Nothing is sent to any server. Use the **Settings → Export Backup** feature to back up your data as a JSON file.
