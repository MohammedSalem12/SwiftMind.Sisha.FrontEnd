import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ActiveTermDto {
  id: string;
  nameAr: string;
  nameEn: string;
  academicYear: string;
  termNumber: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-active-semester',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (term()) {
      <div class="semester-bar" dir="rtl">
        <i class="fas fa-calendar-alt"></i>
        <span class="semester-name">{{ term()!.nameAr }}</span>
        <span class="semester-divider">·</span>
        <span class="semester-year">{{ term()!.academicYear }}</span>
      </div>
    }
  `,
  styles: [`
    .semester-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 16px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
      border-bottom: 1px solid rgba(102, 126, 234, 0.12);
      font-size: 0.78rem;
      color: #4a4a6a;
      min-height: 32px;
    }

    .semester-bar i {
      color: #667eea;
      font-size: 0.75rem;
    }

    .semester-name {
      font-weight: 700;
      color: #1a1a2e;
    }

    .semester-divider {
      color: #9090aa;
      font-weight: 300;
    }

    .semester-year {
      font-weight: 600;
      color: #667eea;
      font-size: 0.72rem;
      direction: ltr;
    }
  `],
})
export class ActiveSemesterComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = (environment as any).apis?.default?.url || '';

  term = signal<ActiveTermDto | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const result = await lastValueFrom(
        this.http.get<ActiveTermDto>(`${this.apiBase}/api/app/academic-term/active-term`)
      );
      this.term.set(result ?? null);
    } catch {
      // silent - no active term or API unavailable
    }
  }
}
