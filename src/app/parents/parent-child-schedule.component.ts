import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { RestService } from '@abp/ng.core';

const DAY_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

interface ScheduleItem {
  courseName: string;
  groupName: string;
  teacherName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  groupType: number;
  meetingLink?: string;
}

@Component({
  selector: 'app-parent-child-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <button class="back-btn" (click)="router.navigate(['/parent'])"><i class="fas fa-arrow-right"></i></button>
        <h1>جدول {{ childName() || 'الطالب' }} · Schedule</h1>
      </div>
      <div class="page-body">
        <div class="day-tabs">
          @for (d of days; track d.i) {
            <button class="day-tab" [class.active]="selectedDay() === d.i" (click)="selectedDay.set(d.i)">
              {{ d.name }}
              @if (countFor(d.i) > 0) { <span class="badge">{{ countFor(d.i) }}</span> }
            </button>
          }
        </div>

        @if (loading()) {
          <div class="loading-state"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state"><i class="fas fa-calendar-times"></i><p>لا توجد حصص · No classes</p></div>
        } @else {
          @for (s of filtered(); track $index) {
            <div class="card">
              <div class="time">
                <span>{{ formatTime(s.startTime) }}</span>
                <span class="sep">–</span>
                <span>{{ formatTime(s.endTime) }}</span>
              </div>
              <div class="info">
                <span class="course">{{ s.courseName }}</span>
                <span class="detail"><i class="fas fa-chalkboard-teacher"></i> {{ s.teacherName }}</span>
                <span class="detail"><i class="fas fa-layer-group"></i> {{ s.groupName }}</span>
                @if (s.location) { <span class="detail"><i class="fas fa-map-marker-alt"></i> {{ s.location }}</span> }
              </div>
              <span class="type-badge" [class]="s.groupType === 1 ? 'online' : 'offline'">
                {{ s.groupType === 1 ? 'أونلاين' : 'حضوري' }}
              </span>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f5f5f7; }
    .page-header { background:linear-gradient(135deg,#667eea,#764ba2); color:white; padding:20px 16px 16px; display:flex; align-items:center; gap:12px; }
    .page-header h1 { font-size:18px; margin:0; font-weight:600; }
    .back-btn { background:rgba(255,255,255,.2); border:none; color:white; width:36px; height:36px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .page-body { padding:16px; }
    .day-tabs { display:flex; gap:6px; overflow-x:auto; padding-bottom:12px; }
    .day-tab {
      flex-shrink:0; padding:8px 12px; border:1.5px solid #e5e7eb; border-radius:10px;
      background:white; cursor:pointer; font-size:13px; font-weight:600; color:#555; position:relative;
    }
    .day-tab.active { border-color:#667eea; background:rgba(102,126,234,.06); color:#667eea; }
    .badge { position:absolute; top:-5px; right:-5px; background:#667eea; color:white; font-size:9px; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .card {
      display:flex; gap:10px; align-items:flex-start; background:white; border-radius:14px;
      padding:14px; margin-bottom:8px; box-shadow:0 1px 3px rgba(0,0,0,.04);
    }
    .time { display:flex; flex-direction:column; align-items:center; min-width:55px; font-size:12px; font-weight:700; color:#667eea; }
    .sep { color:#ccc; font-size:10px; }
    .info { flex:1; display:flex; flex-direction:column; gap:3px; }
    .course { font-size:15px; font-weight:600; color:#1a1a2e; }
    .detail { font-size:12px; color:#666; display:flex; align-items:center; gap:4px; i { font-size:10px; color:#999; } }
    .type-badge { font-size:10px; font-weight:600; padding:3px 8px; border-radius:6px; align-self:flex-start; }
    .online { background:rgba(59,130,246,.1); color:#3b82f6; }
    .offline { background:rgba(245,158,11,.1); color:#d97706; }
    .loading-state,.empty-state { text-align:center; padding:60px 20px; color:#666; }
    .empty-state i { font-size:48px; color:#ccc; display:block; margin-bottom:12px; }
    .spinner { width:36px; height:36px; border:3px solid #e0e0e0; border-top-color:#667eea; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class ParentChildScheduleComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rest = inject(RestService);

  loading = signal(false);
  childName = signal('');
  allSchedules = signal<ScheduleItem[]>([]);
  selectedDay = signal(new Date().getDay());

  days = DAY_AR.map((name, i) => ({ i, name }));

  filtered = computed(() =>
    this.allSchedules().filter(s => s.dayOfWeek === this.selectedDay())
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  countFor(day: number): number {
    return this.allSchedules().filter(s => s.dayOfWeek === day).length;
  }

  async ngOnInit(): Promise<void> {
    const studentId = this.route.snapshot.paramMap.get('studentId');
    if (!studentId) return;

    this.loading.set(true);
    try {
      // Get student's enrollments to find their groups
      const enrollments = await lastValueFrom(this.rest.request<any, any[]>({
        method: 'GET', url: `/api/app/student-enrollment`,
        params: { studentId, maxResultCount: 100, skipCount: 0 },
      }));

      const items = (enrollments as any)?.items ?? enrollments ?? [];
      const schedules: ScheduleItem[] = [];

      for (const e of items) {
        if (!e.groupId) continue;
        try {
          const group = await lastValueFrom(this.rest.request<any, any>({
            method: 'GET', url: `/api/app/group/${e.groupId}`,
          }));
          if (!this.childName()) this.childName.set(e.studentName || '');
          // Get schedules for this group
          const scheds = await lastValueFrom(this.rest.request<any, any>({
            method: 'GET', url: `/api/app/group-schedule`, params: { groupId: e.groupId },
          }));
          for (const s of ((scheds as any)?.items ?? scheds ?? [])) {
            schedules.push({
              courseName: e.courseName || group?.courseName || '',
              groupName: group?.name || '',
              teacherName: e.teacherName || '',
              dayOfWeek: s.dayOfWeek ?? 0,
              startTime: s.startTime ?? '00:00',
              endTime: s.endTime ?? '00:00',
              location: group?.location ?? s.location,
              groupType: group?.groupType ?? 0,
              meetingLink: group?.meetingLink,
            });
          }
        } catch { /* skip failed group */ }
      }
      this.allSchedules.set(schedules);
    } catch (e) {
      console.error('Error loading schedule:', e);
    } finally {
      this.loading.set(false);
    }
  }

  formatTime(time: string): string {
    if (!time) return '';
    const parts = time.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] ?? '00';
    return `${h > 12 ? h - 12 : (h || 12)}:${m} ${h >= 12 ? 'م' : 'ص'}`;
  }
}
