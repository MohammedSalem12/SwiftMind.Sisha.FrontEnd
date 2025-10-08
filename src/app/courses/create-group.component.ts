import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '@proxy/groups';
import { TeacherService } from '@proxy/teachers';
import { lastValueFrom } from 'rxjs';

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
            <label>Teacher</label>
            <select name="teacherId" [ngModel]="model().teacherId" (ngModelChange)="setField('teacherId',$event)" #teacherField="ngModel">
              <option [ngValue]="''" disabled>Select teacher...</option>
              <option *ngFor="let t of teachers()" [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
            </select>
          </div>

          <div class="actions">
            <button class="btn-primary" type="submit" [disabled]="saving() || f.invalid">Create</button>
            <button type="button" class="btn-outline" (click)="cancel()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [``]
})
export class CreateGroupComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(GroupService);
  private teacherSvc = inject(TeacherService);

  courseId = signal<string | null>(null);
  model = signal<{ name: string; teacherId: string }>({ name: '', teacherId: '' });
  teachers = signal<any[]>([]);
  saving = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.courseId.set(id);
    void this.loadTeachers();
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
