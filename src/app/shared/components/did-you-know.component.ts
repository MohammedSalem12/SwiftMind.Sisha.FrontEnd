import { Component, input, signal, OnInit, inject } from '@angular/core';
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
};

const TOPIC_COLORS: Record<string, string> = {
  science: '#059669',
  geography: '#d97706',
  islam: '#667eea',
  technology: '#dc2626',
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
          <span class="tip-text">{{ card()!.contentAr }}</span>
          <span class="tip-text-en">{{ card()!.contentEn }}</span>
        } @else {
          <span class="tip-label">هل تعلم؟ · Did you know?</span>
          <span class="tip-text">{{ fallbackTip().ar }}</span>
          <span class="tip-text-en">{{ fallbackTip().en }}</span>
        }
      </div>
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
  `],
})
export class DidYouKnowComponent implements OnInit {
  private readonly http = inject(HttpClient);
  role = input<string>('STUDENT');
  grade = input<number | null>(null);

  card = signal<KnowledgeCard | null>(null);
  fallbackTip = signal<{ ar: string; en: string }>({ ar: '', en: '' });

  iconClass = signal('fas fa-lightbulb');
  iconBg = signal('linear-gradient(135deg, #667eea, #764ba2)');

  private readonly apiBase = (environment as any).apis?.default?.url || '';

  async ngOnInit(): Promise<void> {
    // Set fallback first
    const tips = FALLBACK[this.role().toUpperCase()] || FALLBACK['STUDENT'];
    this.fallbackTip.set(tips[new Date().getDate() % tips.length]);

    // Try to fetch from API
    try {
      const gradeParam = this.grade() ? `&grade=${this.grade()}` : '';
      const result = await lastValueFrom(
        this.http.get<KnowledgeCard>(`${this.apiBase}/api/knowledge-cards/random?${gradeParam}`)
      );
      if (result) {
        this.card.set(result);
        const icon = TOPIC_ICONS[result.topic] || 'fa-lightbulb';
        this.iconClass.set('fas ' + icon);
        const color = TOPIC_COLORS[result.topic] || '#667eea';
        this.iconBg.set(`linear-gradient(135deg, ${color}, ${color}dd)`);
      }
    } catch {
      // Use fallback — already set
    }
  }

  getTopicLabel(topic: string): string {
    const labels: Record<string, string> = {
      science: 'علوم',
      geography: 'جغرافيا',
      islam: 'إسلام',
      technology: 'تقنية',
    };
    return labels[topic] || topic;
  }
}
