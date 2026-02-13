# SwiftMind Mobile Quick Start Script
# This script helps you test the mobile app setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SwiftMind Mobile Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if build directory exists
if (-Not (Test-Path "dist/Sesha")) {
    Write-Host "Building the app..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed. Please check the errors above." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Green
Write-Host "1. Test Android app" -ForegroundColor White
Write-Host "2. Test iOS app" -ForegroundColor White
Write-Host "3. Open Android Studio" -ForegroundColor White
Write-Host "4. Open Xcode" -ForegroundColor White
Write-Host "5. Sync both platforms" -ForegroundColor White
Write-Host "6. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host "Syncing with Android..." -ForegroundColor Yellow
        npx cap sync android
        Write-Host "Running on Android..." -ForegroundColor Yellow
        npx cap run android
    }
    "2" {
        Write-Host "Syncing with iOS..." -ForegroundColor Yellow
        npx cap sync ios
        Write-Host "Running on iOS..." -ForegroundColor Yellow
        npx cap run ios
    }
    "3" {
        Write-Host "Opening Android Studio..." -ForegroundColor Yellow
        npx cap sync android
        npx cap open android
    }
    "4" {
        Write-Host "Opening Xcode..." -ForegroundColor Yellow
        npx cap sync ios
        npx cap open ios
    }
    "5" {
        Write-Host "Syncing both platforms..." -ForegroundColor Yellow
        npx cap sync
        Write-Host "Sync complete!" -ForegroundColor Green
    }
    "6" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Done! Check the output above for any errors." -ForegroundColor Green
Write-Host ""
Write-Host "For more information, see:" -ForegroundColor Cyan
Write-Host "  - MOBILE_README.md" -ForegroundColor White
Write-Host "  - IONIC_CONVERSION_GUIDE.md" -ForegroundColor White
Write-Host "  - APP_STORE_DEPLOYMENT.md" -ForegroundColor White
