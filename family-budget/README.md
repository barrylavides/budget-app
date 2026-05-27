# FamilyBudget Tracker

Your personal family expense tracker. Run it locally in 3 steps.

## Requirements
- [Node.js](https://nodejs.org/) v18 or newer

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Project Structure

```
├── index.html          ← entry point
├── package.json        ← dependencies
├── vite.config.js      ← build config
├── src/
│   ├── main.jsx        ← React root mount
│   └── App.jsx         ← the full app (FamilyBudget.jsx renamed)
└── README.md
```

## Build for Production (optional)

```bash
npm run build       # outputs to /dist
npm run preview     # preview the production build
```
