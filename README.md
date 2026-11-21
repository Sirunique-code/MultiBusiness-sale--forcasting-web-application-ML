# Multi-Business Sales Forecasting & Analytics Platform

Production-quality sales prediction web application powered by **Next.js**, **React 18**, **Tailwind CSS**, **Flask**, **SQLite**, and **Scikit-Learn Random Forest Regressor**.

Configured as a **unified full-stack repository** ready for one-click deployment to **Vercel** as well as local development.

---

## 🚀 How to Run the Project (Quick Start)

### Option A: One-Click Launcher (Windows)
Double-click [`run_project.bat`](file:///c:/Users/USER/Documents/Implementations/Thaddeaus-Project-main/run_project.bat) at the project root. This opens both backend and frontend servers automatically in separate windows.

---

### Option B: Manual Startup from Terminal

#### 1. Start Flask Backend API (Port 5000)
Open a terminal in the project root:
```bash
cd backend
.venv\Scripts\python.exe run.py
```
- Backend runs at [`http://localhost:5000`](http://localhost:5000)
- Health check: [`http://localhost:5000/api/health`](http://localhost:5000/api/health)

#### 2. Start Next.js Frontend App (Port 3000)
In another terminal at the project root:
```bash
npm run dev
```
- Frontend runs at [`http://localhost:3000`](http://localhost:3000)
- All `/api/*` calls are automatically routed to the Flask backend.

---

## ☁️ Deployment on Vercel (Unified Single Project)

This repository is structured as a unified project:
- **Root `package.json`**: Vercel automatically detects Next.js at the repository root.
- **`api/index.py`**: Vercel automatically deploys the Flask backend as Python Serverless Functions.
- **`vercel.json` & `next.config.ts`**: Maps all `/api/*` routes directly to the Flask serverless handlers without CORS or port configuration.
- **Serverless SQLite**: Automatically initializes and persists pre-seeded demo databases and models in the `/tmp` writable environment during runtime.

Simply connect this repository to **Vercel** with default settings (Root Directory: `./`, Framework: Next.js) and click **Deploy**.

---

## 🔑 Demo Account Credentials
- **Email**: `demo@forecaster.com`
- **Password**: `password123`

---

## 🛡️ Admin Evaluation Panel
- Navigate to [`/admin`](http://localhost:3000/admin) when logged in as administrator to monitor all system datasets, evaluations, MAE/RMSE/$R^2$ scores, and feature importances.
