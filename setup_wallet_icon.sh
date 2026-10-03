#!/data/data/com.termux/files/usr/bin/bash
set -e

PROJECT_DIR="$HOME/financial-tracker"
WALLET_SRC="$HOME/storage/downloads/Wallet.png"
RES_DIR="$PROJECT_DIR/android/app/src/main/res"
DRAWABLE_DIR="$RES_DIR/drawable-nodpi"
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

mkdir -p "$DRAWABLE_DIR" \
  "$RES_DIR/mipmap-anydpi-v26" \
  "$RES_DIR/mipmap-anydpi" \
  "$RES_DIR/mipmap-mdpi" \
  "$RES_DIR/mipmap-hdpi" \
  "$RES_DIR/mipmap-xhdpi" \
  "$RES_DIR/mipmap-xxhdpi" \
  "$RES_DIR/mipmap-xxxhdpi" \
  "$RES_DIR/values"

# Create a square, edge-to-edge icon when Pillow is available. Transparent
# borders are trimmed so the wallet artwork is not displayed as a tiny icon.
if python - "$WALLET_SRC" "$DRAWABLE_DIR/wallet_icon.png" <<'PY'
from pathlib import Path
import sys
from PIL import Image, ImageChops

src = Path(sys.argv[1])
out = Path(sys.argv[2])
img = Image.open(src).convert('RGBA')

alpha = img.getchannel('A')
bbox = alpha.getbbox()
if bbox:
    img = img.crop(bbox)

w, h = img.size
side = max(w, h)
canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
canvas.alpha_composite(img, ((side - w) // 2, (side - h) // 2))
canvas = canvas.resize((1024, 1024), Image.Resampling.LANCZOS)
canvas.save(out, format='PNG', optimize=True)
PY
then
  echo "Prepared a 1024x1024 trimmed Wallet icon."
else
  echo "Pillow is not installed; using the original Wallet.png without trimming."
  cp "$WALLET_SRC" "$DRAWABLE_DIR/wallet_icon.png"
  echo "For automatic transparent-border trimming later, install Pillow with:"
  echo "  pkg install python-pillow"
fi

# Adaptive icon: Android 8+ uses the full Wallet artwork as the foreground,
# which avoids the smaller legacy launcher-icon normalization.
cat > "$RES_DIR/values/wallet_icon_colors.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="wallet_icon_background">#15120F</color>
</resources>
XML

cat > "$RES_DIR/mipmap-anydpi-v26/ic_launcher.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/wallet_icon_background" />
    <foreground android:drawable="@drawable/wallet_icon" />
</adaptive-icon>
XML

cat > "$RES_DIR/mipmap-anydpi-v26/ic_launcher_round.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/wallet_icon_background" />
    <foreground android:drawable="@drawable/wallet_icon" />
</adaptive-icon>
XML

# Legacy launcher fallback for Android versions before adaptive icons.
cat > "$RES_DIR/mipmap-anydpi/ic_launcher.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<bitmap xmlns:android="http://schemas.android.com/apk/res/android"
    android:src="@drawable/wallet_icon" />
XML

cat > "$RES_DIR/mipmap-anydpi/ic_launcher_round.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<bitmap xmlns:android="http://schemas.android.com/apk/res/android"
    android:src="@drawable/wallet_icon" />
XML

# Generate density-specific legacy icons when Pillow is available; otherwise
# reuse the processed drawable so Gradle still has concrete mipmap assets.
if python - "$DRAWABLE_DIR/wallet_icon.png" "$RES_DIR" <<'PY'
from pathlib import Path
import sys
from PIL import Image

src = Image.open(sys.argv[1]).convert('RGBA')
root = Path(sys.argv[2])
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}
for directory, size in sizes.items():
    out_dir = root / directory
    resized = src.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(out_dir / 'ic_launcher.png', format='PNG', optimize=True)
    resized.save(out_dir / 'ic_launcher_round.png', format='PNG', optimize=True)
PY
then
  echo "Generated density-specific launcher icons."
else
  for dir in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    cp "$DRAWABLE_DIR/wallet_icon.png" "$RES_DIR/mipmap-$dir/ic_launcher.png"
    cp "$DRAWABLE_DIR/wallet_icon.png" "$RES_DIR/mipmap-$dir/ic_launcher_round.png"
  done
fi

python - "$MANIFEST" <<'PY'
from pathlib import Path
import re
import sys

manifest = Path(sys.argv[1])
s = manifest.read_text()
icon = '@mipmap/ic_launcher'
round_icon = '@mipmap/ic_launcher_round'

s = re.sub(r'android:icon="[^"]+"', f'android:icon="{icon}"', s, count=1)
if 'android:icon=' not in s:
    s = re.sub(r'(<application\b[^>]*)(>)', lambda m: m.group(1) + f' android:icon="{icon}"' + m.group(2), s, count=1)

s2 = re.sub(r'android:roundIcon="[^"]+"', f'android:roundIcon="{round_icon}"', s, count=1)
if 'android:roundIcon=' not in s2:
    s2 = re.sub(r'(<application\b[^>]*)(>)', lambda m: m.group(1) + f' android:roundIcon="{round_icon}"' + m.group(2), s2, count=1)

manifest.write_text(s2)
PY

echo "Wallet.png is now configured as a full-size adaptive Android app icon."
echo "Icon source: $WALLET_SRC"
echo "Icon resource: $DRAWABLE_DIR/wallet_icon.png"
