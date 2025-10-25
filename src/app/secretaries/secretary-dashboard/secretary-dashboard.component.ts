import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import type { SecretaryDashboardDto } from '../../proxy/secretaries/models';
import { SecretaryService } from '../../proxy/secretaries/secretary.service';

@Component({
  selector: 'app-secretary-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './secretary-dashboard.component.html',
  styleUrls: ['./secretary-dashboard.component.scss'],
})
export class SecretaryDashboardComponent implements OnInit {
  private readonly secretaryService = inject(SecretaryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  dashboard = signal<SecretaryDashboardDto | null>(null);
  loading = signal(false);
  secretaryId = signal<string>('');

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.secretaryId.set(id);
      await this.loadDashboard(id);
    }
  }

  private async loadDashboard(id: string) {
    this.loading.set(true);
    try {
      const dashboard = await this.secretaryService.getDashboard(id).toPromise();
      this.dashboard.set(dashboard!);
    } catch (error) {
      console.error('Error loading secretary dashboard:', error);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/secretaries']);
  }

  goToEdit() {
    this.router.navigate(['/secretaries/edit', this.secretaryId()]);
  }
}