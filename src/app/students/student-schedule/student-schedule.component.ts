import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { StudentScheduleDto } from '../../proxy/students/models';
import { StudentService } from '../../proxy/students/student.service';

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div *ngIf="loading()" class="text-center p-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Loading your schedule...</p>
      </div>

      <div *ngIf="!loading() && schedule()">
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="mb-0">My Schedule</h3>
            <button class="btn btn-secondary" (click)="goBack()">
              <i class="fas fa-arrow-left me-2"></i>Back
            </button>
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-bordered">
                    <thead class="table-dark">
                      <tr>
                        <th>Day</th>
                        <th>Course</th>
                        <th>Code</th>
                        <th>Time</th>
                        <th>Classroom</th>
                        <th>Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of schedule()!.scheduleItems" class="align-middle">
                        <td>{{ item.dayName }}</td>
                        <td>{{ item.courseName }}</td>
                        <td>{{ item.courseCode }}</td>
                        <td>{{ item.startTime }} - {{ item.endTime }}</td>
                        <td>{{ item.classroom }}</td>
                        <td>{{ item.teacherName }}</td>
                      </tr>
                      <tr *ngIf="schedule()!.scheduleItems.length === 0">
                        <td colspan="6" class="text-center text-muted p-4">
                          No schedule items found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StudentScheduleComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);

  schedule = signal<StudentScheduleDto | null>(null);
  loading = signal(false);

  async ngOnInit() {
    await this.loadSchedule();
  }

  private async loadSchedule() {
    this.loading.set(true);
    try {
      const schedule = await this.studentService.getSchedule().toPromise();
      this.schedule.set(schedule!);
    } catch (error) {
      console.error('Error loading student schedule:', error);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/students']);
  }
}