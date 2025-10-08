import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ScheduleEditModel {
  scheduleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-group-schedule-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex align-items-center gap-2 schedule-edit">
      <select [(ngModel)]="model.dayOfWeek">
        <option [value]="1">Sun</option>
        <option [value]="2">Mon</option>
        <option [value]="3">Tue</option>
        <option [value]="4">Wed</option>
        <option [value]="5">Thu</option>
        <option [value]="6">Fri</option>
        <option [value]="7">Sat</option>
      </select>
      <input type="time" [(ngModel)]="model.startTime" />
      <input type="time" [(ngModel)]="model.endTime" />

      <div class="ms-2">
        <button class="btn-primary btn-sm" (click)="onSave()" [disabled]="saving || !isValid">{{ saving ? 'Saving...' : 'Save' }}</button>
        <button class="btn-outline btn-sm ms-1" (click)="onCancel()" [disabled]="saving">Cancel</button>
        <button class="btn-link btn-sm text-danger ms-1" (click)="onDelete()" [disabled]="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        <div *ngIf="!hasStart || !hasEnd || !startBeforeEnd" class="text-danger small mt-1">
          <div *ngIf="!hasStart">Start time is required.</div>
          <div *ngIf="!hasEnd">End time is required.</div>
          <div *ngIf="hasStart && hasEnd && !startBeforeEnd">Start time must be before end time.</div>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class GroupScheduleEditComponent {
  @Input() model: ScheduleEditModel = { scheduleId: '', dayOfWeek: 1, startTime: '', endTime: '' };
  @Input() saving = false;
  @Input() deleting = false;
  @Output() save = new EventEmitter<ScheduleEditModel>();
  @Output() cancel = new EventEmitter<void>();
  @Output() delete = new EventEmitter<ScheduleEditModel>();

  // basic validation: both times present and start < end
  get hasStart() { return !!this.model?.startTime; }
  get hasEnd() { return !!this.model?.endTime; }
  get startBeforeEnd() {
    if (!this.model?.startTime || !this.model?.endTime) return false;
    // times are in HH:mm format
    const s = this.model.startTime.split(':').map(x => Number(x));
    const e = this.model.endTime.split(':').map(x => Number(x));
    const start = s[0] * 60 + (s[1] || 0);
    const end = e[0] * 60 + (e[1] || 0);
    return start < end;
  }

  get isValid() {
    return this.hasStart && this.hasEnd && this.startBeforeEnd;
  }

  onSave() {
    if (!this.isValid) return;
    this.save.emit(this.model);
  }

  onCancel() { this.cancel.emit(); }
  onDelete() { this.delete.emit(this.model); }
}
