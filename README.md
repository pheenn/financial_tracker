# Lala — Financial Planner

React + Vite + Tailwind project refactored from the original single-file Financial Tracker app.

## Termux

```bash
pkg update && pkg upgrade
pkg install nodejs
cd ~/financial-tracker
npm install
npm run dev -- --host 0.0.0.0
```

Then open `http://localhost:5173` on the Android device.

To access from another device on the same Wi-Fi, use the Termux device's LAN IP:
`http://YOUR-TERMUX-IP:5173`

## Production build

```bash
npm run build
npm run preview
```

## Structure

```text
src/
├── components/
│   ├── ErrorBoundary.jsx
│   ├── MainApp.jsx
│   ├── SwipeableBillItem.jsx
│   ├── SwipeableHabitTracker.jsx
│   └── SwipeableLogItem.jsx
├── data/
│   └── defaultData.js
├── hooks/
│   └── useFinanceTracker.js
├── styles/
│   └── index.css
├── utils/
│   ├── date.js
│   └── motivation.js
├── App.jsx
└── main.jsx
```

The existing Tailwind class names, colors, spacing, layout, interactions, and displayed text were preserved while moving code into separate modules.
