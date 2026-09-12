# Mappls (MapmyIndia) setup

The app is wired to render markers via `mappls-map-react-native` when
`EXPO_PUBLIC_USE_MAPPLS=true`, but the native SDK needs two license files
per platform that only you can generate (they're tied to your account, the
app's package name, and its signing certificate). Until these are in place,
leave `EXPO_PUBLIC_USE_MAPPLS=false` — the app already falls back to the
existing map/list view.

## 1. Create apps on the Mappls console

Go to https://auth.mappls.com/console, sign up/log in, and create **two**
apps:

- One for **Android**, package name: `com.sih262002.nerlogisense`
- One for **iOS** (if/when iOS is built)

## 2. Register the signing certificate (Android)

The Android app is registered against a signing certificate's SHA-256
fingerprint. This build currently signs release with the **debug**
keystore (`android/app/debug.keystore`), so use this fingerprint:

```
FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

If you later switch to a dedicated release keystore, get its SHA-256 with:

```
keytool -list -v -keystore <your-release>.keystore -alias <your-alias>
```

and re-register it (or add it as an additional entry) on the console —
otherwise the SDK will refuse to initialize on release builds signed with
the new key.

## 3. Download and place the config files

From the console, download the Android app's config files and place them
directly in this directory (`android/app/`):

```
android/app/com.sih262002.nerlogisense.a.olf
android/app/com.sih262002.nerlogisense.a.conf
```

(For iOS: the `.i.olf` / `.i.conf` files go in the iOS project bundle —
not applicable until an iOS build exists.)

## 4. Enable it

In `apps/mobile-app/.env`:

```
EXPO_PUBLIC_USE_MAPPLS=true
```

Then rebuild:

```
cd apps/mobile-app/android
./gradlew assembleRelease
```

## Notes

- These `.olf`/`.conf` files are per-app secrets — don't commit them. Add
  `android/app/*.a.olf` and `android/app/*.a.conf` to `.gitignore` once
  they exist locally.
- Mappls' terms require keeping their logo/attribution visible in the map
  view — don't strip it from the rendered output.
