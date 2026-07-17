# Folder Structure

Overview of the directory layout of the ConceptBIM AI platform.

```
├── client/                      # Frontend Application (Vite + React + TS)
│   ├── src/
│   │   ├── calculations/        # Takeoff math and cost algorithms
│   │   ├── components/          # SVG canvas, Dashboard charts, Command palette
│   │   ├── constraints/         # Site boundary compliance check rules
│   │   ├── geometry/            # SAT collision detection and spacing helpers
│   │   ├── stores/              # Zustand global state (undo/redo timeline)
│   │   ├── types/               # TypeScript schemas
│   │   ├── App.tsx              # Sidebar controls and layout wrapper
│   │   ├── main.tsx             # React main mount
│   │   └── index.css            # Tailwind theme variables
│   ├── vercel.json              # Vercel client routing config
│   └── package.json
│
├── server/                      # Backend API Service (Express + Node + TS)
│   ├── src/
│   │   └── server.ts            # API routes and fallback copilot parsers
│   ├── render.yaml              # Render.com infrastructure manifest
│   ├── .env.example             # Environment template
│   └── package.json
```
