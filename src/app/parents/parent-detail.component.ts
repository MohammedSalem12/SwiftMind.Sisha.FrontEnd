import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParentService } from '@proxy/parents';
import { StudentService } from '@proxy/students';
import { lastValueFrom } from 'rxjs';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parent-detail',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './parent-detail.component.html',
  styleUrls: ['./parent-detail.component.scss']
})
export class ParentDetailComponent implements OnInit {
  private readonly parentSvc = inject(ParentService);
  private readonly studentSvc = inject(StudentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  parent = signal<any>(null);
  children = signal<any[]>([]);
  loading = signal(false);
  childrenLoading = signal(false);
  
  // For enroll child modal
  showEnrollModal = signal(false);
  availableStudents = signal<any[]>([]);
  studentSearchCode = signal('');
  searchedStudent = signal<any>(null);
  searchError = signal('');
  searching = signal(false);
  enrollForm = {
    studentId: '',
    relationshipType: 'Parent',
    isEmergencyContact: false,
    canPickUp: true,
    notes: ''
  };

  ngOnInit(): void {
    const parentId = this.route.snapshot.paramMap.get('id');
    if (parentId) {
      void Promise.all([
        this.loadParent(parentId),
        this.loadChildren(parentId)
      ]);
    }
  }

  async loadParent(parentId: string) {
    this.loading.set(true);
    try {
      const parent = await lastValueFrom(this.parentSvc.get(parentId));
      this.parent.set(parent);
    } catch (e) {
      console.error('Failed to load parent', e);
      alert('Failed to load parent details');
      this.router.navigate(['/parents']);
    } finally {
      this.loading.set(false);
    }
  }

  async loadChildren(parentId: string) {
    this.childrenLoading.set(true);
    try {
      const children = await lastValueFrom(this.parentSvc.getLinkedStudentsByParentId(parentId));
      this.children.set(children || []);
    } catch (e) {
      console.error('Failed to load children', e);
      this.children.set([]);
    } finally {
      this.childrenLoading.set(false);
    }
  }

  openEnrollModal() {
    this.studentSearchCode.set('');
    this.searchedStudent.set(null);
    this.searchError.set('');
    this.showEnrollModal.set(true);
  }

  async searchStudentByCode() {
    const code = this.studentSearchCode().trim();
    if (!code) {
      this.searchError.set('الرجاء إدخال كود الطالب');
      return;
    }

    this.searching.set(true);
    this.searchError.set('');
    this.searchedStudent.set(null);

    try {
      const result = await lastValueFrom(this.studentSvc.getList({ skipCount: 0, maxResultCount: 1, filter: code } as any));
      const students = result.items || [];
      const match = students.find((s: any) => s.studentCode === code);

      if (!match) {
        this.searchError.set('لم يتم العثور على طالب بهذا الكود');
        return;
      }

      // Check if already linked
      const linkedStudentIds = this.children().map(c => c.studentId);
      if (linkedStudentIds.includes(match.id)) {
        this.searchError.set('هذا الطالب مرتبط بالفعل بولي الأمر');
        return;
      }

      this.searchedStudent.set(match);
      this.enrollForm.studentId = match.id;
    } catch (e) {
      console.error('Failed to search student', e);
      this.searchError.set('حدث خطأ أثناء البحث');
    } finally {
      this.searching.set(false);
    }
  }

  closeEnrollModal() {
    this.showEnrollModal.set(false);
    this.searchedStudent.set(null);
    this.searchError.set('');
    this.studentSearchCode.set('');
    this.enrollForm = {
      studentId: '',
      relationshipType: 'Parent',
      isEmergencyContact: false,
      canPickUp: true,
      notes: ''
    };
  }

  async submitEnrollChild() {
    const parentId = this.parent()?.id;
    if (!parentId || !this.enrollForm.studentId) {
      alert('Please select a student');
      return;
    }

    try {
      await lastValueFrom(this.parentSvc.enrollStudentToParent({
        parentId,
        studentId: this.enrollForm.studentId,
        relationshipType: this.enrollForm.relationshipType,
        isEmergencyContact: this.enrollForm.isEmergencyContact,
        canPickUp: this.enrollForm.canPickUp,
        notes: this.enrollForm.notes || undefined
      }));

      this.closeEnrollModal();
      await this.loadChildren(parentId);
      alert('Student enrolled successfully!');
    } catch (e) {
      console.error('Failed to enroll student', e);
      alert('Failed to enroll student');
    }
  }

  async removeChild(child: any) {
    if (!confirm(`Are you sure you want to remove ${child.studentName} from this parent?`)) {
      return;
    }

    const parentId = this.parent()?.id;
    try {
      await lastValueFrom(this.parentSvc.removeStudentFromParent(parentId, child.studentId));
      await this.loadChildren(parentId);
      alert('Student removed successfully!');
    } catch (e) {
      console.error('Failed to remove student', e);
      alert('Failed to remove student');
    }
  }

  goBack() {
    this.router.navigate(['/parents']);
  }
}