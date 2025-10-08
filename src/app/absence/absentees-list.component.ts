import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-absentees-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './absentees-list.component.html',
  styleUrls: ['./absentees-list.component.scss']
})
export class AbsenteesListComponent {
  @Input() absentees: { attendanceId?: string; enrollmentId: string; studentName: string; date: string; note?: string }[] = [];
  @Input() deletingId: string | null = null;
  @Input() dateLabel: string = '';
  @Output() cancel = new EventEmitter<string | undefined>();
}
