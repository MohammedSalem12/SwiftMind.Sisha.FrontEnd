# SwiftMind Mobile App Setup Guide

This guide explains how to build and run your SwiftMind Angular SPA as native mobile applications for iOS and Android using Ionic Framework and Capacitor.

## 🚀 Quick Start

The project has been configured with Ionic Framework and Capacitor to support both iOS and Android platforms while maintaining the same SPA features.

## 📱 Available NPM Scripts

### Development Scripts
- `npm run mobile:dev` - Build web app and sync with mobile platforms
- `npm run cap:sync` - Build and sync changes to native platforms
- `npm run cap:sync:prod` - Build production version and sync

### Android Scripts
- `npm run android:build` - Build and open Android project in Android Studio
- `npm run android:run` - Build and run on Android device/emulator

### iOS Scripts
- `npm run ios:build` - Build and open iOS project in Xcode
- `npm run ios:run` - Build and run on iOS device/simulator

## 🔧 Prerequisites

### For Android Development:
1. **Android Studio** - Download from https://developer.android.com/studio
2. **Java Development Kit (JDK) 17** - Required by Android Studio
3. **Android SDK** - Installed via Android Studio
4. Set `ANDROID_HOME` environment variable pointing to Android SDK location

### For iOS Development (macOS only):
1. **Xcode** - Download from Mac App Store
2. **Xcode Command Line Tools** - Run: `xcode-select --install`
3. **CocoaPods** - Run: `sudo gem install cocoapods`
4. **iOS Simulator** - Included with Xcode

## 📦 Project Structure

```
angular/
├── android/               # Android native project
├── ios/                   # iOS native project
├── capacitor.config.ts    # Capacitor configuration
├── src/                   # Angular source code
└── dist/                  # Build output
```

## 🏗️ Building for Production

### Android
1. Build the web app: `npm run build:prod`
2. Sync with Android: `npx cap sync android`
3. Open in Android Studio: `npx cap open android`
4. In Android Studio:
   - Build > Generate Signed Bundle/APK
   - Follow the wizard to create a signed APK or App Bundle
   - Upload to Google Play Store

### iOS
1. Build the web app: `npm run build:prod`
2. Sync with iOS: `npx cap sync ios`
3. Open in Xcode: `npx cap open ios`
4. In Xcode:
   - Select your development team
   - Choose Generic iOS Device
   - Product > Archive
   - Upload to App Store Connect

## 🔌 Native Plugins Available

Capacitor provides access to native device features:
- **Camera** - `@capacitor/camera`
- **Geolocation** - `@capacitor/geolocation`
- **Storage** - `@capacitor/preferences`
- **Network** - `@capacitor/network`
- **Filesystem** - `@capacitor/filesystem`
- **Push Notifications** - `@capacitor/push-notifications`

Install plugins as needed:
```bash
npm install @capacitor/camera
npx cap sync
```

## 🎨 UI Components

The app now uses Ionic Framework components optimized for mobile:
- `ion-app` - Root app component
- `ion-header` - Top toolbar/header
- `ion-content` - Scrollable content area
- `ion-button` - Touch-optimized buttons
- `ion-card` - Card components
- `ion-list` - List views
- And many more...

## 🔄 Development Workflow

1. Make changes to your Angular code in `src/`
2. Test in browser: `npm start`
3. Build for mobile: `npm run mobile:dev`
4. Test on device/emulator:
   - Android: `npm run android:run`
   - iOS: `npm run ios:run`

## 🐛 Troubleshooting

### Android Build Issues
- Ensure ANDROID_HOME is set correctly
- Update Android SDK tools in Android Studio
- Clear build cache: `cd android && ./gradlew clean`

### iOS Build Issues
- Run `pod install` in the `ios/App` directory
- Clear derived data in Xcode: Product > Clean Build Folder
- Ensure you have a valid development certificate

### Sync Issues
- Delete `android/` and `ios/` folders
- Re-add platforms: `npx cap add android && npx cap add ios`
- Sync again: `npx cap sync`

## 📱 Testing on Devices

### Android
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `npm run android:run`

### iOS
1. Connect iPhone/iPad via USB
2. Trust the computer on your device
3. Open in Xcode: `npm run ios:build`
4. Select your device and click Run

## 🌐 Live Reload (Optional)

For faster development, you can use live reload:

1. Find your local IP address
2. Update `capacitor.config.ts`:
```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:4200',
  cleartext: true
}
```
3. Run: `ng serve --host=0.0.0.0`
4. Rebuild app: `npx cap copy`

**Note:** Remove server config before production builds!

## 📚 Additional Resources

- [Ionic Framework Docs](https://ionicframework.com/docs)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Angular Docs](https://angular.dev)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Developer Guide](https://developer.apple.com/documentation)

## 🎯 Next Steps

To fully optimize for mobile, consider:
1. Converting existing components to use Ionic UI components
2. Adding native splash screens and app icons
3. Implementing push notifications
4. Adding offline support with service workers
5. Optimizing performance for mobile devices
6. Adding platform-specific features (Face ID, Touch ID, etc.)

## 💡 Tips

- Test on real devices, not just emulators
- Use Chrome DevTools for remote debugging (Android)
- Use Safari Web Inspector for iOS debugging
- Keep web assets optimized (images, fonts, etc.)
- Test on different screen sizes
- Consider dark mode support
- Implement proper error handling for network issues

---

**Happy Mobile Development! 📱✨**
