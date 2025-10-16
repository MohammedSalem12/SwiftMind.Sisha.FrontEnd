import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { StudentService } from '@proxy/students';
import { TeacherService } from '@proxy/teachers';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { ExamService } from '@proxy/exams';
import { ExamGradeService } from '@proxy/exam-grades';
import { lastValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-exam-grade',
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-grade.component.html',
  styleUrls: ['./exam-grade.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-20px) scale(0.95)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateY(0) scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-20px) scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class ExamGradeComponent implements OnInit {
  private readonly studentSvc = inject(StudentService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly enrollmentSvc = inject(StudentEnrollmentService);
  private readonly examSvc = inject(ExamService);
  private readonly examGradeSvc = inject(ExamGradeService);
  students = signal<any[]>([]);
  loading = signal(false);
  teachers = signal<any[]>([]);
  courses = signal<any[]>([]);
  exams = signal<any[]>([]);
  selectedTeacher = signal<string | null>(null);
  selectedCourse = signal<string | null>(null);
  selectedExam = signal<string | null>(null);
  studentCodeFilter = signal<string>('');

  // getters/setters to work with template-driven ngModel
  get selectedTeacherModel() {
    return this.selectedTeacher();
  }
  set selectedTeacherModel(v: string | null) {
    void this.onTeacherChange(v);
  }

  get selectedCourseModel() {
    return this.selectedCourse();
  }
  set selectedCourseModel(v: string | null) {
    void this.onCourseChange(v);
  }

  get studentCodeFilterModel() {
    return this.studentCodeFilter();
  }
  set studentCodeFilterModel(v: string) {
    this.onStudentCodeFilterChange(v);
  }

  get selectedExamModel() {
    return this.selectedExam();
  }
  set selectedExamModel(v: string | null) {
    void this.onExamChange(v);
  }
  // modal states (plain fields for ngModel two-way binding)
  showAddExamModal = false;
  addExamModel: { name?: string; date?: string; courseId?: string } = {};

  showAddGradesModal = false;
  selectedStudent: any | null = null;
  selectedStudentEnrollment: any | null = null;
  newGrade: number | null = null;
  maxGrade: number | null = null;

  ngOnInit(): void {
    void Promise.all([this.loadTeachers(), this.loadStudents()]);
  }

  openAddExam() {
    this.addExamModel = { courseId: this.selectedCourse() || undefined };
    this.showAddExamModal = true;
  }

  closeAddExam() {
    this.showAddExamModal = false;
  }

  async submitAddExam() {
    try {
      const courseId = this.addExamModel.courseId || this.selectedCourse();
      const teacherId = this.selectedTeacher();
      if (!courseId || !teacherId || !this.addExamModel.name) {
        alert('Please fill in all required fields');
        return;
      }
      
      await lastValueFrom(this.examSvc.create({
        examName: this.addExamModel.name,
        courseId,
        teacherId
      }));
      
      this.closeAddExam();
      await this.loadExams(); // refresh exams list
    } catch (e) {
      console.error('Failed to create exam', e);
      alert('Failed to create exam');
    }
  }

  openAddGrades(student: any) {
    this.selectedStudent = student;
    this.selectedStudentEnrollment = student.enrollment;
    this.newGrade = null;
    this.maxGrade = 100; // default max grade
    this.showAddGradesModal = true;
  }

  closeAddGrades() {
    this.showAddGradesModal = false;
    this.selectedStudent = null;
    this.selectedStudentEnrollment = null;
  }

  async submitAddGrade() {
    try {
      const examId = this.selectedExam();
      const enrollmentId = this.selectedStudentEnrollment?.id;
      const grade = this.newGrade;
      const maxGrade = this.maxGrade || 100;

      if (!examId || !enrollmentId || grade === null) {
        alert('Please select an exam and enter a grade');
        return;
      }

      await lastValueFrom(this.examGradeSvc.create({
        examId,
        enrollmentId,
        grade,
        maxGrade,
        date: new Date().toISOString().split('T')[0]
      }));

      this.closeAddGrades();
      await this.loadStudents(); // refresh to show updated grades
    } catch (e) {
      console.error('Failed to save grade', e);
      alert('Failed to save grade');
    }
  }

  async loadStudents() {
    this.loading.set(true);
    try {
      // If a course filter is selected, load enrollments for that course and map students from enrollments
      const codeFilter = this.studentCodeFilter();
      const courseId = this.selectedCourse();
      const teacherId = this.selectedTeacher();

      if (courseId) {
        // load enrollments and then fetch students for those enrollments
        const enrollmentsResp: any = await lastValueFrom(this.enrollmentSvc.getList({ skipCount: 0, maxResultCount: 100 } as any));
        const enrollments = (enrollmentsResp.items ?? []).filter((e: any) => {
          if (e.courseId !== courseId) return false;
          if (teacherId && e.teacherId !== teacherId) return false;
          return true;
        });
        const studentIds = Array.from(new Set(enrollments.map((e: any) => e.studentId))).filter(Boolean);
        if (studentIds.length === 0) {
          this.students.set([]);
          return;
        }
        // fetch students in bulk then filter by code
        const all: any = await lastValueFrom(this.studentSvc.getList({ skipCount: 0, maxResultCount: 100 } as any));
        const byId = new Map((all.items ?? []).map((s: any) => [s.id, s]));
        const rows = studentIds.map((id: string) => {
          const student: any = byId.get(id);
          const enrollment = enrollments.find((e: any) => e.studentId === id);
          return student ? {
            id: student.id,
            name: `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.replace(/\s+/g, ' ').trim(),
            code: student.studentCode ?? student.teacherStudentCode ?? '-',
            grade: student.currentGrade ?? '-',
            enrollment
          } : null;
        }).filter(Boolean);
        this.students.set(codeFilter ? rows.filter(r => (r.code || '').toString().includes(codeFilter)) : rows);
      } else {
        const all: any = await lastValueFrom(this.studentSvc.getList({ skipCount: 0, maxResultCount: 100 } as any));
        const rows = (all.items ?? []).map((s: any) => ({
          id: s.id,
          name: `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.replace(/\s+/g, ' ').trim(),
          code: s.studentCode ?? s.teacherStudentCode ?? '-',
          grade: s.currentGrade ?? '-',
        }));
        this.students.set(codeFilter ? rows.filter(r => (r.code || '').toString().includes(codeFilter)) : rows);
      }
    } catch (e) {
      console.error('Failed to load students', e);
      this.students.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadTeachers() {
    try {
      const resp: any = await lastValueFrom(this.teacherSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any));
      this.teachers.set((resp.items ?? []).map((t: any) => ({ id: t.id, name: `${t.firstName || ''} ${t.lastName || ''}`.trim() })));
    } catch (e) {
      console.error('Failed to load teachers', e);
      this.teachers.set([]);
    }
  }

  async onTeacherChange(teacherId?: string | null) {
    this.selectedTeacher.set(teacherId || null);
    this.courses.set([]);
    this.selectedCourse.set(null);
    if (!teacherId) return;
    try {
      const resp: any = await lastValueFrom(this.teacherSvc.getTeacherCourses(teacherId));
      this.courses.set((resp ?? []).map((c: any) => ({ id: c.id, name: c.name })));
    } catch (e) {
      console.error('Failed to load courses for teacher', e);
      this.courses.set([]);
    }
    // reload students constrained by new teacher/course
    void this.loadStudents();
  }

  async onCourseChange(courseId?: string | null) {
    this.selectedCourse.set(courseId || null);
    this.exams.set([]);
    this.selectedExam.set(null);
    if (courseId) {
      await this.loadExams();
    }
    void this.loadStudents();
  }

  async onExamChange(examId?: string | null) {
    this.selectedExam.set(examId || null);
    void this.loadStudents();
  }

  async loadExams() {
    const courseId = this.selectedCourse();
    if (!courseId) {
      this.exams.set([]);
      return;
    }
    try {
      const resp: any = await lastValueFrom(this.examSvc.getExamsByCourse(courseId, { skipCount: 0, maxResultCount: 100 }));
      this.exams.set((resp.items ?? []).map((e: any) => ({ id: e.id, name: e.examName, code: e.examCode })));
    } catch (e) {
      console.error('Failed to load exams for course', e);
      this.exams.set([]);
    }
  }

  onStudentCodeFilterChange(value: string) {
    this.studentCodeFilter.set(value || '');
    // apply filter client side
    void this.loadStudents();
  }
}
