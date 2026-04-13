# Relationship Scores — Mobile App Build Guide

## Prerequisites

### iOS
- macOS with Xcode 15+ installed
- Apple Developer Account ($99/year) for App Store submission
- CocoaPods: `sudo gem install cocoapods`

### Android
- Android Studio Hedgehog+ with SDK 34
- Java 17+ (`brew install openjdk@17`)
- Google Play Developer Account ($25 one-time)

## Setup

```bash
cd frontend

# Install dependencies
npm install

# Add platforms (first time only)
npx cap add ios
npx cap add android
```

## Development

```bash
# Build and open in IDE
./build-mobile.sh ios      # Opens Xcode
./build-mobile.sh android  # Opens Android Studio

# Or step by step:
npm run build
npx cap sync
npx cap open ios
```

## iOS Build for App Store

1. Open Xcode via `npx cap open ios`
2. Select the **App** target → **General** tab
3. Set Bundle Identifier: `com.relationshipscores.app`
4. Set Version: `1.0.0`, Build: `1`
5. Set Deployment Target: iOS 14.0
6. Add app icons in Assets.xcassets (all required sizes)
7. Select **Product → Archive** (requires real device or generic target)
8. In Organizer, click **Distribute App → App Store Connect**
9. Fill in App Store Connect metadata:
   - Name: Relationship Scores
   - Subtitle: Know your score before you fall
   - Category: Social Networking / Lifestyle
   - Privacy Policy URL: (required)
   - Screenshots: 6.7" and 6.5" iPhone screenshots required

## Android Build for Google Play

1. Open Android Studio via `npx cap open android`
2. Verify `app/build.gradle`:
   - applicationId: `com.relationshipscores.app`
   - versionName: `1.0.0`
   - versionCode: `1`
3. Build → Generate Signed Bundle / APK → Android App Bundle
4. Create a keystore (first time): `keytool -genkey -v -keystore rs-release.keystore -alias rs -keyalg RSA -keysize 2048 -validity 10000`
5. Upload to Google Play Console:
   - Create new app → Dating category
   - Content rating: moderate (relationships)
   - Target audience: 18+
   - Data safety: declare network, camera, storage permissions
   - Screenshots: phone + 7" tablet required

## Privacy Policy Requirements

Both stores require a privacy policy. It must cover:
- What data is collected (email, DOB, photos, quiz answers)
- How data is used (compatibility scoring, matching)
- Data storage (PostgreSQL on Railway, encrypted in transit)
- Third-party services (Stripe for payments)
- User rights (account deletion available)
- Contact information

## Native Plugins Used

| Plugin | Purpose |
|--------|---------|
| @capacitor/push-notifications | Real push notifications |
| @capacitor/local-notifications | Offline alerts |
| @capacitor/haptics | Vibration on like/match |
| @capacitor/status-bar | Dark theme status bar |
| @capacitor/keyboard | Chat keyboard avoiding |
| @capacitor/app | Deep linking, back button |

## Important Notes

- The web app at https://date-production-5ca0.up.railway.app continues to work independently
- Capacitor wraps the web app — it does not replace it
- All API calls go to the live Railway backend
- Push notifications require additional server-side setup (APNS for iOS, FCM for Android)
