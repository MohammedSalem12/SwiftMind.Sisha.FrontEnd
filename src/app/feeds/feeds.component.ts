import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { FeedService } from '@proxy/feeds';
import type { FeedDto } from '@proxy/feeds/dtos/models';

@Component({
  selector: 'app-feeds',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './feeds.component.html',
  styleUrls: ['./feeds.component.scss'],
  providers: [ListService],
})
export class FeedsComponent implements OnInit {
  private readonly list = inject(ListService);
  private readonly svc = inject(FeedService);

  feeds = signal<FeedDto[]>([]);
  loading = signal(false);
  filter = signal('');

  ngOnInit(): void {
    this.hookList();
  }

  hookList() {
    this.list.hookToQuery((q) => {
      this.loading.set(true);
      return this.svc.getList({ skipCount: 0, maxResultCount: 50, sorting: q.sort ?? 'publishDate desc' } as any);
    }).subscribe({
      next: (res: PagedResultDto<FeedDto>) => {
        const items = (res.items ?? []).filter(f => {
          const fterm = this.filter()?.trim().toLowerCase();
          if (!fterm) return true;
          return ((f.title ?? '').toLowerCase().includes(fterm) || (f.content ?? '').toLowerCase().includes(fterm));
        });
        this.feeds.set(items);
        this.loading.set(false);
      },
      error: (e) => { console.error(e); this.loading.set(false); }
    });
  }

  onSearch() { this.list.get(); }

  excerpt(text?: string, n = 140) {
    if (!text) return '';
    return text.length > n ? text.substr(0, n) + '…' : text;
  }

  trackById = (_: number, it: FeedDto) => it.id;
}
