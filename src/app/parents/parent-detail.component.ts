import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParentService } from '@proxy/parents';
import { StudentService } from '@proxy/students';
import { lastValueFrom } from 'rxjs';

@Component({
  standalone: true,
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

  async openEnrollModal() {
    try {
      // Load available students (not already linked to this parent)
      const allStudents = await lastValueFrom(this.studentSvc.getList({ skipCount: 0, maxResultCount: 100 }));
      const linkedStudentIds = this.children().map(c => c.studentId);
      const available = (allStudents.items || []).filter((s: any) => !linkedStudentIds.includes(s.id));
      
      this.availableStudents.set(available);
      this.showEnrollModal.set(true);
    } catch (e) {
      console.error('Failed to load available students', e);
      alert('Failed to load available students');
    }
  }

  closeEnrollModal() {
    this.showEnrollModal.set(false);
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