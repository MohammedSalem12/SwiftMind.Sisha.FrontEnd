import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '@proxy/groups';
import { TeacherService } from '@proxy/teachers';
import { lastValueFrom } from 'rxjs';
import { RoleBasedUIService } from '../shared/role-based-ui.service';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="card form-card">
        <div class="card-header">
          <h2>Create Group</h2>
          <p class="subtitle">Create a new group for course: {{ courseId() }}</p>
        </div>
        <form class="card-body" #f="ngForm" (ngSubmit)="submit(f)">
          <div class="field">
            <label>Name</label>
            <input name="name" [ngModel]="model().name" (ngModelChange)="setField('name',$event)" #name="ngModel" required />
            <div class="field-error" *ngIf="name.invalid && (name.dirty || name.touched)">Name is required</div>
          </div>

          <div class="field">
            <label>Teacher
              <span *ngIf="teacherSelectDisabled()" class="role-indicator">(Auto-selected - You are the teacher)</span>
            </label>
            <select 
              name="teacherId" 
              [ngModel]="model().teacherId" 
              (ngModelChange)="setField('teacherId',$event)" 
              #teacherField="ngModel"
              [disabled]="teacherSelectDisabled()"
              [class.disabled]="teacherSelectDisabled()">
              <option [ngValue]="''" disabled>Select teacher...</option>
              <option *ngFor="let t of teachers()" [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
            </select>
            <div *ngIf="isTeacher() && currentTeacherInfo()" class="current-teacher-info">
              Selected: {{ currentTeacherInfo()?.firstName }} {{ currentTeacherInfo()?.lastName }}
            </div>
          </div>

          <div class="actions">
            <button class="btn-primary" type="submit" [disabled]="saving() || f.invalid">Create</button>
            <button type="button" class="btn-outline" (click)="cancel()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .role-indicator {
      font-size: 12px;
      color: #059669;
      font-weight: 500;
      margin-left: 8px;
    }
    
    select.disabled {
      background-color: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
    }
    
    .current-teacher-info {
      margin-top: 6px;
      font-size: 13px;
      color: #059669;
      font-weight: 500;
    }
  `]
})
export class CreateGroupComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(GroupService);
  private teacherSvc = inject(TeacherService);
  private roleService = inject(RoleBasedUIService);

  courseId = signal<string | null>(null);
  model = signal<{ name: string; teacherId: string }>({ name: '', teacherId: '' });
  teachers = signal<any[]>([]);
  saving = signal(false);
  
  // Role-based UI
  isTeacher = computed(() => this.roleService.isTeacher());
  teacherSelectDisabled = computed(() => this.isTeacher());
  currentTeacherInfo = signal<any>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.courseId.set(id);
    void this.loadTeachers();
    this.initializeRoleBasedDefaults();
  }

  private initializeRoleBasedDefaults(): void {
    // If current user is a teacher, auto-select them
    if (this.roleService.isTeacher()) {
      const currentActorId = this.roleService.getCurrentActorId();
      if (currentActorId) {
        this.setField('teacherId', currentActorId);
        // Load current teacher info for display
        this.loadCurrentTeacherInfo(currentActorId);
      }
    }
  }

  private async loadCurrentTeacherInfo(teacherId: string): Promise<void> {
    try {
      const teacher = await lastValueFrom(this.teacherSvc.get(teacherId));
      this.currentTeacherInfo.set(teacher);
    } catch (error) {
      console.error('Failed to load current teacher info:', error);
    }
  }

  setField(k: 'name' | 'teacherId', v: any) { this.model.update(m => ({ ...m, [k]: v })); }

  async loadTeachers() {
    try {
      const res = await lastValueFrom(this.teacherSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any));
      this.teachers.set(res.items ?? []);
    } catch (e) {
      console.error('Failed to load teachers', e);
    }
  }

  async submit(form?: NgForm) {
    if (form && form.invalid) return;
    if (!this.courseId()) return;
    this.saving.set(true);
    try {
      await lastValueFrom(this.svc.create({ name: this.model().name, teacherId: this.model().teacherId, courseId: this.courseId() } as any));
      await this.router.navigate([`/courses/${this.courseId()}/groups`]);
    } catch (e) {
      console.error(e);
    } finally {
      this.saving.set(false);
    }
  }

  cancel() { this.router.navigate([`/courses/${this.courseId()}/groups`]); }
}
