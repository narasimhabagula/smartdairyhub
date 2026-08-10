# Building the real Smart Dairy Hub Android APK

The web app is packaged with **Capacitor** (`capacitor.config.ts`), so the APK
bundles the built web assets and launches as a native Android app — no browser
chrome, no address bar, and no "website in a WebView pointing at a URL".

Lovable's cloud sandbox has no Android SDK / Gradle, so the `.apk` binary must
be produced on a machine with Android Studio. Everything else is already
configured.

## One-time setup

```bash
git pull                     # get this project
npm install
npx cap add android          # creates the android/ project
```

## Every build

```bash
npm run build                # builds dist/
npx cap sync android         # copies dist/ + plugins into the native project
cd android
./gradlew assembleRelease    # unsigned release APK
```

Output: `android/app/build/outputs/apk/release/app-release.apk`
Rename to `Smart-Dairy-Hub.apk` before distributing.

For a debug/testable build: `./gradlew assembleDebug`, or run on a device with
`npx cap run android`.

## Signing a release APK

```bash
keytool -genkey -v -keystore smartdairyhub.keystore -alias smartdairyhub \
  -keyalg RSA -keysize 2048 -validity 10000
```

Add to `android/app/build.gradle` under `android { }`:

```gradle
signingConfigs {
  release {
    storeFile file("../../smartdairyhub.keystore")
    storePassword System.getenv("KEYSTORE_PASSWORD")
    keyAlias "smartdairyhub"
    keyPassword System.getenv("KEY_PASSWORD")
  }
}
buildTypes { release { signingConfig signingConfigs.release } }
```

Never commit the keystore or its passwords.

## App identity

| Setting | Value |
| --- | --- |
| Application ID | `online.smartdairyhub.app` |
| App name | Smart Dairy Hub |
| Web dir | `dist` |
| Splash | white background, 1.2s max, auto-hide |
| Status bar | light style, white background |

### Launcher icon

Use `public/logo.png` in Android Studio: **File → New → Image Asset →
Launcher Icons (Adaptive and Legacy)**, pick the logo as the foreground, white
(`#FFFFFF`) as the background, and generate. That writes all
`mipmap-*` densities plus the adaptive icon XML.

## Verifying the output really is an APK

```bash
file app-release.apk                 # -> "Android package (APK)"
unzip -l app-release.apk | grep -E "classes.dex|AndroidManifest.xml"
$ANDROID_HOME/build-tools/<ver>/aapt2 dump badging app-release.apk | head
```

A valid APK always contains `AndroidManifest.xml` and at least one
`classes.dex`. A source ZIP does not.

## Native behaviour already wired in the web code

- `src/components/NativeShell.tsx` — Android hardware back button walks the
  in-app history and only exits at the root screen; hides the native splash and
  sets the status bar style.
- `src/components/NetworkStatus.tsx` — friendly offline banner with automatic
  recovery.
- Bottom navigation, safe-area padding, and `100dvh` layouts are already in the
  responsive UI.
