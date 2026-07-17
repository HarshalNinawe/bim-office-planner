# ConceptBIM AI: AI-Assisted Interactive Office Planning Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue.svg)](#)
[![React](https://img.shields.io/badge/react-19-blue.svg)](#)
[![Vite](https://img.shields.io/badge/vite-8-purple.svg)](#)
[![Express](https://img.shields.io/badge/express-4-lightgrey.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#)

ConceptBIM AI is a lightweight conceptual Building Information Modeling (BIM) dashboard. It enables designers to model building footprints, analyze structural quantities in real-time, audit zoning constraints, and interact with an AI Copilot command palette to automate architectural design adjustments.

---

## 📸 Screenshots

*(Place screenshots of the Interactive SVG Canvas and Recharts Analytics Dashboard here)*

---

## 🌟 Key Features

* **Interactive SVG Vector Canvas:** Mouse-wheel zoom, middle-click pan, element spawning, object selection, and drag-rotate-resize handles.
* **Deterministic Quantity Takeoff Engine:** Computes concrete volume ($m^3$), steel mass ($kg$), glass area ($m^2$), bricks count, HVAC thermal scores, and project duration in real-time.
* **Regulatory Compliance Auditor:** Automated warning notifications for site boundary violations, overlapping shapes, Green Space ratios (< 15%), and fire safety buffer zones.
* **Recharts Analytics & Scenario Comparison:** Live cost distribution pie charts and side-by-side scenario comparisons.
* **AI Command Palette (`Ctrl + K`):** Uses Llama 3.3 via Groq to parse design prompts into structured updates.
* **AI Copilot Drawer:** Generates Markdown spreadsheets and executive proposals with local rule-based fallbacks.

---

## 🛠 Tech Stack

* **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Zustand (with undo/redo timeline).
* **Backend:** Node.js, Express, TypeScript.
* **AI Integration:** Groq API (Llama 3.3 70B).

---

## 🏗 Architecture Overview

```
                    Project Model (Zustand Store)
                                │
                                ▼
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  Geometry Engine       Constraint Engine      Calculation Engine
  (Window/Slot Spacing) (Plot/Safety Checks)   (Quantity takeoff, Costs)
         └──────────────────────┬──────────────────────┘
                                │
                                ▼
                      UI SVG Canvas & Charts
```

---

## 📁 Project Structure

```
├── client/                      # Vite + React Frontend
│   ├── src/
│   │   ├── calculations/        # Material cost algorithms
│   │   ├── components/          # SVG Canvas & Dashboard charts
│   │   ├── constraints/         # Code compliance regulations
│   │   ├── geometry/            # SAT collision & snap math
│   │   ├── stores/              # Zustand global state (with history)
│   │   ├── config.ts            # Centralized API Base URL configuration
│   │   └── App.tsx              # Application layout & control sidebar
│   └── vercel.json              # Vercel deployment rewrite manifest
│
├── server/                      # Node.js + Express API Backend
│   ├── src/
│   │   └── server.ts            # API routes and fallback copilot logic
│   └── render.yaml              # Render.com web service manifest
```

---

## 🚀 Running Locally

### 1. Prerequisites
* Node.js (v18 or higher)
* NPM

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/ConceptBIM-AI.git
cd ConceptBIM-AI
```

### 3. Environment Variables
Create a `.env` file in the `/server` folder:
```bash
PORT=3001
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the Express Backend
```bash
cd server
npm install
npm run build
npm start
```

### 5. Run Automated API Tests
To run the programmatic backend endpoint test suite (validates health checks, AI command parsing, and markdown report compiling):
```bash
cd server
npm test
```

### 6. Run the Vite Client
Open a new terminal tab and start the frontend:
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173/** in your browser.

---

## ☁ Deployment Instructions

### Frontend (Vercel)
1. Import `/client` into Vercel.
2. Select **Vite** preset.
3. Configure the Env Variable `VITE_API_BASE_URL` with your Render backend URL.
4. Click **Deploy**.

### Backend (Render)
1. Link the repository to Render.com as a **Web Service**.
2. Set Root Directory to `server`.
3. Set Build Command to `npm install && npm run build`.
4. Set Start Command to `npm start`.
5. Add the Environment Variable `GROQ_API_KEY`.

---

## 🤖 AI Command Examples
Open the Command Palette (`Ctrl + K`) and type:
* *"Increase building floors to 6"*
* *"Replace category concrete with conc_low"*

---

## 🔮 Future Improvements
* **3D Voxel Extrusion:** Visualizing building layouts in 3D using Three.js.
* **Auto-Optimization:** AI-assisted placement of parking and green spaces.
* **Revit XML Exporter:** Export designs directly in standard Revit file formats.

---

