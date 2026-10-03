#!/data/data/com.termux/files/usr/bin/bash
set -e

PROJECT_DIR="$HOME/financial-tracker"
WALLET_SRC="$HOME/storage/downloads/Wallet.png"
RES_DIR="$PROJECT_DIR/android/app/src/main/res/drawable-nodpi"
MANIFEST="$PROJECT_DIR/android/app/src/main/AndroidManifest.xml"

if [ ! -f "$WALLET_SRC" ]; then
  echo "ERROR: Wallet.png was not found at:"
  echo "  $WALLET_SRC"
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: AndroidManifest.xml was not found at:"
  echo "  $MANIFEST"
  exit 1
fi

mkdir -p "$RES_DIR"
cp "$WALLET_SRC" "$RES_DIR/wallet_icon.png"

python - "$MANIFEST" <<'PY'
from pathlib import Path
import re
import sys

manifest = Path(sys.argv[1])
s = manifest.read_text()
icon = '@drawable/wallet_icon'

s2 = re.sub(r'android:icon="[^"]+"', f'android:icon="{icon}"', s, count=1)
if s2 == s:
    s2 = re.sub(r'(<application\b[^>]*)(>)', lambda m: m.group(1) + f' android:icon="{icon}"' + m.group(2), s, count=1)

s2 = re.sub(r'android:roundIcon="[^"]+"', f'android:roundIcon="{icon}"', s2, count=1)

if s2 == s:
    raise SystemExit('Could not update the application icon in AndroidManifest.xml')

manifest.write_text(s2)
PY

echo "Wallet.png is now configured as the Android app icon."
echo "Icon file: $RES_DIR/wallet_icon.png"
