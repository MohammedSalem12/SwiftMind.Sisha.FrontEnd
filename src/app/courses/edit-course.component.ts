import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { CourseService } from '@proxy/courses';
import { GradeService } from '@proxy/grades';
import type { CourseDto, CreateUpdateCourseDto } from '@proxy/courses/dtos/models';
import type { GradeDto } from '@proxy/grades/dtos/models';

@Component({
  selector: 'app-edit-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body">
        <h3>Edit Course</h3>
        <div *ngIf="loading()">Loading...</div>
        <form #f="ngForm" *ngIf="!loading()" (ngSubmit)="onSave(f)">
          <div class="field">
            <label>Name (EN)</label>
            <input [ngModel]="model().nameEn" (ngModelChange)="setField('nameEn',$event)" name="nameEn" #nameEn="ngModel" required />
            <div class="field-error" *ngIf="nameEn.invalid && (nameEn.dirty || nameEn.touched)">Name (EN) is required</div>
          </div>
          <div class="field">
            <label>Name (AR)</label>
            <input [ngModel]="model().nameAr" (ngModelChange)="setField('nameAr',$event)" name="nameAr" #nameAr="ngModel" required />
            <div class="field-error" *ngIf="nameAr.invalid && (nameAr.dirty || nameAr.touched)">Name (AR) is required</div>
          </div>
          <div class="field">
            <label>Grade</label>
            <select [ngModel]="model().grade" (ngModelChange)="setField('grade',$event)" name="grade" #gradeField="ngModel" required>
              <option [ngValue]="''" disabled>Select grade...</option>
              <option *ngFor="let g of grades()" [ngValue]="g.id">{{ g.name || ('Grade ' + g.id) }}</option>
            </select>
            <div class="field-error" *ngIf="gradeField.invalid && (gradeField.dirty || gradeField.touched)">Grade is required</div>
          </div>
          <div class="actions mt-3">
            <button class="btn-primary" type="submit" [disabled]="saving() || f.invalid">Save</button>
            <button type="button" class="btn-outline" (click)="cancel()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [``],
})
export class EditCourseComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(CourseService);
  private gradeSvc = inject(GradeService);

  model = signal<CreateUpdateCourseDto>({ nameAr: '', nameEn: '', gradeId: '1' });
  loading = signal(true);
  saving = signal(false);
  grades = signal<GradeDto[]>([]);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    void this.loadGrades();
    if (id) this.load(id);
  }

  load(id: string) {
  this.loading.set(true);
  this.svc.get(id).subscribe({ next: (c) => { this.model.set({ nameAr: c.nameAr || '', nameEn: c.nameEn || '', gradeId: (c.gradeId || '1') }); this.loading.set(false); }, error: (e) => { console.error(e); this.loading.set(false); } });
  }

  async loadGrades() {
    try {
      const res = await lastValueFrom(this.gradeSvc.getList());
      this.grades.set(res.items ?? []);
    } catch (e) {
      console.error('Failed to load grades', e);
    }
  }

  setField<K extends keyof CreateUpdateCourseDto>(k: K, v: CreateUpdateCourseDto[K]) { this.model.update(m => ({ ...(m as any), [k]: v } as any)); }

  onSave(form?: NgForm) {
    if (form && form.invalid) {
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.saving.set(true);
    this.svc.update(id, this.model() as any).subscribe({ next: () => { this.saving.set(false); this.router.navigate(['/courses']); }, error: (e) => { console.error(e); this.saving.set(false); } });
  }

  cancel() { this.router.navigate(['/courses']); }
}
