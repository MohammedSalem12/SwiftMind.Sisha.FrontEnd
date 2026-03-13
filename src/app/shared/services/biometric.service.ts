import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const KEY_USERNAME = 'biometric_username';
const KEY_PASSWORD = 'biometric_password';
const KEY_ENABLED = 'biometric_enabled';

@Injectable({ providedIn: 'root' })
export class BiometricService {
  private _BiometricAuth: any;
  private _pluginLoaded = false;

  private async getPlugin(): Promise<any> {
    if (!this._pluginLoaded) {
      this._pluginLoaded = true;
      try {
        const mod = await import('@aparajita/capacitor-biometric-auth');
        this._BiometricAuth = mod.BiometricAuth ?? (mod as any).default ?? null;
        console.log('[Biometric] Plugin loaded:', !!this._BiometricAuth, Object.keys(mod));
      } catch (e) {
        console.warn('[Biometric] Plugin import failed:', e);
        this._BiometricAuth = null;
      }
    }
    return this._BiometricAuth;
  }

  async isAvailable(): Promise<boolean> {
    const isNative = Capacitor.isNativePlatform();
    console.log('[Biometric] isNativePlatform:', isNative, 'platform:', Capacitor.getPlatform());
    if (!isNative) return false;
    try {
      const plugin = await this.getPlugin();
      console.log('[Biometric] plugin:', !!plugin);
      if (!plugin) {
        // Plugin not available — still show section on native so user knows it exists
        return true;
      }
      const info = await plugin.checkBiometry();
      console.log('[Biometric] checkBiometry result:', JSON.stringify(info));
      return !!info?.isAvailable || (info?.biometryType != null && info.biometryType > 0);
    } catch (e) {
      console.warn('[Biometric] isAvailable error:', e);
      // On native, show section anyway
      return true;
    }
  }

  async authenticate(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const plugin = await this.getPlugin();
      if (!plugin) return false;
      await plugin.authenticate({
        reason: 'تحقق من هويتك للدخول',
        cancelTitle: 'إلغاء',
        allowDeviceCredential: true,
        iosFallbackTitle: 'استخدم كلمة المرور',
      });
      return true;
    } catch {
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
