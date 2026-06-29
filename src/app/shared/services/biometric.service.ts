import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

const KEY_USERNAME = 'biometric_username';
const KEY_PASSWORD = 'biometric_password';
const KEY_ENABLED = 'biometric_enabled';

@Injectable({ providedIn: 'root' })
export class BiometricService {

  /** Controls biometric lock overlay visibility */
  readonly isLocked = signal(false);

  /**
   * True while the OS biometric/credential prompt is showing (and briefly after).
   * The biometric prompt backgrounds then foregrounds the app, which would
   * otherwise re-trigger the resume lock right after a successful unlock.
   */
  private authInProgress = false;
  get isAuthenticating(): boolean { return this.authInProgress; }

  lock(): void {
    // Don't re-lock while an authentication is in progress (the OS prompt's
    // background→foreground cycle must not re-lock the freshly-unlocked app).
    if (this.authInProgress) return;
    this.isLocked.set(true);
  }
  unlock(): void { this.isLocked.set(false); }

  async isEnabled(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const { value } = await Preferences.get({ key: KEY_ENABLED });
    return value === 'true';
  }

  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const info = await BiometricAuth.checkBiometry();
      console.log('[Biometric] checkBiometry:', JSON.stringify(info));
      return !!info?.isAvailable || (info?.biometryType != null && info.biometryType > 0);
    } catch (e) {
      console.warn('[Biometric] isAvailable error:', e);
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    this.authInProgress = true;
    try {
      console.log('[Biometric] calling authenticate()...');
      await BiometricAuth.authenticate({
        reason: 'تحقق من هويتك للدخول · Verify your identity to log in',
        cancelTitle: 'إلغاء · Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'استخدم كلمة المرور · Use Password',
      });
      console.log('[Biometric] authenticate() succeeded');
      this.unlock();
      return true;
    } catch (e) {
      console.warn('[Biometric] authenticate() failed:', e);
      return false;
    } finally {
      // Keep the guard up briefly so the resume event fired when the OS prompt
      // closes doesn't immediately re-lock the app.
      setTimeout(() => { this.authInProgress = false; }, 1500);
    }
  }

  async saveCredentials(username: string, password: string): Promise<void> {
    await Preferences.set({ key: KEY_USERNAME, value: username });
    await Preferences.set({ key: KEY_PASSWORD, value: password });
    await Preferences.set({ key: KEY_ENABLED, value: 'true' });
  }

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    const { value: enabled } = await Preferences.get({ key: KEY_ENABLED });
    if (enabled !== 'true') return null;
    const { value: username } = await Preferences.get({ key: KEY_USERNAME });
    const { value: password } = await Preferences.get({ key: KEY_PASSWORD });
    if (!username || !password) return null;
    return { username, password };
  }

  async hasStoredCredentials(): Promise<boolean> {
    const creds = await this.getCredentials();
    return !!creds;
  }

  async clearCredentials(): Promise<void> {
    await Preferences.remove({ key: KEY_USERNAME });
    await Preferences.remove({ key: KEY_PASSWORD });
    await Preferences.remove({ key: KEY_ENABLED });
  }
}
