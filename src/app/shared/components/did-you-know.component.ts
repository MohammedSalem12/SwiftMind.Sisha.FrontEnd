import { Component, input, signal, OnInit, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface KnowledgeCard {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  topic: string;
  cardType: string;
}

const TOPIC_ICONS: Record<string, string> = {
  science: 'fa-flask',
  geography: 'fa-globe-africa',
  islam: 'fa-mosque',
  technology: 'fa-microchip',
  cybersecurity: 'fa-shield-alt',
  data_protection: 'fa-lock',
  internet_safety: 'fa-user-shield',
  digital_literacy: 'fa-laptop-code',
  cyber_ethics: 'fa-balance-scale',
  social_media_safety: 'fa-users-cog',
  device_security: 'fa-mobile-alt',
  online_privacy: 'fa-eye-slash',
};

const TOPIC_COLORS: Record<string, string> = {
  science: '#059669',
  geography: '#d97706',
  islam: '#667eea',
  technology: '#dc2626',
  cybersecurity: '#0891b2',
  data_protection: '#7c3aed',
  internet_safety: '#ea580c',
  digital_literacy: '#2563eb',
  cyber_ethics: '#b45309',
  social_media_safety: '#e11d48',
  device_security: '#0d9488',
  online_privacy: '#6d28d9',
};

// Fallback tips if API fails
const FALLBACK: Record<string, { ar: string; en: string }[]> = {
  STUDENT: [
    { ar: 'يمكنك متابعة درجاتك وحضورك مباشرة من التطبيق', en: 'Track your grades and attendance directly from the app' },
    { ar: 'استخدم رمز QR الخاص بك لربط حساب ولي أمرك', en: 'Use your QR code to link your parent account' },
  ],
  TEACHER: [
    { ar: 'يمكنك إنشاء مجموعات وجداول حصص لكل مقرر', en: 'Create groups and class schedules for each course' },
    { ar: 'استخدم رموز QR لتسهيل تسجيل حضور الطلاب', en: 'Use QR codes to simplify student attendance' },
  ],
  PARENT: [
    { ar: 'يمكنك متابعة حضور وغياب أبنائك ودرجاتهم', en: 'Track your children attendance and grades' },
    { ar: 'اربط حساب طفلك باستخدام كود الطالب أو رمز QR', en: 'Link your child account using student code or QR' },
  ],
  SECRETARY: [
    { ar: 'يمكنك ربط حسابك بمعلمين لإدارة مقرراتهم', en: 'Link your account with teachers to manage their courses' },
  ],
};

@Component({
  selector: 'app-did-you-know',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tip-card" dir="rtl">
      <div class="tip-icon" [style.background]="iconBg()">
        <i class="fas" [class]="iconClass()"></i>
      </div>
      <div class="tip-content">
        @if (card()) {
          <div class="tip-header">
            <span class="tip-label">{{ card()!.cardType === 'did_you_know' ? 'هل تعلم؟' : 'معلومة' }}</span>
            <span class="tip-topic">{{ getTopicLabel(card()!.topic) }}</span>
          </div>
          <span class="tip-title">{{ card()!.titleAr }}</span>
          @if (expanded()) {
            <span class="tip-text">{{ card()!.contentAr }}</span>
            <span class="tip-text-en">{{ card()!.contentEn }}</span>
          }
        } @else {
          <span class="tip-label">هل تعلم؟ · Did you know?</span>
          @if (expanded()) {
            <span class="tip-text">{{ fallbackTip().ar }}</span>
            <span class="tip-text-en">{{ fallbackTip().en }}</span>
          }
        }
        @if (expanded()) {
          <button class="tip-next" [disabled]="loading()" (click)="showNext(); $event.stopPropagation()">
            @if (loading()) {
              <i class="fas fa-spinner fa-spin"></i>
            } @else {
              <i class="fas fa-arrow-left"></i>
            }
            التالي · Next
            @if (cards().length > 1) {
              <span class="next-counter">{{ currentIndex() + 1 }}/{{ cards().length }}</span>
            }
          </button>
        }
      </div>
      <button class="tip-toggle" (click)="expanded.set(!expanded()); $event.stopPropagation()">
        <i class="fas" [class]="expanded() ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>
    </div>
  `,
  styles: [`
    .tip-card {
      display: flex;
      align-items: flex-start;
      gap: .65rem;
      margin: .5rem 1rem 0;
      padding: .75rem .85rem;
      background: linear-gradient(135deg, rgba(102,126,234,.06), rgba(118,75,162,.06));
      border: 1.5px solid rgba(102,126,234,.15);
      border-radius: 14px;
    }
    .tip-icon {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      i { font-size: .85rem; color: white; }
    }
    .tip-content {
      flex: 1; display: flex; flex-direction: column; gap: .15rem;
    }
    .tip-header {
      display: flex; align-items: center; gap: .4rem; margin-bottom: .1rem;
    }
    .tip-label {
      font-size: .65rem; font-weight: 700; color: #667eea;
    }
    .tip-topic {
      font-size: .58rem; font-weight: 600;
      background: rgba(102,126,234,.1); color: #764ba2;
      padding: .05rem .35rem; border-radius: 6px;
    }
    .tip-title {
      font-size: .82rem; font-weight: 800; color: #1a1a2e; line-height: 1.3;
    }
    .tip-text {
      font-size: .75rem; font-weight: 500; color: #4a4a6a; line-height: 1.5;
    }
    .tip-text-en {
      font-size: .65rem; color: #9090aa; line-height: 1.4; margin-top: .1rem;
    }
    .tip-next {
      display: flex; align-items: center; justify-content: center; gap: .35rem;
      margin-top: .4rem; padding: .4rem .75rem;
      border-radius: 10px; border: 1.5px solid rgba(102,126,234,.2);
      background: rgba(102,126,234,.06); color: #667eea;
      font-size: .72rem; font-weight: 700; cursor: pointer;
      min-height: 36px; width: 100%;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
      &:active { background: rgba(102,126,234,.15); }
      &:disabled { opacity: .5; cursor: default; }
      i { font-size: .6rem; }
    }
    .next-counter {
      font-size: .55rem; font-weight: 600;
      background: rgba(102,126,234,.15); color: #667eea;
      padding: .1rem .35rem; border-radius: 6px;
      margin-right: .15rem;
    }
    .tip-toggle {
      border: none; background: none; color: #667eea;
      font-size: .65rem; cursor: pointer; flex-shrink: 0;
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
      &:active { background: rgba(102,126,234,.1); }
    }
  `],
})
export class DidYouKnowComponent implements OnInit {
  private readonly http = inject(HttpClient);
  role = input<string>('STUDENT');
  grade = input<number | null>(null);

  cards = signal<KnowledgeCard[]>([]);
  currentIndex = signal(0);
  card = computed(() => this.cards().length > 0 ? this.cards()[this.currentIndex()] : null);
  fallbackTip = signal<{ ar: string; en: string }>({ ar: '', en: '' });
  expanded = signal(window.innerWidth < 768);

  iconClass = computed(() => {
    const c = this.card();
    if (!c) return 'fas fa-lightbulb';
    return 'fas ' + (TOPIC_ICONS[c.topic] || 'fa-lightbulb');
  });
  iconBg = computed(() => {
    const c = this.card();
    if (!c) return 'linear-gradient(135deg, #667eea, #764ba2)';
    const color = TOPIC_COLORS[c.topic] || '#667eea';
    return `linear-gradient(135deg, ${color}, ${color}dd)`;
  });

  private readonly apiBase = (environment as any).apis?.default?.url || '';

  async ngOnInit(): Promise<void> {
    // Set fallback first
    const tips = FALLBACK[this.role().toUpperCase()] || FALLBACK['STUDENT'];
    this.fallbackTip.set(tips[new Date().getDate() % tips.length]);

    // Try to fetch batch from API
    try {
      const gradeParam = this.grade() ? `&grade=${this.grade()}` : '';
      const result = await lastValueFrom(
        this.http.get<KnowledgeCard[]>(`${this.apiBase}/api/knowledge-cards/random-batch?count=5${gradeParam}`)
      );
      if (result?.length) {
        this.cards.set(result);
        this.currentIndex.set(0);
      }
    } catch {
      // Try single card fallback
      try {
        const gradeParam = this.grade() ? `&grade=${this.grade()}` : '';
        const single = await lastValueFrom(
          this.http.get<KnowledgeCard>(`${this.apiBase}/api/knowledge-cards/random?${gradeParam}`)
        );
        if (single) this.cards.set([single]);
      } catch {
        // Use fallback — already set
      }
    }
  }

  loading = signal(false);

  async showNext(): Promise<void> {
    const total = this.cards().length;
    const nextIdx = this.currentIndex() + 1;

    // If there are more pre-fetched cards, cycle to next
    if (nextIdx < total) {
      this.currentIndex.set(nextIdx);
      return;
    }

    // If we've seen all pre-fetched cards (max 5), loop back
    if (total >= 5) {
      this.currentIndex.set(0);
      return;
    }

    // Otherwise fetch a fresh one
    this.loading.set(true);
    try {
      const gradeParam = this.grade() ? `&grade=${this.grade()}` : '';
      const result = await lastValueFrom(
        this.http.get<KnowledgeCard>(`${this.apiBase}/api/knowledge-cards/random?${gradeParam}`)
      );
      if (result) {
        this.cards.update(arr => [...arr, result]);
        this.currentIndex.set(this.cards().length - 1);
      }
    } catch {
      // Loop back to start if fetch fails
      if (total > 0) this.currentIndex.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  getTopicLabel(topic: string): string {
    const labels: Record<string, string> = {
      science: 'علوم',
      geography: 'جغرافيا',
      islam: 'إسلام',
      technology: 'تقنية',
      cybersecurity: 'أمن سيبراني',
      data_protection: 'حماية البيانات',
      internet_safety: 'أمان الإنترنت',
      digital_literacy: 'محو أمية رقمية',
      cyber_ethics: 'أخلاقيات رقمية',
      social_media_safety: 'أمان التواصل',
      device_security: 'أمان الأجهزة',
      online_privacy: 'الخصوصية الرقمية',
    };
    return labels[topic] || topic;
  }
}
