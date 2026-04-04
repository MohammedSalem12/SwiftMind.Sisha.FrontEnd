import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { SecretaryTeacherService } from '@proxy/teachers';
import { GroupService } from '@proxy/groups';

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleEntry {
  teacherName: string;
  teacherId: string;
  groupName: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  groupType: number;
  meetingLink?: string;
}

@Component({
  selector: 'app-secretary-schedule-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <button class="back-btn" (click)="router.navigate(['/secretary'])">
          <i class="fas fa-arrow-right"></i>
        </button>
        <h1>جدول المعلمين · Teachers Schedule</h1>
      </div>

      <div class="page-body">
        <!-- Teacher filter -->
        @if (teacherList().length > 1) {
          <div class="teacher-filter">
            <select class="teacher-select" [ngModel]="selectedTeacherId()" (ngModelChange)="selectedTeacherId.set($event)">
              <option value="">جميع المعلمين · All Teachers</option>
              @for (t of teacherList(); track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          </div>
        }

        <!-- Day tabs -->
        <div class="day-tabs">
          @for (d of days; track d.index) {
            <button class="day-tab" [class.active]="selectedDay() === d.index" (click)="selectedDay.set(d.index)">
              <span class="day-ar">{{ d.ar }}</span>
              <span class="day-en">{{ d.en }}</span>
              @if (countForDay(d.index) > 0) {
                <span class="day-badge">{{ countForDay(d.index) }}</span>
              }
            </button>
          }
        </div>

        @if (loading()) {
          <div class="loading-state"><div class="spinner"></div></div>
        } @else if (filteredSchedules().length === 0) {
          <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <p>لا توجد حصص في هذا اليوم</p>
            <p class="en">No sessions on this day</p>
          </div>
        } @else {
          @for (entry of filteredSchedules(); track $index) {
            <div class="schedule-card">
              <div class="time-col">
                <span class="time-start">{{ formatTime(entry.startTime) }}</span>
                <div class="time-line"></div>
                <span class="time-end">{{ formatTime(entry.endTime) }}</span>
              </div>
              <div class="info-col">
                <div class="info-top">
                  <span class="course-name">{{ entry.courseName }}</span>
                  <span class="type-badge" [class]="entry.groupType === 1 ? 'badge-online' : 'badge-offline'">
                    {{ entry.groupType === 1 ? 'أونلاين' : 'حضوري' }}
                  </span>
                </div>
                <span class="group-name"><i class="fas fa-layer-group"></i> {{ entry.groupName }}</span>
                <span class="teacher-name"><i class="fas fa-chalkboard-teacher"></i> {{ entry.teacherName }}</span>
                @if (entry.location) {
                  <span class="location"><i class="fas fa-map-marker-alt"></i> {{ entry.location }}</span>
                }
                @if (entry.meetingLink) {
                  <a class="meeting-link" [href]="entry.meetingLink" target="_blank">
                    <i class="fas fa-video"></i> انضم للاجتماع · Join Meeting
                  </a>
                }
              </div>
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
      display: flex; align-items: center; justify-content: center;
    }
    .page-body { padding: 16px; }

    .teacher-filter { margin-bottom: 12px; }
    .teacher-select {
      width: 100%; padding: 10px 12px; border: 1.5px solid #e5e7eb;
      border-radius: 12px; font-size: 15px; font-family: inherit;
      background: white; color: #1a1a2e; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23667eea'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: left 12px center;
    }
    .teacher-select:focus { outline: none; border-color: #667eea; }

    .day-tabs {
      display: flex; gap: 6px; overflow-x: auto; padding-bottom: 12px;
      -webkit-overflow-scrolling: touch;
    }
    .day-tab {
      flex-shrink: 0; padding: 8px 14px; border: 1.5px solid #e5e7eb; border-radius: 12px;
      background: white; cursor: pointer; text-align: center; min-width: 60px;
      display: flex; flex-direction: column; align-items: center; gap: 2px; position: relative;
    }
    .day-tab.active { border-color: #667eea; background: rgba(102,126,234,.06); }
    .day-ar { font-size: 13px; font-weight: 700; color: #333; }
    .day-en { font-size: 10px; color: #888; }
    .day-badge {
      position: absolute; top: -4px; right: -4px;
      background: #667eea; color: white; font-size: 10px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }

    .schedule-card {
      display: flex; gap: 12px; background: white; border-radius: 14px;
      padding: 14px; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .time-col {
      display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 50px;
    }
    .time-start, .time-end { font-size: 12px; font-weight: 700; color: #667eea; }
    .time-line { width: 2px; height: 20px; background: #e5e7eb; border-radius: 1px; }
    .info-col { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .info-top { display: flex; align-items: center; gap: 8px; }
    .course-name { font-size: 15px; font-weight: 600; color: #1a1a2e; }
    .type-badge {
      font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 6px;
    }
    .badge-online { background: rgba(59,130,246,.1); color: #3b82f6; }
    .badge-offline { background: rgba(245,158,11,.1); color: #d97706; }
    .group-name, .teacher-name, .location {
      font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;
      i { font-size: 10px; color: #999; }
    }
    .meeting-link {
      font-size: 12px; color: #3b82f6; text-decoration: none; font-weight: 600;
      display: flex; align-items: center; gap: 4px;
    }

    .loading-state, .empty-state { text-align: center; padding: 60px 20px; color: #666; }
    .empty-state i { font-size: 48px; color: #ccc; display: block; margin-bottom: 12px; }
    .en { font-size: 13px; color: #999; }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e0e0e0;
      border-top-color: #667eea; border-radius: 50%;
      animation: spin .8s linear infinite; margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SecretaryScheduleOverviewComponent implements OnInit {
  readonly router = inject(Router);
  private readonly secretaryTeacherService = inject(SecretaryTeacherService);
  private readonly groupService = inject(GroupService);

  loading = signal(false);
  allSchedules = signal<ScheduleEntry[]>([]);
  selectedDay = signal(new Date().getDay()); // Today
  selectedTeacherId = signal('');
  teacherList = signal<{id: string; name: string}[]>([]);

  days = DAY_NAMES_AR.map((ar, i) => ({ index: i, ar, en: DAY_NAMES_EN[i] }));

  private teacherFiltered = computed(() => {
    const tid = this.selectedTeacherId();
    const all = this.allSchedules();
    return tid ? all.filter(s => s.teacherId === tid) : all;
  });

  filteredSchedules = computed(() =>
    this.teacherFiltered()
      .filter(s => s.dayOfWeek === this.selectedDay())
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  countForDay(day: number): number {
    return this.teacherFiltered().filter(s => s.dayOfWeek === day).length;
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const teachers = await lastValueFrom(this.secretaryTeacherService.getTeachersForCurrentSecretary());
      const all: ScheduleEntry[] = [];

      for (const t of (teachers ?? [])) {
        try {
          const groups = await lastValueFrom(
            this.groupService.getGroupsForTeacherAndCourse(t.teacherId!, '' as any)
          ).catch(() => []);

          for (const g of (groups as any[] ?? [])) {
            for (const s of (g.schedules ?? [])) {
              all.push({
                teacherName: t.teacherName ?? '',
                teacherId: t.teacherId ?? '',
                groupName: g.name ?? '',
                courseName: g.courseName ?? '',
                dayOfWeek: s.dayOfWeek ?? 0,
                startTime: s.startTime ?? '00:00',
                endTime: s.endTime ?? '00:00',
                location: g.location ?? s.location,
                groupType: g.groupType ?? 0,
                meetingLink: g.meetingLink,
              });
            }
          }
        } catch { /* skip failed teacher */ }
      }

      this.allSchedules.set(all);

      // Build unique teacher list for filter
      const map = new Map<string, string>();
      for (const s of all) { if (s.teacherId && !map.has(s.teacherId)) map.set(s.teacherId, s.teacherName); }
      this.teacherList.set([...map.entries()].map(([id, name]) => ({ id, name })));
    } catch (e) {
      console.error('Error loading schedules:', e);
    } finally {
      this.loading.set(false);
    }
  }

  formatTime(time: string): string {
    if (!time) return '';
    const parts = time.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] ?? '00';
    const ampm = h >= 12 ? 'م' : 'ص';
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${h12}:${m} ${ampm}`;
  }
}
