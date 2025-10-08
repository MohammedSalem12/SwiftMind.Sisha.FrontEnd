import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance-absentees-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-absentees-list.component.html',
  styleUrls: ['./attendance-absentees-list.component.scss']
})
export class AttendanceAbsenteesListComponent {
  @Input() absentees: { attendanceId?: string; enrollmentId: string; studentName: string; date: string; note?: string }[] = [];
  @Input() deletingId: string | null = null;
  @Input() dateLabel: string = '';
  @Output() cancel = new EventEmitter<string | undefined>();
}
