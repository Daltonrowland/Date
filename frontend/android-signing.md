# Android Signing Configuration

## Generate Keystore (run once, store securely)

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias relationshipscores \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Relationship Scores, OU=Mobile, O=Relationship Scores LLC, L=Austin, ST=TX, C=US"
```

## Add to android/app/build.gradle

After running `npx cap add android`, add this signing config to
`frontend/android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../release.keystore')
            storePassword System.getenv('KEYSTORE_PASSWORD') ?: 'changeme'
            keyAlias 'relationshipscores'
            keyPassword System.getenv('KEY_PASSWORD') ?: 'changeme'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Build AAB for Google Play

```bash
cd frontend/android
./gradlew bundleRelease
```

Output: `frontend/android/app/build/outputs/bundle/release/app-release.aab`

## NEVER commit the keystore to git
Add to .gitignore:
```
*.keystore
*.jks
```
