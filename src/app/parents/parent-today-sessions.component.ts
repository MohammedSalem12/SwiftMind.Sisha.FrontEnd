import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ConfigStateService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { ParentService } from '@proxy/parents';
import type { ParentStudentDto } from '@proxy/parents/models';
import { ParentStudentLinkStatus } from '@proxy/enums/parent-student-link-status.enum';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { GroupService } from '@proxy/groups';
import { TeacherService } from '@proxy/teachers';
import { CourseService } from '@proxy/courses';

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

interface SessionInfo {
  courseName: string;
  teacherName: string;
  groupName: string;
  startTime: string;
  endTime: string;
  startMins: number;
  location?: string;
}

interface ChildSessions {
  studentName: string;
  studentId: string;
  sessions: SessionInfo[];
}

@Component({
  selector: 'app-parent-today-sessions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page" dir="rtl">

      <div class="header">
        <button class="back-btn" (click)="router.navigate(['/parent'])">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-info">
          <h1>حصص اليوم · Today's Sessions</h1>
          <span class="header-day">{{ todayName }}</span>
        </div>
        <div class="header-time">{{ currentTime() }}</div>
      </div>

      @if (loading()) {
        <div class="load-area">
          @for (i of [1,2]; track i) { <div class="shimmer"></div> }
        </div>
      }

      @if (!loading()) {
        @for (child of childSessions(); track child.studentId) {
          <div class="child-section">
            <div class="child-header">
              <div class="child-avatar">{{ getInitials(child.studentName) }}</div>
              <span class="child-name">{{ child.studentName }}</span>
              <span class="child-count">{{ child.sessions.length }} حصة</span>
            </div>

            @if (child.sessions.length === 0) {
              <div class="no-sessions">
                <i class="fas fa-coffee"></i>
                <span>لا توجد حصص اليوم · No sessions today</span>
              </div>
            }

            @for (s of child.sessions; track $index) {
              <div class="session-card" [class.session-past]="isPast(s)" [class.session-active]="isActive(s)">
                <div class="time-col">
                  <span class="time-start">{{ fmtTime(s.startTime) }}</span>
                  <div class="time-dot" [class.dot-active]="isActive(s)" [class.dot-past]="isPast(s)"></div>
                  <span class="time-end">{{ fmtTime(s.endTime) }}</span>
                </div>
                <div class="info-col">
                  <span class="session-course">{{ s.courseName }}</span>
                  <span class="session-teacher"><i class="fas fa-chalkboard-teacher"></i> {{ s.teacherName }}</span>
                  @if (s.groupName) {
                    <span class="session-group"><i class="fas fa-layer-group"></i> {{ s.groupName }}</span>
                  }
                  @if (s.location) {
                    <span class="session-loc"><i class="fas fa-map-marker-alt"></i> {{ s.location }}</span>
                  }
                </div>
                <div class="countdown-col">
                  @if (isActive(s)) {
                    <span class="badge-active"><i class="fas fa-broadcast-tower"></i> الآن</span>
                  } @else if (!isPast(s)) {
                    <span class="badge-upcoming">{{ getCountdown(s) }}</span>
                  } @else {
                    <span class="badge-done"><i class="fas fa-check"></i></span>
                  }
                </div>
              </div>
            }
          </div>
        }

        @if (childSessions().length === 0) {
          <div class="empty">
            <div class="empty-icon"><i class="fas fa-calendar-check"></i></div>
            <h3>لا يوجد أبناء مرتبطون</h3>
            <p>No linked children</p>
          </div>
        }
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .header {
      background:linear-gradient(135deg,#667eea,#764ba2);
      padding:calc(env(safe-area-inset-top,0px) + .6rem) 1rem .75rem;
      display:flex; align-items:center; gap:.75rem;
    }
    .back-btn {
      width:40px; height:40px; border-radius:50%; flex-shrink:0;
      background:rgba(255,255,255,.15); border:1.5px solid rgba(255,255,255,.25);
      color:#fff; font-size:.9rem; display:flex; align-items:center; justify-content:center;
      cursor:pointer; min-width:44px; min-height:44px;
    }
    .header-info { flex:1; }
    .header h1 { margin:0; font-size:1.05rem; font-weight:800; color:#fff; }
    .header-day { font-size:.72rem; color:rgba(255,255,255,.6); }
    .header-time {
      font-size:1.1rem; font-weight:800; color:#fff;
      background:rgba(255,255,255,.15); padding:.3rem .65rem; border-radius:10px;
      font-variant-numeric:tabular-nums;
    }

    .load-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer {
      height:120px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .child-section { padding:.75rem 1rem 0; }
    .child-header {
      display:flex; align-items:center; gap:.6rem; margin-bottom:.6rem;
    }
    .child-avatar {
      width:36px; height:36px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:.8rem; font-weight:700; flex-shrink:0;
    }
    .child-name { font-size:.9rem; font-weight:700; color:#1a1a2e; flex:1; }
    .child-count {
      font-size:.68rem; font-weight:700; color:#667eea;
      background:rgba(102,126,234,.1); padding:.15rem .5rem; border-radius:8px;
    }

    .no-sessions {
      display:flex; align-items:center; gap:.5rem; padding:.85rem;
      background:#fff; border-radius:12px; border:1.5px solid #f0f0f5;
      font-size:.82rem; color:#9ca3af;
      i { color:#d1d5db; }
    }

    .session-card {
      display:flex; gap:.75rem; padding:.85rem;
      background:#fff; border-radius:14px; margin-bottom:.5rem;
      border:1.5px solid #f0f0f5; box-shadow:0 2px 8px rgba(0,0,0,.03);
      transition:opacity .2s;
    }
    .session-past { opacity:.5; }
    .session-active { border-color:rgba(34,197,94,.3); background:#f0fdf4; }

    .time-col {
      display:flex; flex-direction:column; align-items:center; gap:.15rem;
      min-width:44px;
    }
    .time-start, .time-end { font-size:.68rem; font-weight:700; color:#667eea; }
    .time-dot {
      width:8px; height:8px; border-radius:50%; background:#d1d5db;
    }
    .dot-active { background:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.2); animation:pulse 1.5s infinite; }
    .dot-past { background:#9ca3af; }
    @keyframes pulse { 0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,.2)} 50%{box-shadow:0 0 0 6px rgba(34,197,94,.1)} }

    .info-col { flex:1; min-width:0; display:flex; flex-direction:column; gap:.15rem; }
    .session-course { font-size:.88rem; font-weight:700; color:#1a1a2e; }
    .session-teacher, .session-group, .session-loc {
      font-size:.7rem; color:#6b7280; display:flex; align-items:center; gap:.2rem;
      i { font-size:.55rem; color:#667eea; }
    }

    .countdown-col { display:flex; align-items:center; flex-shrink:0; }
    .badge-active {
      font-size:.65rem; font-weight:700; color:#16a34a;
      background:rgba(34,197,94,.12); padding:.25rem .5rem; border-radius:8px;
      display:flex; align-items:center; gap:.25rem;
      i { font-size:.55rem; }
    }
    .badge-upcoming {
      font-size:.7rem; font-weight:700; color:#d97706;
      background:rgba(245,158,11,.1); padding:.25rem .5rem; border-radius:8px;
      font-variant-numeric:tabular-nums;
    }
    .badge-done {
      font-size:.7rem; color:#9ca3af;
      background:rgba(156,163,175,.1); padding:.25rem .45rem; border-radius:8px;
    }

    .empty {
      display:flex; flex-direction:column; align-items:center;
      padding:3.5rem 1.5rem; text-align:center;
    }
    .empty-icon {
      width:64px; height:64px; border-radius:50%;
      background:rgba(102,126,234,.1); display:flex; align-items:center; justify-content:center;
      font-size:1.5rem; color:#667eea; margin-bottom:.75rem;
    }
    .empty h3 { margin:0 0 .2rem; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .empty p { margin:0; font-size:.78rem; color:#9ca3af; }
  `],
})
export class ParentTodaySessionsComponent implements OnInit, OnDestroy {
  readonly router = inject(Router);
  private readonly configSvc = inject(ConfigStateService);
  private readonly parentSvc = inject(ParentService);
  private readonly enrollmentSvc = inject(EnrollmentRequestService);
  private readonly groupSvc = inject(GroupService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly courseSvc = inject(CourseService);

  loading = signal(true);
  childSessions = signal<ChildSessions[]>([]);
  currentTime = signal('');
  todayName = DAYS_AR[new Date().getDay()];
  private timer: any;
  private nowMins = 0;

  getInitials(name?: string): string {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0]?.[0]?.toUpperCase() || '?');
  }

  isPast(s: SessionInfo): boolean {
    return this.nowMins >= this.toMins(s.endTime);
  }

  isActive(s: SessionInfo): boolean {
    return this.nowMins >= s.startMins && this.nowMins < this.toMins(s.endTime);
  }

  getCountdown(s: SessionInfo): string {
    const diff = s.startMins - this.nowMins;
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0) return `${h}س ${m}د`;
    return `${m} دقيقة`;
  }

  fmtTime(t?: string): string {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    const d = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return `${d}:${m} ${hr >= 12 ? 'م' : 'ص'}`;
  }

  private toMins(t?: string): number {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private updateClock(): void {
    const now = new Date();
    this.nowMins = now.getHours() * 60 + now.getMinutes();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    this.currentTime.set(`${d}:${m} ${h >= 12 ? 'م' : 'ص'}`);
  }

  async ngOnInit(): Promise<void> {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 30000);

    try {
      const userId = this.configSvc.getOne('currentUser')?.id;
      if (!userId) return;

      const parent = await lastValueFrom(this.parentSvc.getByUserId(userId)).catch(() => null);
      if (!parent?.id) return;

      const students = await lastValueFrom(this.parentSvc.getLinkedStudentsByParentId(parent.id)).catch(() => []);
      const confirmed = (students || []).filter((s: any) => s.linkStatus === ParentStudentLinkStatus.Confirmed);

      const allRequests = await lastValueFrom(this.enrollmentSvc.getList({ skipHandleError: true } as any)).catch(() => []);
      const today = new Date().getDay();

      const result: ChildSessions[] = [];

      for (const child of confirmed) {
        const approved = (allRequests || []).filter(
          (r: any) => r.studentId === child.studentId && r.status === EnrollmentRequestStatus.Approved
        );

        const sessions: SessionInfo[] = [];

        for (const req of approved) {
          if (!req.teacherId || !req.courseId) continue;
          try {
            const groups = await lastValueFrom(
              this.groupSvc.getGroupsForTeacherAndCourse(req.teacherId, req.courseId)
            ).catch(() => []);
            const myGroup = req.groupId
              ? groups?.find((g: any) => g.groupId === req.groupId) ?? groups?.[0]
              : groups?.[0];
            if (!myGroup) continue;

            const teacherName = (myGroup as any).teacherName || req.teacherName || '';
            let courseName = req.courseName || '';
            if (!courseName) {
              const c = await lastValueFrom(this.courseSvc.get(req.courseId)).catch(() => null);
              if (c) courseName = (c as any).nameAr || (c as any).nameEn || '';
            }

            for (const s of (myGroup.schedules || [])) {
              if (s.dayOfWeek === today) {
                sessions.push({
                  courseName,
                  teacherName: teacherName || '',
                  groupName: myGroup.name || '',
                  startTime: s.startTime || '00:00',
                  endTime: s.endTime || '00:00',
                  startMins: this.toMins(s.startTime),
                  location: (myGroup as any).location || s.location,
                });
              }
            }
          } catch { /* silent */ }
        }

        sessions.sort((a, b) => a.startMins - b.startMins);

        result.push({
          studentName: child.studentName || '',
          studentId: child.studentId || '',
          sessions,
        });
      }

      this.childSessions.set(result);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
