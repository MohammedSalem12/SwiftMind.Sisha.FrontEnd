import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '@proxy/students';
import { TeacherService } from '@proxy/teachers';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { lastValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-exam-grade',
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-grade.component.html',
  styleUrls: ['./exam-grade.component.scss']
})
export class ExamGradeComponent implements OnInit {
  private readonly studentSvc = inject(StudentService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly enrollmentSvc = inject(StudentEnrollmentService);
  students = signal<any[]>([]);
  loading = signal(false);
  teachers = signal<any[]>([]);
  courses = signal<any[]>([]);
  selectedTeacher = signal<string | null>(null);
  selectedCourse = signal<string | null>(null);
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
  // modal states (plain fields for ngModel two-way binding)
  showAddExamModal = false;
  addExamModel: { name?: string; date?: string } = {};

  showAddGradesModal = false;
  selectedStudent: any | null = null;
  newGrade: number | null = null;

  ngOnInit(): void {
    void Promise.all([this.loadTeachers(), this.loadStudents()]);
  }

  openAddExam() {
    this.addExamModel = {};
    this.showAddExamModal = true;
  }

  closeAddExam() {
    this.showAddExamModal = false;
  }

  submitAddExam() {
    // Placeholder: call backend to create an exam when API available
    console.log('Add exam', this.addExamModel);
    this.closeAddExam();
  }

  openAddGrades(student: any) {
    this.selectedStudent = student;
    this.newGrade = null;
    this.showAddGradesModal = true;
  }

  closeAddGrades() {
    this.showAddGradesModal = false;
    this.selectedStudent = null;
  }

  submitAddGrade() {
    const student = this.selectedStudent;
    const grade = this.newGrade;
    console.log('Add grade for', student, 'grade', grade);
    // Placeholder: call backend to save grade when API available
    this.closeAddGrades();
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
        const enrollmentsResp: any = await lastValueFrom(this.enrollmentSvc.getList({ skipCount: 0, maxResultCount: 10000 } as any));
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
        const all: any = await lastValueFrom(this.studentSvc.getList({ skipCount: 0, maxResultCount: 10000 } as any));
        const byId = new Map((all.items ?? []).map((s: any) => [s.id, s]));
        const rows = studentIds.map((id: string) => byId.get(id)).filter(Boolean).map((s: any) => ({
          id: s.id,
          name: `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.replace(/\s+/g, ' ').trim(),
          code: s.studentCode ?? s.teacherStudentCode ?? '-',
          grade: s.currentGrade ?? '-',
        }));
        this.students.set(codeFilter ? rows.filter(r => (r.code || '').toString().includes(codeFilter)) : rows);
      } else {
        const all: any = await lastValueFrom(this.studentSvc.getList({ skipCount: 0, maxResultCount: 10000 } as any));
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
    void this.loadStudents();
  }

  onStudentCodeFilterChange(value: string) {
    this.studentCodeFilter.set(value || '');
    // apply filter client side
    void this.loadStudents();
  }
}
