import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '@proxy/groups';
import { ToastService } from '../shared/toast.service';
import { GroupScheduleEditComponent } from './group-schedule-edit.component';
import { TeacherService } from '@proxy/teachers';
import { lastValueFrom } from 'rxjs';

type CourseGroup = {
  id: string;
  name: string;
  code?: string;
  courseName?: string;
  teacher?: string;
  schedule: { day: string; from: string; to: string }[];
};

@Component({
  selector: 'app-course-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, GroupScheduleEditComponent],
  templateUrl: './course-groups.component.html',
  styleUrls: ['./course-groups.component.scss'],
})
export class CourseGroupsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private groupSvc = inject(GroupService);
  private toast = inject(ToastService);
  private teacherSvc = inject(TeacherService);
  courseId = signal<string | null>(null);
  groups = signal<CourseGroup[]>([]);
  loading = signal(false);
  teachers = signal<any[]>([]);
  selectedTeacherId = signal<string | null>(null);
  // edit state: map of groupId -> index -> Edit buffer and scheduleId mapping
  editBuffer: { [groupId: string]: Array<any> } = {};
  editingMap: { [key: string]: boolean } = {};
  savingMap: { [key: string]: boolean } = {};
  deletingMap: { [key: string]: boolean } = {};
  // create mode per group
  creatingMap: { [groupId: string]: boolean } = {};
  createBuffer: { [groupId: string]: any } = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      this.courseId.set(id);
      void this.loadTeachers();
      this.loadGroups(id, this.selectedTeacherId());
    });
  }

  async loadTeachers() {
    try {
      const res = await lastValueFrom(this.teacherSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any));
      this.teachers.set(res.items ?? []);
    } catch (e) {
      console.error('Failed to load teachers', e);
    }
  }

  // helper to enrich groups with teacherName and groupCode by fetching groups list
  private async enrichGroupsMeta() {
    try {
      const list = await lastValueFrom(this.groupSvc.getList());
      const map: { [id: string]: any } = {};
      (list.items ?? []).forEach((x: any) => map[x.id ?? x.name] = x);
      return map;
    } catch (e) {
      console.error('Failed to fetch group meta', e);
      return {};
    }
  }

  onTeacherChange(id: string | null) {
    this.selectedTeacherId.set(id);
    void this.loadGroups(this.courseId(), id);
  }

  async loadGroups(id: string | null, teacherId?: string | null) {
    this.loading.set(true);
    if (!id) {
      this.groups.set([]);
      this.loading.set(false);
      return;
    }
    try {
      // use API that returns groups with schedules; teacherId optional - pass empty for all
      const tid = teacherId ?? this.selectedTeacherId() ?? '';
      const res = await lastValueFrom(this.groupSvc.getGroupsByCourseAndTeacher(id, tid || ''));
      const meta = await this.enrichGroupsMeta();
      const mapped = (res ?? []).map(g => {
        const id = g.groupId || '';
        const m = meta[id] || {};
        return ({ id, name: g.name || m.name || '', code: m.groupCode || m.groupCode || undefined as any, courseName: m.courseName || undefined as any, teacher: m.teacherName || undefined as any, schedule: (g.schedules ?? []).map(s => ({ scheduleId: s.id || '', day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][s.dayOfWeek - 1] || String(s.dayOfWeek), dayOfWeek: s.dayOfWeek, from: s.startTime || '', to: s.endTime || '' })) } as CourseGroup);
      });
      this.groups.set(mapped);
      // prepare edit buffer
      this.editBuffer = {};
      for (const g of mapped) {
        this.editBuffer[g.id] = (g.schedule || []).map(s => ({ scheduleId: (s as any).scheduleId || '', dayOfWeek: (s as any).dayOfWeek || 1, startTime: s.from || '', endTime: s.to || '' }));
        // prepare empty create buffer
        this.createBuffer[g.id] = { scheduleId: '', dayOfWeek: 1, startTime: '', endTime: '' };
      }
    } catch (e) {
      console.error('Failed to load groups', e);
      this.groups.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() { this.router.navigate(['/courses']); }
  onCreateGroup() { this.router.navigate([`/courses/${this.courseId()}/groups/create`]); }

  startCreateSchedule(groupId: string) {
    this.creatingMap[groupId] = true;
  }

  cancelCreate(groupId: string) {
    this.creatingMap[groupId] = false;
    this.createBuffer[groupId] = { scheduleId: '', dayOfWeek: 1, startTime: '', endTime: '' };
  }

  async onCreateSchedule(model: any, groupId: string) {
    if (!groupId) return;
    const payload: any = { groupId, dayOfWeek: Number(model.dayOfWeek), startTime: model.startTime, endTime: model.endTime };
    try {
      // use generated proxy method
      await lastValueFrom(this.groupSvc.addScheduleToGroup(groupId, { dayOfWeek: Number(model.dayOfWeek), startTime: model.startTime, endTime: model.endTime } as any));
      this.toast.show('Schedule created', 'success');
      await this.loadGroups(this.courseId(), this.selectedTeacherId());
    } catch (e) {
      console.error('Failed to create schedule', e);
      this.toast.show('Failed to create schedule', 'error');
    } finally {
      this.creatingMap[groupId] = false;
    }
  }

  async editGroupName(groupId: string) {
    const g = this.groups().find(x => x.id === groupId);
    if (!g) return;
    const newName = prompt('Edit group name', g.name);
    if (newName == null) return;
    try {
      await lastValueFrom(this.groupSvc.update(groupId, { name: newName } as any));
      this.toast.show('Group updated', 'success');
      await this.loadGroups(this.courseId(), this.selectedTeacherId());
    } catch (e) {
      console.error('Failed to update group', e);
      this.toast.show('Failed to update group', 'error');
    }
  }

  isEditing(groupId: string, idx: number) {
    return !!this.editingMap[`${groupId}_${idx}`];
  }

  startEdit(groupId: string, idx: number) {
    this.editingMap[`${groupId}_${idx}`] = true;
  }

  cancelEdit(groupId: string, idx: number) {
    this.editingMap[`${groupId}_${idx}`] = false;
    // reset buffer to current groups state
    const g = this.groups().find(x => x.id === groupId);
    if (!g) return;
    const s = g.schedule[idx] as any;
    this.editBuffer[groupId][idx] = { scheduleId: s.scheduleId || '', dayOfWeek: s.dayOfWeek || 1, startTime: s.from || '', endTime: s.to || '' };
  }

  getEdit(groupId: string, idx: number) {
    // ensure buffer exists
    if (!this.editBuffer[groupId]) this.editBuffer[groupId] = [];
    if (!this.editBuffer[groupId][idx]) {
      const g = this.groups().find(x => x.id === groupId);
      const s = g?.schedule[idx] as any;
      this.editBuffer[groupId][idx] = { scheduleId: s?.scheduleId || '', dayOfWeek: s?.dayOfWeek || 1, startTime: s?.from || '', endTime: s?.to || '' };
    }
    return this.editBuffer[groupId][idx];
  }

  isSaving(groupId: string, idx: number) { return !!this.savingMap[`${groupId}_${idx}`]; }
  isDeleting(groupId: string, idx: number) { return !!this.deletingMap[`${groupId}_${idx}`]; }

  async onChildSave(model: any, groupId: string, idx: number) {
    if (!model?.scheduleId) return;
    const key = `${groupId}_${idx}`;
    this.savingMap[key] = true;
    try {
  await lastValueFrom(this.groupSvc.updateSchedule(model.scheduleId, { dayOfWeek: Number(model.dayOfWeek), startTime: model.startTime, endTime: model.endTime } as any));
  this.toast.show('Schedule saved', 'success');
  await this.loadGroups(this.courseId(), this.selectedTeacherId());
    } catch (e) {
      console.error('Failed to save schedule', e);
      this.toast.show('Failed to save schedule', 'error');
    } finally {
      this.savingMap[key] = false;
      this.editingMap[key] = false;
    }
  }

  async onChildDelete(model: any, groupId: string, idx: number) {
    if (!model?.scheduleId) return;
    const key = `${groupId}_${idx}`;
    if (!confirm('Delete this schedule?')) return;
    this.deletingMap[key] = true;
    try {
  await lastValueFrom(this.groupSvc.deleteSchedule(model.scheduleId));
  this.toast.show('Schedule deleted', 'success');
  await this.loadGroups(this.courseId(), this.selectedTeacherId());
    } catch (e) {
      console.error('Failed to delete schedule', e);
      this.toast.show('Failed to delete schedule', 'error');
    } finally {
      this.deletingMap[key] = false;
      this.editingMap[key] = false;
    }
  }

  confirmDeleteQuick(groupId: string, idx: number) {
    const edit = this.editBuffer[groupId]?.[idx];
    if (!edit || !edit.scheduleId) return;
    if (!confirm('Delete this schedule?')) return;
    void this.onChildDelete(edit, groupId, idx);
  }

  async saveSchedule(groupId: string, idx: number) {
    const buf = this.editBuffer[groupId]?.[idx];
    if (!buf || !buf.scheduleId) return;
    try {
  await lastValueFrom(this.groupSvc.updateSchedule(buf.scheduleId, { dayOfWeek: Number(buf.dayOfWeek), startTime: buf.startTime, endTime: buf.endTime } as any));
  // refresh
  await this.loadGroups(this.courseId(), this.selectedTeacherId());
    } catch (e) {
      console.error('Failed to save schedule', e);
    } finally {
      this.editingMap[`${groupId}_${idx}`] = false;
    }
  }

  async deleteScheduleByIndex(groupId: string, idx: number) {
    const buf = this.editBuffer[groupId]?.[idx];
    if (!buf || !buf.scheduleId) return;
    if (!confirm('Delete this schedule?')) return;
    try {
  await lastValueFrom(this.groupSvc.deleteSchedule(buf.scheduleId));
  await this.loadGroups(this.courseId(), this.selectedTeacherId());
    } catch (e) {
      console.error('Failed to delete schedule', e);
    }
  }
}
