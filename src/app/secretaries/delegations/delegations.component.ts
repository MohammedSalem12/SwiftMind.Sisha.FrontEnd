import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListService, PagedResultDto } from '@abp/ng.core';
import type { TeacherSecretaryDelegationDto, GetTeacherSecretaryDelegationsInput } from '../../proxy/secretaries/models';
import { TeacherSecretaryDelegationService } from '../../proxy/secretaries/teacher-secretary-delegation.service';

@Component({
  selector: 'app-delegations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delegations.component.html',
  styleUrls: ['./delegations.component.scss'],
  providers: [ListService],
})
export class DelegationsComponent implements OnInit {
  private readonly list = inject(ListService);
  private readonly delegationService = inject(TeacherSecretaryDelegationService);
  private readonly router = inject(Router);

  delegations = signal<TeacherSecretaryDelegationDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  
  // Filters
  keywordFilter = signal('');
  activeFilter = signal<boolean | null>(null);
  
  // Pagination
  page = signal(1);
  pageSize = signal(10);

  ngOnInit(): void {
    this.hookList();
  }

  hookList(): void {
    this.list.hookToQuery((query) => {
      this.loading.set(true);
      const input: GetTeacherSecretaryDelegationsInput = {
        keyword: this.keywordFilter() || undefined,
        isActive: this.activeFilter() ?? undefined,
        skipCount: (this.page() - 1) * this.pageSize(),
        maxResultCount: this.pageSize(),
        sorting: query.sort ?? 'startDate desc'
      };

      return this.delegationService.getList(input);
    }).subscribe({
      next: (res: PagedResultDto<TeacherSecretaryDelegationDto>) => {
        this.delegations.set(res.items ?? []);
        this.totalCount.set(res.totalCount ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading delegations:', err);
        this.loading.set(false);
      }
    });
  }

  onFilter() {
    this.page.set(1);
    this.list.get();
  }

  onPageChange(p: number) {
    if (p < 1) return;
    this.page.set(p);
    this.list.get();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.page.set(1);
    this.list.get();
  }

  async activateDelegation(delegation: TeacherSecretaryDelegationDto) {
    try {
      await this.delegationService.activate(delegation.id!).toPromise();
      this.list.get(); // Refresh the list
    } catch (error) {
      console.error('Error activating delegation:', error);
    }
  }

  async deactivateDelegation(delegation: TeacherSecretaryDelegationDto) {
    if (confirm(`Are you sure you want to deactivate this delegation?`)) {
      try {
        await this.delegationService.deactivate(delegation.id!).toPromise();
        this.list.get(); // Refresh the list
      } catch (error) {
        console.error('Error deactivating delegation:', error);
      }
    }
  }

  async deleteDelegation(delegation: TeacherSecretaryDelegationDto) {
    if (confirm(`Are you sure you want to delete this delegation?`)) {
      try {
        await this.delegationService.delete(delegation.id!).toPromise();
        this.list.get(); // Refresh the list
      } catch (error) {
        console.error('Error deleting delegation:', error);
      }
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize());
  }

  trackById = (_: number, item: TeacherSecretaryDelegationDto) => item.id;
}