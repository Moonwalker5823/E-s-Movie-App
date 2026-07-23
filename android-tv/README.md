# Eric's Movies — Google TV app 📺♛

A tiny native Android app that wraps your deployed web app (`https://erics-movies.vercel.app/`)
so it installs on your **Hisense U8 (Google TV, Android TV OS 14)** and shows up on the home
row like Netflix or YouTube — with the **TV remote actually working** (no mouse cursor) and your
**logins remembered** between sessions.

## Will this work on my Google TV? ✅ Yes.

Your TV runs **Android TV OS 14**. This app targets `minSdk 21`, so it's compatible with a huge
margin. The `LEANBACK_LAUNCHER` category in the manifest is exactly what Google TV looks for to
list an app on the home screen. It's a `WebView` app, so:

- **D-pad navigation** is handled by the web app (arrow keys + OK), which the WebView forwards.
- **Favorites, settings, and streaming sign-ins persist** (DOM storage + cookies), so a title
  opens ready to play.
- **Philips Hue** local control works because the app allows local-network (HTTP) calls.

⚠️ **One honest caveat:** some **paid, DRM-protected** services (Netflix, Hulu, Disney+, Max) may
refuse to play video inside a generic WebView (they require a certified browser / Widevine). For
those, use their own installed TV app — you're already signed in there. Free/web players (Tubi web,
YouTube, Pluto, cloud gaming, the X tab) play fine in-app.

---

## Build the APK

You need **Android Studio** (free — includes the right JDK and SDK).

1. **Open the project:** Android Studio → *Open* → select this `android-tv/` folder. Let it sync
   (it downloads Gradle + the Android SDK automatically the first time — this also generates the
   Gradle wrapper).
2. **(Already done)** The app URL is set to `https://erics-movies.vercel.app/` in
   `app/src/main/res/values/strings.xml`. Change it there if your Vercel URL ever changes.
3. **Build:** menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**. When it finishes, click
   **locate** in the popup. The file is:
   ```
   android-tv/app/build/outputs/apk/debug/app-debug.apk
   ```
   (The debug APK is signed with Android Studio's debug key — that's fine for sideloading.)

> CLI alternative: with a local Gradle installed, run `gradle wrapper` once in this folder, then
> `./gradlew assembleDebug`.

---

## Put it on the TV

### 1. Turn on developer mode + ADB on the Hisense (one time)
- **Settings → System → About → Android TV OS build** — click it **7 times** ("You are now a
  developer").
- **Settings → System → Developer options** → turn on **USB debugging** and **Network debugging**
  (a.k.a. "ADB over network" / "Wireless debugging").

### 2. Install over Wi-Fi with ADB (easiest — same as your screenshot's network)
Your TV's IP is **`10.168.166.100`**. On your Mac (ADB ships with Android Studio; it's under
`~/Library/Android/sdk/platform-tools/`):

```bash
adb connect 10.168.166.100:5555
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
- Accept the "Allow debugging?" prompt on the TV the first time.
- `-r` reinstalls/upgrades in place when you rebuild later.

### 3. No ADB? Sideload with an app instead
- Install **"Downloader by AFTVnews"** (or **"Send files to TV"**) from the Google Play Store on the
  TV. Host `app-debug.apk` somewhere you can reach (Google Drive direct link, a USB stick, or your
  Mac on the LAN) and open it on the TV to install. You'll be asked to allow installs from that app.

### 4. Launch it
Open it from the Google TV **Apps** row (it appears as **"Eric's Movies"** with the red play icon).
Move a game/apps tile to the home row to pin it.

---

## Using it
- Navigate with the remote **D-pad**; press **OK** to select; **Back** goes back (and exits from the
  home screen).
- **Sign into your services once** (Settings → My Services → Sign in). The app remembers the login,
  so next time a **▶ Play on {service}** button takes you straight in.
- **Hue lighting:** the TV app and phone/tablet can reach your bridge on Wi-Fi. Pair it in
  **Settings → Theater Lighting**.

## Updating after you change the web app
The app just loads your live site, so **most updates need no rebuild** — redeploy to Vercel and
relaunch. Only rebuild/reinstall the APK if you change the URL, icon, or native behavior.

## Replace the placeholder art (optional)
`res/drawable/ic_launcher.xml` (icon) and `res/drawable/banner.xml` (320×180 home-row banner) are
simple placeholders. Drop in real PNGs (Android Studio → right-click `res` → *New → Image Asset*)
for a polished look.

## Troubleshooting
- **`adb: device unauthorized`** — accept the debugging prompt on the TV, then re-run `adb connect`.
- **`adb connect` fails** — make sure Network/Wireless debugging is ON and the Mac + TV are on the
  same Wi-Fi; the IP can change (re-check Settings → About → Status).
- **A streaming site won't play** — that's the DRM caveat above; open that service's own TV app.
- **Lights don't respond** — confirm the bridge IP in Settings and that the TV is on the same Wi-Fi.
