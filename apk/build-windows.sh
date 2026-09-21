#!/usr/bin/env bash
# Build tydlig-v{version}.apk on Windows (Git Bash).
# Same no-Gradle pipeline as cross100: Windows build-tools ship d8/apksigner
# as .bat wrappers, so we invoke their jars with java directly.
#
# Prerequisites:
#   - JDK 17 on PATH (javac, keytool, java)
#   - ANDROID_HOME with build-tools/34.0.0 and platforms/android-34
#   - version: latest git tag (vX.Y.Z); override with TYDLIG_VERSION=vX.Y.Z
set -e

WS="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_HOME="${ANDROID_HOME:-D:/zcode/android-sdk}"
ANDROID_JAR="$ANDROID_HOME/platforms/android-34/android.jar"
BT="$ANDROID_HOME/build-tools/34.0.0"
D8_JAR="$BT/lib/d8.jar"
APKSIGNER_JAR="$BT/lib/apksigner.jar"
AAPT2="$BT/aapt2.exe"
AAPT="$BT/aapt.exe"
ZIPALIGN="$BT/zipalign.exe"

APK_DIR="$WS/apk"
BUILD_DIR="$APK_DIR/build"

# ── Derive version name from latest git tag (e.g. v0.1.0) ──
if [ -n "$TYDLIG_VERSION" ]; then
  VERSION="${TYDLIG_VERSION#v}"
else
  VERSION_TAG=$(cd "$WS" && git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.1")
  VERSION="${VERSION_TAG#v}"
fi
APK_NAME="tydlig-v${VERSION}"

echo "Building: $APK_NAME.apk"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/obj" "$BUILD_DIR/dex" "$BUILD_DIR/compiled"

echo "=== 1. Compile Java ==="
javac -encoding UTF-8 -source 8 -target 8 -bootclasspath "$ANDROID_JAR" \
  -d "$BUILD_DIR/obj" \
  "$APK_DIR/src/io/github/pokem0n2/tydlig/MainActivity.java"

echo "=== 2. DEX ==="
java -cp "$D8_JAR" com.android.tools.r8.D8 --output "$BUILD_DIR/dex" \
  --min-api 21 \
  --lib "$ANDROID_JAR" \
  --release \
  "$BUILD_DIR/obj/io/github/pokem0n2/tydlig/MainActivity.class"

echo "=== 3. aapt2 compile (resources) ==="
"$AAPT2" compile -o "$BUILD_DIR/compiled/" --dir "$APK_DIR/res"

echo "=== 4. aapt2 link ==="
"$AAPT2" link -o "$BUILD_DIR/${APK_NAME}.unsigned.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$APK_DIR/AndroidManifest.xml" \
  --version-code 1 --version-name "$VERSION" \
  --auto-add-overlay \
  -A "$APK_DIR/assets" \
  "$BUILD_DIR/compiled"/*.flat

echo "=== 5. Add DEX to APK (must be at root as classes.dex) ==="
cp "$BUILD_DIR/dex/classes.dex" "$BUILD_DIR/classes.dex"
(cd "$BUILD_DIR" && "$AAPT" add "${APK_NAME}.unsigned.apk" "classes.dex")

echo "=== 6. zipalign ==="
"$ZIPALIGN" -f 4 "$BUILD_DIR/${APK_NAME}.unsigned.apk" "$BUILD_DIR/${APK_NAME}.aligned.apk"

echo "=== 7. Sign with debug.keystore (v1 + v2 + v3) ==="
KS="$HOME/.android/debug.keystore"
if [ ! -f "$KS" ]; then
  mkdir -p "$HOME/.android"
  echo "Generating debug.keystore..."
  keytool -genkey -v -keystore "$KS" -alias androiddebugkey \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass android -keypass android \
    -dname "CN=Android Debug,O=Android,C=US"
fi

java -jar "$APKSIGNER_JAR" sign --ks "$KS" \
  --ks-pass pass:android --key-pass pass:android \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out "$BUILD_DIR/${APK_NAME}.apk" \
  "$BUILD_DIR/${APK_NAME}.aligned.apk"

echo "=== 8. Verify ==="
java -jar "$APKSIGNER_JAR" verify "$BUILD_DIR/${APK_NAME}.apk"

cp "$BUILD_DIR/${APK_NAME}.apk" "$WS/${APK_NAME}.apk"
ls -la "$WS/${APK_NAME}.apk"
echo "✅ APK built: $WS/${APK_NAME}.apk"
