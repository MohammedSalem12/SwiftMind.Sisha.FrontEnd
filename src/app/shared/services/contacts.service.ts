import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { RestService } from '@abp/ng.core';

export interface ContactInfo {
  name: string;
  phones: string[];
}

export interface ContactCheckResult {
  registered: { phoneNumber: string; name: string; actorType: string }[];
  unregistered: string[];
}

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private readonly rest = inject(RestService);

  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { Contacts } = await import('@capacitor-community/contacts');
      const result = await Contacts.requestPermissions();
      return result.contacts === 'granted';
    } catch (e) {
      console.warn('[Contacts] permission error:', e);
      return false;
    }
  }

  async getContacts(): Promise<ContactInfo[]> {
    if (!Capacitor.isNativePlatform()) return [];
    try {
      const { Contacts } = await import('@capacitor-community/contacts');
      const result = await Contacts.getContacts({
        projection: { name: true, phones: true },
      });
      return (result.contacts ?? [])
        .filter(c => c.phones && c.phones.length > 0)
        .map(c => ({
          name: c.name?.display ?? c.name?.given ?? 'Unknown',
          phones: c.phones!.map(p => p.number ?? '').filter(n => n.length > 0),
        }));
    } catch (e) {
      console.warn('[Contacts] getContacts error:', e);
      return [];
    }
  }

  checkRegistered(phoneNumbers: string[]): Promise<ContactCheckResult> {
    return this.rest.request<ContactCheckInputDto, ContactCheckResult>({
      method: 'POST',
      url: '/api/app/contact/check',
      body: { phoneNumbers } as ContactCheckInputDto,
    }).toPromise() as Promise<ContactCheckResult>;
  }
}

interface ContactCheckInputDto {
  phoneNumbers: string[];
}
