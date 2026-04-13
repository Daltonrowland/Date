# Google Play Submission — Step by Step

## Prerequisites
- Google Play Developer Account ($25 one-time): https://play.google.com/console
- Android Studio installed with SDK 34
- Java 17+
- Keystore file generated (see android-signing.md)

## Step 1: Build the AAB

```bash
cd frontend

# Install dependencies and build web app
npm install
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync web build to Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Go to **Build → Generate Signed Bundle / APK**
3. Select **Android App Bundle**
4. Create or select your keystore:
   - Key store path: `frontend/release.keystore`
   - Key store password: (your password)
   - Key alias: `relationshipscores`
   - Key password: (your password)
5. Select **release** build variant
6. Click **Finish**
7. AAB output: `android/app/build/outputs/bundle/release/app-release.aab`

## Step 2: Create App in Google Play Console

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - **App name**: Relationship Scores
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free (with in-app purchases)
4. Accept declarations and click **Create app**

## Step 3: Store Listing

### Main Store Listing
- **App name**: Relationship Scores
- **Short description**: (copy from GOOGLE_PLAY_LISTING.md — 80 chars)
- **Full description**: (copy from GOOGLE_PLAY_LISTING.md — 4000 chars)
- **App icon**: Upload 512x512 PNG from `store-assets/` or `public/icons/icon-512.png`
- **Feature graphic**: Upload 1024x500 PNG (render feature-graphic.svg to PNG)
- **Phone screenshots**: Upload 2-8 screenshots at 1080x1920
  - Screenshot 1: Matches dashboard with portrait cards
  - Screenshot 2: Score reveal page with gauge
  - Screenshot 3: Profile page with archetype badges
  - Screenshot 4: Messages conversation view

### How to capture screenshots:
1. Open https://date-production-5ca0.up.railway.app on Chrome
2. Press F12 → Toggle device toolbar → Select "iPhone 14 Pro" (390x844)
3. Set DPR to 2.0 for high-res captures
4. Navigate to each page and use Ctrl+Shift+P → "Capture screenshot"
5. Resize to 1080x1920 if needed

## Step 4: Content Rating

1. Go to **Policy → App content → Content rating**
2. Start the IARC questionnaire
3. Answer:
   - **Category**: Social / Communication
   - **Violence**: No
   - **Sexual content**: No explicit content (dating context)
   - **User interaction**: Yes (messaging, profiles)
   - **Personal information**: Yes (profiles, photos)
   - **Ads**: No
4. Submit and accept the rating (likely Mature 17+ for dating)

## Step 5: Target Audience & Content

1. Go to **Policy → App content → Target audience**
2. Select age group: **18 and above only**
3. This is a dating app — confirm it targets adults only

## Step 6: Data Safety

1. Go to **Policy → App content → Data safety**
2. Declare:
   - **Personal info collected**: Name, email, date of birth, photos
   - **Location**: City/state (manually entered, not GPS)
   - **Messages**: User-to-user messages stored for delivery
   - **App activity**: Quiz responses, compatibility scores
   - **Financial info**: Purchases processed through Stripe (no card data stored)
3. Data handling:
   - Data encrypted in transit: **Yes**
   - Data deletion mechanism: **Yes** (users can request deletion)
   - Data shared with third parties: **Stripe** (payment processing only)

## Step 7: Privacy Policy

- **URL**: https://date-production-5ca0.up.railway.app/privacy
- This page is live and covers all required topics

## Step 8: App Access

Since this is a dating app requiring registration:
1. Go to **Policy → App content → App access**
2. Select "All or some functionality is restricted"
3. Provide test credentials:
   - Email: demo1@demo.relationshipscores.app
   - Password: DemoPass123!
4. Add instructions: "Log in with the test account. The demo account has completed the quiz and has 20 pre-seeded matches visible on the dashboard."

## Step 9: Upload AAB

1. Go to **Release → Production**
2. Click **Create new release**
3. Upload the `app-release.aab` file
4. Add release notes: "Initial release — compatibility scoring, messaging, and matching powered by Genesis OS"
5. Click **Review release**

## Step 10: Submit for Review

1. Review all sections — all must show green checkmarks
2. Click **Start rollout to Production**
3. Google will review the app (typically 1-3 business days for new apps)

## Common Rejection Reasons & How to Avoid Them

| Reason | Fix |
|--------|-----|
| Missing privacy policy | ✅ Already at /privacy |
| Impersonation/fake content | Ensure demo data uses clearly fake names |
| Missing data safety declarations | Complete all data safety questions honestly |
| Login not working for reviewers | Provide working test credentials |
| Broken deep links | Ensure all routes load from the web shell |
| Missing target audience declaration | Declare 18+ only for dating |

## Timeline
- First submission review: 1-3 business days
- Subsequent updates: 1-24 hours
- Total to live: ~1 week including any back-and-forth
