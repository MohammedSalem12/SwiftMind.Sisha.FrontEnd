import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { ContactsService, ContactInfo, ContactCheckResult } from '../shared/services/contacts.service';

interface DisplayContact {
  name: string;
  phone: string;
  actorType?: string;
  registeredName?: string;
}

@Component({
  selector: 'app-invite-friends',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="router.navigate(['/student/points'])">
          <i class="fas fa-arrow-right"></i>
        </button>
        <h1>دعوة الأصدقاء · Invite Friends</h1>
      </div>

      <div class="page-body">

        @if (!isNative) {
          <div class="empty-state">
            <i class="fas fa-mobile-alt"></i>
            <p>هذه الميزة متاحة فقط على تطبيق الهاتف</p>
            <p class="en">This feature is only available on the mobile app</p>
          </div>
        } @else if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>جاري قراءة جهات الاتصال...</p>
            <p class="en">Reading contacts...</p>
          </div>
        } @else if (!permissionGranted()) {
          <div class="empty-state">
            <i class="fas fa-address-book"></i>
            <p>نحتاج إذن الوصول لجهات الاتصال للعثور على أصدقائك</p>
            <p class="en">We need contacts permission to find your friends</p>
            <button class="action-btn" (click)="requestAndLoad()">
              <i class="fas fa-unlock"></i> منح الإذن · Grant Permission
            </button>
          </div>
        } @else {

          <!-- Search -->
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)"
                   placeholder="بحث في جهات الاتصال · Search contacts" />
          </div>

          <!-- Registered Section -->
          @if (filteredRegistered().length > 0) {
            <div class="section">
              <div class="section-title">
                <i class="fas fa-check-circle" style="color:#10b981"></i>
                موجودون في KAI · Already on KAI
                <span class="badge">{{ filteredRegistered().length }}</span>
              </div>
              @for (contact of filteredRegistered(); track contact.phone) {
                <div class="contact-card registered">
                  <div class="contact-avatar" [style.background]="getAvatarColor(contact.actorType!)">
                    {{ getInitial(contact.registeredName ?? contact.name) }}
                  </div>
                  <div class="contact-info">
                    <span class="contact-name">{{ contact.name }}</span>
                    <span class="contact-phone">{{ contact.phone }}</span>
                  </div>
                  <span class="role-badge" [style.background]="getRoleBadgeColor(contact.actorType!)">
                    {{ getRoleLabel(contact.actorType!) }}
                  </span>
                </div>
              }
            </div>
          }

          <!-- Unregistered Section -->
          @if (filteredUnregistered().length > 0) {
            <div class="section">
              <div class="section-title">
                <i class="fas fa-user-plus" style="color:#667eea"></i>
                ادعُ أصدقائك · Invite Friends
                <span class="badge">{{ filteredUnregistered().length }}</span>
              </div>
              @for (contact of filteredUnregistered(); track contact.phone) {
                <div class="contact-card">
                  <div class="contact-avatar" style="background:rgba(102,126,234,.12);color:#667eea">
                    {{ getInitial(contact.name) }}
                  </div>
                  <div class="contact-info">
                    <span class="contact-name">{{ contact.name }}</span>
                    <span class="contact-phone">{{ contact.phone }}</span>
                  </div>
                  <button class="invite-btn" (click)="inviteContact(contact)">
                    <i class="fas fa-share"></i> دعوة
                  </button>
                </div>
              }
            </div>
          }

          @if (filteredRegistered().length === 0 && filteredUnregistered().length === 0) {
            <div class="empty-state">
              <i class="fas fa-search"></i>
              <p>لا توجد نتائج</p>
              <p class="en">No results found</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f5f7; }
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 20px 16px 16px; display: flex; align-items: center; gap: 12px;
    }
    .page-header h1 { font-size: 18px; margin: 0; font-weight: 600; }
    .back-btn {
      background: rgba(255,255,255,.2); border: none; color: white;
      width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
    }
    .page-body { padding: 16px; }

    .search-box {
      display: flex; align-items: center; gap: 10px;
      background: white; border-radius: 12px; padding: 0 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); margin-bottom: 16px;
    }
    .search-box i { color: #999; font-size: 14px; }
    .search-box input {
      flex: 1; border: none; outline: none; padding: 12px 0;
      font-size: 15px; background: transparent; font-family: inherit;
    }

    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 15px; font-weight: 600; color: #333;
      margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
    }
    .badge {
      background: rgba(102,126,234,.12); color: #667eea;
      font-size: 12px; padding: 2px 8px; border-radius: 10px; font-weight: 600;
    }

    .contact-card {
      display: flex; align-items: center; gap: 12px;
      background: white; border-radius: 12px; padding: 12px 14px;
      margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.04);
    }
    .contact-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; flex-shrink: 0;
    }
    .contact-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .contact-name { font-size: 15px; font-weight: 500; color: #1a1a2e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .contact-phone { font-size: 13px; color: #888; direction: ltr; text-align: right; }

    .role-badge {
      font-size: 11px; color: white; padding: 3px 10px;
      border-radius: 10px; font-weight: 600; white-space: nowrap;
    }

    .invite-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border: none; border-radius: 10px;
      padding: 8px 16px; font-size: 13px; font-weight: 600;
      cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px;
      min-height: 44px;
    }
    .invite-btn:active { opacity: .85; }

    .action-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border: none; border-radius: 12px;
      padding: 14px 28px; font-size: 15px; font-weight: 600;
      cursor: pointer; margin-top: 16px; min-height: 44px;
    }

    .loading-state, .empty-state {
      text-align: center; padding: 60px 20px; color: #666;
    }
    .loading-state i, .empty-state i { font-size: 48px; color: #ccc; margin-bottom: 16px; display: block; }
    .empty-state .fas { font-size: 48px; color: #ccc; margin-bottom: 16px; display: block; }
    .en { font-size: 13px; color: #999; margin-top: 4px; }

    .spinner {
      width: 36px; height: 36px; border: 3px solid #e0e0e0;
      border-top-color: #667eea; border-radius: 50%;
      animation: spin .8s linear infinite; margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class InviteFriendsComponent implements OnInit {
  readonly router = inject(Router);
  private readonly contactsService = inject(ContactsService);
  private readonly rest = inject(RestService);

  readonly isNative = Capacitor.isNativePlatform();
  readonly loading = signal(false);
  readonly permissionGranted = signal(false);
  readonly searchTerm = signal('');
  readonly registeredContacts = signal<DisplayContact[]>([]);
  readonly unregisteredContacts = signal<DisplayContact[]>([]);
  private referralCode = '';

  readonly filteredRegistered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.registeredContacts();
    return this.registeredContacts().filter(c =>
      c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );
  });

  readonly filteredUnregistered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.unregisteredContacts();
    return this.unregisteredContacts().filter(c =>
      c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );
  });

  async ngOnInit(): Promise<void> {
    if (!this.isNative) return;
    await this.requestAndLoad();
  }

  async requestAndLoad(): Promise<void> {
    const granted = await this.contactsService.requestPermission();
    this.permissionGranted.set(granted);
    if (!granted) return;

    this.loading.set(true);
    try {
      // Load contacts and referral code in parallel
      const [contacts, balance] = await Promise.all([
        this.contactsService.getContacts(),
        this.loadReferralCode(),
      ]);

      if (contacts.length === 0) {
        this.loading.set(false);
        return;
      }

      // Flatten all phone numbers, keeping name mapping
      const phoneToName = new Map<string, string>();
      const allPhones: string[] = [];
      for (const c of contacts) {
        for (const phone of c.phones) {
          if (!phoneToName.has(phone)) {
            phoneToName.set(phone, c.name);
            allPhones.push(phone);
          }
        }
      }

      // Send in batches of 500
      const registered: DisplayContact[] = [];
      const matchedPhones = new Set<string>();

      for (let i = 0; i < allPhones.length; i += 500) {
        const batch = allPhones.slice(i, i + 500);
        const result = await this.contactsService.checkRegistered(batch);

        for (const r of result.registered) {
          matchedPhones.add(r.phoneNumber);
          // Find contact name from phone mapping
          const contactName = phoneToName.get(r.phoneNumber) ?? r.name;
          registered.push({
            name: contactName,
            phone: r.phoneNumber,
            actorType: r.actorType,
            registeredName: r.name,
          });
        }
      }

      // Build unregistered list (unique by name)
      const unregistered: DisplayContact[] = [];
      const seenNames = new Set<string>();
      for (const c of contacts) {
        const hasMatch = c.phones.some(p => matchedPhones.has(p));
        if (!hasMatch && !seenNames.has(c.name)) {
          seenNames.add(c.name);
          unregistered.push({ name: c.name, phone: c.phones[0] });
        }
      }

      this.registeredContacts.set(registered);
      this.unregisteredContacts.set(unregistered);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadReferralCode(): Promise<void> {
    try {
      const balance = await lastValueFrom(
        this.rest.request<void, any>({ method: 'GET', url: '/api/app/student-points/my-balance' })
      );
      this.referralCode = balance?.referralCode ?? '';
    } catch {
      this.referralCode = '';
    }
  }

  async inviteContact(contact: DisplayContact): Promise<void> {
    const link = this.referralCode
      ? `https://sesha-9999.web.app/register?ref=${this.referralCode}`
      : 'https://sesha-9999.web.app/register';
    const text = this.referralCode
      ? `انضم لتطبيق KAI التعليمي واستخدم كود الدعوة: ${this.referralCode}\nJoin KAI educational app and use referral code: ${this.referralCode}\n${link}`
      : `انضم لتطبيق KAI التعليمي!\nJoin KAI educational app!\n${link}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'KAI - دعوة صديق', text, url: link });
      } else {
        await navigator.clipboard?.writeText(text);
      }
    } catch (e) {
      console.warn('[Invite] share error:', e);
    }
  }

  getInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() ?? '?';
  }

  getAvatarColor(actorType: string): string {
    switch (actorType) {
      case 'Student': return 'rgba(118,75,162,.12)';
      case 'Teacher': return 'rgba(59,130,246,.12)';
      case 'Parent': return 'rgba(16,185,129,.12)';
      default: return 'rgba(102,126,234,.12)';
    }
  }

  getRoleBadgeColor(actorType: string): string {
    switch (actorType) {
      case 'Student': return '#764ba2';
      case 'Teacher': return '#3b82f6';
      case 'Parent': return '#10b981';
      default: return '#667eea';
    }
  }

  getRoleLabel(actorType: string): string {
    switch (actorType) {
      case 'Student': return 'طالب';
      case 'Teacher': return 'معلم';
      case 'Parent': return 'ولي أمر';
      default: return actorType;
    }
  }
}
