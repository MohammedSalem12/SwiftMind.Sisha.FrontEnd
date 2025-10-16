import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ParentService } from '@proxy/parents';
import { StudentService } from '@proxy/students';
import { lastValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-parents',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './parents.component.html',
  styleUrls: ['./parents.component.scss']
})
export class ParentsComponent implements OnInit {
  private readonly parentSvc = inject(ParentService);
  private readonly studentSvc = inject(StudentService);
  private readonly router = inject(Router);

  parents = signal<any[]>([]);
  loading = signal(false);
  
  // Filters
  searchFilter = signal('');
  emailFilter = signal('');
  phoneFilter = signal('');
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(20);
  totalCount = signal(0);

  ngOnInit(): void {
    void this.loadParents();
  }

  async loadParents() {
    this.loading.set(true);
    try {
      const input = {
        filter: this.searchFilter() || undefined,
        email: this.emailFilter() || undefined,
        phoneNumber: this.phoneFilter() || undefined,
        skipCount: this.currentPage() * this.pageSize(),
        maxResultCount: this.pageSize()
      };

      const resp: any = await lastValueFrom(this.parentSvc.getList(input));
      this.parents.set(resp.items || []);
      this.totalCount.set(resp.totalCount || 0);
    } catch (e) {
      console.error('Failed to load parents', e);
      this.parents.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange() {
    this.currentPage.set(0);
    void this.loadParents();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    void this.loadParents();
  }

  viewParentDetails(parent: any) {
    this.router.navigate(['/parents', parent.id]);
  }

  async viewChildren(parent: any) {
    try {
      const children = await lastValueFrom(this.parentSvc.getLinkedStudentsByParentId(parent.id));
      // Navigate to children view or show modal
      this.router.navigate(['/parents', parent.id, 'children']);
    } catch (e) {
      console.error('Failed to load children for parent', e);
    }
  }

  enrollChild(parent: any) {
    this.router.navigate(['/parents', parent.id, 'enroll']);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize());
  }
}