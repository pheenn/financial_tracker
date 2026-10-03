Financial Tracker theme + icon update

Changes:
- Redesigned the shared Tailwind color palette for a warmer, more cohesive finance-app theme.
- Added a class-based dark-mode variant so the Light/Dark buttons control the app consistently.
- Synced the selected theme to the document root and browser color-scheme.
- Replaced hard-coded chart colors with theme-aware variables.
- Switched the Wallet app icon to Android adaptive icons so it uses the available icon area more effectively.
- The icon setup script trims transparent borders when Pillow is available and generates density-specific fallback icons.

Apply:
1. Copy src/styles/index.css and src/components/MainApp.jsx into the project.
2. Replace setup_wallet_icon.sh.
3. Run: chmod +x setup_wallet_icon.sh
4. Run: ./setup_wallet_icon.sh
5. Run: npm run build
6. Then sync/build Android as usual.
