import { AuthService, ConfigStateService, LocalizationPipe, LocalizationService } from '@abp/ng.core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';

@Component({
  selector: 'app-teacher-groups',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, LocalizationPipe],
  templateUrl: './teacher-groups.component.html',
  styleUrls: ['./teacher-groups.component.scss'],
})
export class TeacherGroupsComponent implements OnInit {
  private authService        = inject(AuthService);
  private configStateService = inject(ConfigStateService);
  private currentUserService = inject(CurrentUserInfoService);
  private groupService       = inject(GroupService);
  private router             = inject(Router);
  private route              = inject(ActivatedRoute);
  private localization       = inject(LocalizationService);
  private readonly destroyRef = inject(DestroyRef);

  // Component state
  loading = signal<boolean>(false);
  error   = signal<string | null>(null);
  groups  = signal<GroupWithSchedulesDto[]>([]);
  // groupId -> auto-accept join requests enabled
  autoAccept = signal<Record<string, boolean>>({});

  // Teacher info
  teacherName = signal<string | null>(null);
  teacherCode = signal<string | null>(null);
  teacherId   = signal<string | null>(null);

  // Filter by course
  courseId   = signal<string | null>(null);
  courseName = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.courseId.set(params['courseId'] || null);
    });
    this.loadCurrentUserAndGroups();
  }

  private async loadCurrentUserAndGroups() {
    if (!this.authService.isAuthenticated) {
      this.error.set(this.l('TeacherGroups:LoginRequired'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const currentUserActor = await this.currentUserService.getCurrentUserActorInfo().toPromise();

      if (!currentUserActor) {
        throw new Error(this.l('TeacherGroups:CannotGetUserInfo'));
      }

      const isTeacher =
        currentUserActor.userRoles?.some(role => role.toLowerCase() === 'teacher') ||
        currentUserActor.actorType?.toLowerCase() === 'teacher';

      const isSecretary =
        currentUserActor.userRoles?.some(role => role.toLowerCase() === 'secretary') ||
        currentUserActor.actorType?.toLowerCase() === 'secretary';

      if (!isTeacher && !isSecretary) {
        this.error.set(this.l('TeacherGroups:TeachersOnly'));
        return;
      }

      // Secretary: use teacherId from query param if provided
      const qpTeacherId = this.route.snapshot.queryParamMap.get('teacherId');
      if (isSecretary && qpTeacherId) {
        this.teacherId.set(qpTeacherId);
        this.teacherName.set(null); // will be loaded from groups
      } else {
        this.teacherId.set(currentUserActor.actorId || null);
        this.teacherName.set(currentUserActor.actorName || null);
        this.teacherCode.set(currentUserActor.actorCode || null);
      }

      if (!this.teacherId()) {
        throw new Error(this.l('TeacherGroups:CannotDetermineTeacherId'));
      }

      await this.loadTeacherGroups();

    } catch (error: any) {
      console.error('Error loading teacher groups:', error);
      this.error.set(error.message || this.l('TeacherGroups:ErrorLoadingGroups'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadTeacherGroups() {
    const teacherId = this.teacherId();
    if (!teacherId) {
      this.error.set(this.l('TeacherGroups:TeacherIdNotAvailable'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.loadAutoAcceptMap();
      const filterCourseId = this.courseId();

      if (filterCourseId) {
        try {
          const groupsWithSchedules = await lastValueFrom(
            this.groupService.getGroupsForTeacherAndCourse(teacherId, filterCourseId)
          );
          this.groups.set(groupsWithSchedules || []);
          if (groupsWithSchedules?.length > 0) {
            this.courseName.set(groupsWithSchedules[0].courseName || null);
          }
        } catch {
          const allGroups = await lastValueFrom(this.groupService.getList());
          if (allGroups?.items) {
            const filtered = allGroups.items
              .filter(g => g.courseId === filterCourseId)
              .map(g => ({
                groupId: g.id, name: g.name, teacherId: g.teacherId,
                teacherName: g.teacherName, groupCode: g.groupCode,
                courseId: g.courseId, courseName: g.courseName, isStopped: false, schedules: [],
              }));
            this.groups.set(filtered);
            if (filtered.length > 0) this.courseName.set(filtered[0].courseName || null);
          } else {
            this.groups.set([]);
          }
        }
        return;
      }

      const allGroups = await lastValueFrom(this.groupService.getList());

      if (allGroups?.items && allGroups.items.length > 0) {
        const courseIds = [...new Set(allGroups.items.map(g => g.courseId).filter(Boolean))] as string[];
        const allGroupsWithSchedules: GroupWithSchedulesDto[] = [];

        for (const courseId of courseIds) {
          try {
            const groupsWithSchedules = await lastValueFrom(
              this.groupService.getGroupsForTeacherAndCourse(teacherId, courseId)
            );
            allGroupsWithSchedules.push(...groupsWithSchedules);
          } catch {
            const basicGroups = allGroups.items
              .filter(g => g.courseId === courseId)
              .map(g => ({
                groupId: g.id, name: g.name, teacherId: g.teacherId,
                teacherName: g.teacherName, groupCode: g.groupCode,
                courseId: g.courseId, courseName: g.courseName, isStopped: false, schedules: [],
              }));
            allGroupsWithSchedules.push(...basicGroups);
          }
        }

        this.groups.set(allGroupsWithSchedules);
      } else {
        this.groups.set([]);
      }
    } catch (error: any) {
      console.error('Error loading teacher groups:', error);
      this.error.set(this.l('TeacherGroups:ErrorLoadingGroups'));
      this.groups.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  getDayName(dayOfWeek: number): string {
    const keys = [
      'AbpLocalization:Sunday',    // 0
      'AbpLocalization:Monday',    // 1
      'AbpLocalization:Tuesday',   // 2
      'AbpLocalization:Wednesday', // 3
      'AbpLocalization:Thursday',  // 4
      'AbpLocalization:Friday',    // 5
      'AbpLocalization:Saturday',  // 6
    ];
    // Fall back to our own day keys if ABP localization doesn't cover them
    const dayKeys = [
      '::Day:Sunday', '::Day:Monday', '::Day:Tuesday', '::Day:Wednesday',
      '::Day:Thursday', '::Day:Friday', '::Day:Saturday',
    ];
    return this.localization.instant(dayKeys[dayOfWeek] ?? dayKeys[0]);
  }

  formatTime(time?: string): string {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const min  = minutes || '00';
      const am   = this.localization.instant('::Time:AM');
      const pm   = this.localization.instant('::Time:PM');

      if (hour === 0)   return `12:${min} ${am}`;
      if (hour < 12)    return `${hour}:${min} ${am}`;
      if (hour === 12)  return `12:${min} ${pm}`;
      return `${hour - 12}:${min} ${pm}`;
    } catch {
      return time;
    }
  }

  async deleteGroup(group: GroupWithSchedulesDto) {
    const msg = this.l('TeacherGroups:ConfirmDeleteGroup', group.name);
    if (!confirm(msg)) return;
    try {
      await lastValueFrom(this.groupService.delete(group.groupId!));
      await this.loadTeacherGroups();
    } catch (err) {
      console.error('Error deleting group:', err);
      this.error.set(this.l('TeacherGroups:ErrorDeletingGroup'));
    }
  }

  async deleteSchedule(scheduleId: string, group: GroupWithSchedulesDto) {
    if (!confirm(this.l('TeacherGroups:ConfirmDeleteSchedule'))) return;
    try {
      await lastValueFrom(this.groupService.deleteSchedule(scheduleId));
      this.groups.update(groups =>
        groups.map(g =>
          g.groupId === group.groupId
            ? { ...g, schedules: g.schedules.filter(s => s.id !== scheduleId) }
            : g
        )
      );
    } catch (err) {
      console.error('Error deleting schedule:', err);
      this.error.set(this.l('TeacherGroups:ErrorDeletingSchedule'));
    }
  }

  private async loadAutoAcceptMap() {
    try {
      const all = await lastValueFrom(this.groupService.getList());
      const map: Record<string, boolean> = {};
      (all?.items ?? []).forEach(g => { if (g.id) map[g.id] = !!g.autoAcceptJoinRequests; });
      this.autoAccept.set(map);
    } catch {
      // non-fatal — toggle just defaults to off until reload
    }
  }

  async toggleAutoAccept(group: GroupWithSchedulesDto) {
    const id = group.groupId;
    if (!id) return;
    const next = !this.autoAccept()[id];
    // optimistic update
    this.autoAccept.update(m => ({ ...m, [id]: next }));
    try {
      await lastValueFrom(this.groupService.setAutoAccept(id, next));
    } catch (err) {
      // revert on failure
      this.autoAccept.update(m => ({ ...m, [id]: !next }));
      console.error('Error toggling auto-accept:', err);
      this.error.set(this.l('TeacherGroups:ErrorUpdatingGroup'));
    }
  }

  clearFilter() {
    this.courseId.set(null);
    this.courseName.set(null);
    this.router.navigate(['/teacher-groups']);
    this.loadTeacherGroups();
  }

  takeAttendance(group: GroupWithSchedulesDto) {
    this.router.navigate(['/attendance'], {
      queryParams: {
        groupId: group.groupId,
        courseName: group.courseName,
        groupName: group.name,
      },
    });
  }

  viewStudents(group: GroupWithSchedulesDto) {
    this.router.navigate(['/students'], {
      queryParams: { groupId: group.groupId, filter: 'group' },
    });
  }

  goToMarks(group: GroupWithSchedulesDto) {
    this.router.navigate(['/marks-entry'], {
      queryParams: { courseId: group.courseId },
    });
  }

  manageSchedule(group: GroupWithSchedulesDto) {
    const qp: any = {};
    if (this.courseId()) qp['courseId'] = this.courseId();
    this.router.navigate(['/teacher-groups/add-schedule', group.groupId], { queryParams: qp });
  }

  goBack() {
    const currentUser = this.configStateService.getOne('currentUser') as any;
    const roles: string[] = currentUser?.roles || currentUser?.roleNames || currentUser?.userRoles || [];
    const isSecretary = roles.some((r: any) => typeof r === 'string' && r.toLowerCase() === 'secretary');
    if (isSecretary) {
      this.router.navigate(['/secretary']);
    } else {
      this.router.navigate(['/teacher']);
    }
  }

  editSchedule(scheduleId: string) {
    this.router.navigate(['/teacher-groups/edit-schedule', scheduleId]);
  }

  trackById = (_: number, item: GroupWithSchedulesDto) => item.groupId;

  /** Shorthand for `this.localization.instant('::' + key, ...params)` */
  private l(key: string, ...params: string[]): string {
    return this.localization.instant(`::${key}`, ...params);
  }
}
