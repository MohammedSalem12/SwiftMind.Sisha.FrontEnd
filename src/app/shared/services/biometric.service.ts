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

  lock(): void { this.isLocked.set(true); }
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
    try {
      console.log('[Biometric] calling authenticate()...');
      await BiometricAuth.authenticate({
        reason: 'تحقق من هويتك للدخول · Verify your identity to log in',
        cancelTitle: 'إلغاء · Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'استخدم كلمة المرور · Use Password',
      });
      console.log('[Biometric] authenticate() succeeded');
      return true;
    } catch (e) {
      console.warn('[Biometric] authenticate() failed:', e);
      return false;
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
