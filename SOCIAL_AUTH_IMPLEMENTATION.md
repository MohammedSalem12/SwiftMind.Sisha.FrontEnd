# Social Media Authentication Implementation Guide

This document provides guidance on implementing social media authentication (Google, Facebook, Apple) for the SwiftMind application.

## Current Status

✅ **UI Components Added:**
- Social login/register buttons added to both login and register pages
- Styled buttons with proper icons and hover effects
- Arabic text labels for better UX
- Loading states integrated with existing form states

✅ **Placeholder Methods Created:**
- `loginWithGoogle()`, `loginWithFacebook()`, `loginWithApple()` in login component
- `registerWithGoogle()`, `registerWithFacebook()`, `registerWithApple()` in register component
- Error handling structure in place

## Next Steps for Implementation

### 1. Backend Configuration (ABP Framework)

First, configure external authentication providers in your ABP backend:

```csharp
// In your web module ConfigureServices method
context.Services.AddAuthentication()
    .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
    {
        options.ClientId = configuration["Authentication:Google:ClientId"];
        options.ClientSecret = configuration["Authentication:Google:ClientSecret"];
    })
    .AddFacebook(FacebookDefaults.AuthenticationScheme, options =>
    {
        options.AppId = configuration["Authentication:Facebook:AppId"];
        options.AppSecret = configuration["Authentication:Facebook:AppSecret"];
    })
    .AddAppleIdAuthentication(AppleAuthenticationDefaults.AuthenticationScheme, options =>
    {
        options.ClientId = configuration["Authentication:Apple:ClientId"];
        options.KeyId = configuration["Authentication:Apple:KeyId"];
        options.TeamId = configuration["Authentication:Apple:TeamId"];
        options.PrivateKey = configuration["Authentication:Apple:PrivateKey"];
    });
```

### 2. Frontend Implementation Options

#### Option A: Redirect-based Authentication
```typescript
// In login.component.ts
async loginWithGoogle() {
    window.location.href = '/api/account/external-login?provider=Google&returnUrl=/';
}

async loginWithFacebook() {
    window.location.href = '/api/account/external-login?provider=Facebook&returnUrl=/';
}

async loginWithApple() {
    window.location.href = '/api/account/external-login?provider=Apple&returnUrl=/';
}
```

#### Option B: JavaScript SDK Integration

**Google Sign-In:**
```typescript
// Install: npm install google-auth-library
import { GoogleAuth } from 'google-auth-library';

async loginWithGoogle() {
    try {
        // Initialize Google Auth
        const auth = new GoogleAuth({
            scopes: ['email', 'profile'],
            credentials: {
                client_id: 'your-google-client-id'
            }
        });
        
        // Get access token and send to your backend
        const token = await auth.getAccessToken();
        // Send token to your ABP backend for verification
    } catch (error) {
        console.error('Google auth error:', error);
    }
}
```

**Facebook Login:**
```typescript
// Install: npm install facebook-js-sdk
declare const FB: any;

async loginWithFacebook() {
    FB.login((response: any) => {
        if (response.status === 'connected') {
            // Send response.authResponse.accessToken to your backend
        }
    }, { scope: 'email' });
}
```

**Apple Sign-In:**
```typescript
// Use Apple's Sign In with Apple JS
declare const AppleID: any;

async loginWithApple() {
    try {
        const data = await AppleID.auth.signIn({
            clientId: 'your-apple-client-id',
            redirectURI: 'your-redirect-uri',
            scope: 'name email',
            responseType: 'code',
            responseMode: 'web_message'
        });
        
        // Send data.authorization.code to your backend
    } catch (error) {
        console.error('Apple Sign-In error:', error);
    }
}
```

### 3. Environment Configuration

Add social auth configuration to your environment files:

```typescript
// src/environments/environment.ts
export const environment = {
    // ... existing config
    socialAuth: {
        google: {
            clientId: 'your-google-client-id'
        },
        facebook: {
            appId: 'your-facebook-app-id'
        },
        apple: {
            clientId: 'your-apple-client-id',
            redirectUri: 'your-apple-redirect-uri'
        }
    }
};
```

### 4. Update the Placeholder Methods

Replace the placeholder implementations with actual OAuth integration based on your chosen approach.

### 5. Error Handling

Enhance error handling to provide better user feedback:

```typescript
private handleSocialAuthError(provider: string, error: any) {
    console.error(`${provider} auth error:`, error);
    
    let errorMessage = `فشل في تسجيل الدخول بـ ${provider}`;
    
    if (error.code === 'popup_blocked') {
        errorMessage = 'يرجى السماح بالنوافذ المنبثقة لإتمام عملية التسجيل';
    } else if (error.code === 'network_error') {
        errorMessage = 'خطأ في الاتصال بالإنترنت';
    }
    
    this.error.set(errorMessage);
}
```

## Security Considerations

1. **HTTPS Required:** Social login requires HTTPS in production
2. **CSRF Protection:** Ensure CSRF protection is enabled
3. **Token Validation:** Always validate tokens on the server side
4. **User Mapping:** Handle user email conflicts and account linking
5. **Privacy:** Comply with privacy policies for each provider

## Testing

1. Test with development credentials first
2. Use provider-specific testing tools
3. Test error scenarios (network issues, user cancellation, etc.)
4. Verify user data mapping and account creation

## Resources

- [Google Sign-In Documentation](https://developers.google.com/identity/sign-in/web)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [Apple Sign-In Documentation](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js)
- [ABP External Authentication](https://docs.abp.io/en/abp/latest/Authentication/External-Login-Providers)