# Multi-Business Sales Forecasting & Analytics Platform

Production-quality sales prediction web application powered by **Next.js**, **React 18**, **Tailwind CSS**, **Flask**, **SQLite**, and **Scikit-Learn Random Forest Regressor**.

---

## 🚀 How to Run the Project (Quick Start)

### Option A: One-Click Launcher (Windows)
Double-click [`run_project.bat`](file:///c:/Users/USER/Documents/Implementations/Thaddeaus-Project-main/run_project.bat) at the project root. This opens both backend and frontend servers automatically in separate windows.

---

### Option B: Manual Startup from Terminal

#### 1. Start Flask Backend API (Port 5000)
Open a terminal in the `backend/` folder and run:
```bash
cd backend
.venv\Scripts\python.exe run.py
```
- Backend runs at [`http://localhost:5000`](http://localhost:5000)
- Health check: [`http://localhost:5000/api/health`](http://localhost:5000/api/health)

#### 2. Start Next.js Frontend App (Port 3000)
Open a second terminal in the `frontend/` folder and run:
```bash
cd frontend
npm run dev
```
- Frontend runs at [`http://localhost:3000`](http://localhost:3000)

---

## 🔑 Demo Account Credentials
- **Email**: `demo@forecaster.com`
- **Password**: `password123`

---

## 🛡️ Admin Evaluation Panel
- Navigate to [`http://localhost:3000/admin`](http://localhost:3000/admin) when logged in as administrator to monitor all system datasets, evaluations, MAE/RMSE/$R^2$ scores, and feature importances.
