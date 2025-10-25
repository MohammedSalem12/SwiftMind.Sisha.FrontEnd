import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListService, PagedResultDto } from '@abp/ng.core';
import type { SecretaryDto, GetSecretariesInput } from '../proxy/secretaries/models';
import { SecretaryService } from '../proxy/secretaries/secretary.service';

@Component({
  selector: 'app-secretaries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './secretaries.component.html',
  styleUrls: ['./secretaries.component.scss'],
  providers: [ListService],
})
export class SecretariesComponent implements OnInit {
  private readonly list = inject(ListService);
  private readonly secretaryService = inject(SecretaryService);
  private readonly router = inject(Router);

  secretaries = signal<SecretaryDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  
  // Filters
  keywordFilter = signal('');
  departmentFilter = signal('');
  activeFilter = signal<boolean | null>(null);
  
  // Pagination
  page = signal(1);
  pageSize = signal(10);
  
  // Selected secretary for details
  selected = signal<SecretaryDto | null>(null);

  ngOnInit(): void {
    this.hookList();
  }

  hookList(): void {
    this.list.hookToQuery((query) => {
      this.loading.set(true);
      const input: GetSecretariesInput = {
        keyword: this.keywordFilter() || undefined,
        department: this.departmentFilter() || undefined,
        isActive: this.activeFilter() ?? undefined,
        skipCount: (this.page() - 1) * this.pageSize(),
        maxResultCount: this.pageSize(),
        sorting: query.sort ?? 'lastName'
      };

      return this.secretaryService.getList(input);
    }).subscribe({
      next: (res: PagedResultDto<SecretaryDto>) => {
        this.secretaries.set(res.items ?? []);
        this.totalCount.set(res.totalCount ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading secretaries:', err);
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

  showDetails(secretary: SecretaryDto) {
    this.selected.set(secretary);
  }

  closeDetails() {
    this.selected.set(null);
  }

  goToAdd() {
    this.router.navigate(['/secretaries/add']);
  }

  goToEdit(id: string) {
    this.router.navigate(['/secretaries/edit', id]);
  }

  goToDashboard(id: string) {
    this.router.navigate(['/secretaries/dashboard', id]);
  }

  async activateSecretary(secretary: SecretaryDto) {
    try {
      await this.secretaryService.activate(secretary.id!).toPromise();
      this.list.get(); // Refresh the list
    } catch (error) {
      console.error('Error activating secretary:', error);
    }
  }

  async deactivateSecretary(secretary: SecretaryDto) {
    if (confirm(`Are you sure you want to deactivate ${secretary.fullName}?`)) {
      try {
        await this.secretaryService.deactivate(secretary.id!).toPromise();
        this.list.get(); // Refresh the list
      } catch (error) {
        console.error('Error deactivating secretary:', error);
      }
    }
  }

  async deleteSecretary(secretary: SecretaryDto) {
    if (confirm(`Are you sure you want to delete ${secretary.fullName}?`)) {
      try {
        await this.secretaryService.delete(secretary.id!).toPromise();
        this.list.get(); // Refresh the list
      } catch (error) {
        console.error('Error deleting secretary:', error);
      }
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize());
  }

  trackById = (_: number, item: SecretaryDto) => item.id;
}