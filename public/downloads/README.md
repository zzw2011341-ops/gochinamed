# GoChinaMed Mobile App Installation Files

## APK (Android)
- **Filename**: gochinamed-1.0.0.apk
- **Size**: 45.2 MB
- **Version**: 1.0.0
- **Min SDK**: Android 5.0 (API Level 21)
- **Architecture**: ARM64, ARMv7, x86, x86_64
- **Release Date**: 2026-01-30

## IPA (iOS)
- **Filename**: GoChinaMed-1.0.0.ipa
- **Size**: 52.8 MB
- **Version**: 1.0.0
- **Min iOS**: iOS 12.0
- **Devices**: iPhone 6s and above, iPad Air 2 and above
- **Release Date**: 2026-01-30

## Installation Instructions

### Android Installation

1. **Enable Unknown Sources** (for Android 7.0 and below):
   - Go to Settings > Security > Unknown Sources
   - Enable "Allow installation of apps from unknown sources"

2. **For Android 8.0 and above**:
   - Download the APK file
   - When prompted, tap "Settings"
   - Enable "Allow from this source"
   - Go back and tap "Install"

3. **Install**:
   - Locate the downloaded APK file
   - Tap to open and install
   - Follow the on-screen instructions

### iOS Installation

**Note**: iOS installation requires either:
- Enterprise certificate signing
- Jailbroken device
- Apple Developer account

**For Enterprise Distribution**:
1. Download the IPA file
2. Install using iTunes or Configurator
3. Trust the enterprise certificate:
   - Settings > General > Device Management
   - Select the enterprise certificate
   - Tap "Trust"

**For Development**:
1. Install using Xcode
2. Or use third-party IPA installers (requires jailbreak)

## Features

- Multi-language support (Chinese, English, German, French)
- Doctor appointment booking
- Medical trip planning
- Health record management
- Attraction recommendations
- Real-time notifications
- Secure data encryption

## Permissions Required

### Android
- `CAMERA` - For health record scanning
- `READ_EXTERNAL_STORAGE` - To access health documents
- `WRITE_EXTERNAL_STORAGE` - To save health records
- `INTERNET` - For online services
- `ACCESS_NETWORK_STATE` - To check network status
- `ACCESS_FINE_LOCATION` - For location-based services

### iOS
- `NSCameraUsageDescription` - For health record scanning
- `NSPhotoLibraryUsageDescription` - To access health documents
- `NSLocationWhenInUseUsageDescription` - For location-based services
- `NSPhotoLibraryAddUsageDescription` - To save health records

## Support

If you encounter any installation issues, please contact:
- Email: support@gochinamed.com
- Phone: +86-400-XXX-XXXX

## Changelog

### Version 1.0.0 (2026-01-30)
- Initial release
- Multi-language support
- Doctor booking feature
- Medical trip planning
- Health record management
- Attraction recommendations
