import { Routes } from '@angular/router';

export const marksEntryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./marks-entry.component').then(m => m.MarksEntryComponent),
  },
  {
    path: 'report/:examId',
    loadComponent: () =>
      import('./exam-grade-report.component').then(m => m.ExamGradeReportComponent),
  },
];
