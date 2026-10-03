Financial Tracker — App Icon + Bill Double-Count Fix

Included:
- MainApp.jsx — excludes auto-created Bill transactions from daily spending totals, preventing paid bills from being counted twice.
- SwipeableLogItem.jsx — preserved from the current transaction update.
- setup_wallet_icon.sh — uses ~/storage/downloads/Wallet.png as the Android app icon.

Apply the React fix:
  cd ~/financial-tracker
  rm -rf ~/ft-update
  mkdir -p ~/ft-update
  unzip -o ~/storage/downloads/FinancialTracker-Icon-BillFix.zip -d ~/ft-update
  cp ~/ft-update/MainApp.jsx src/components/MainApp.jsx
  cp ~/ft-update/SwipeableLogItem.jsx src/components/SwipeableLogItem.jsx
  cp ~/ft-update/setup_wallet_icon.sh ~/ft-update/README.txt ./
  rm -rf ~/ft-update

Configure the icon:
  cd ~/financial-tracker
  ./setup_wallet_icon.sh

Then build/check:
  npm run build
  npx cap sync android
  cd android
  ./gradlew assembleDebug

The app icon source is read directly from:
  ~/storage/downloads/Wallet.png
