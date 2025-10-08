import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FeedService } from '@proxy/feeds';
import type { FeedDto } from '@proxy/feeds/dtos/models';

@Component({
  selector: 'app-feed-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feed-detail.component.html',
  styles: [`
    .feed-detail { max-width: 880px; margin: 1rem auto; padding: 0 1rem }
    .feed-detail .card { background:#fff; border-radius:10px; padding:1.25rem; box-shadow:0 10px 30px rgba(2,6,23,0.06) }
    .feed-detail .card-head h1 { margin:0 0 0.5rem; font-size:24px }
    .feed-detail .card-head .meta { color:#6b7280; font-size:13px }
    .feed-detail .card-body .content { color:#111827; line-height:1.6 }
    .feed-detail .card-footer { margin-top:1rem }
    .feed-detail .loading { text-align:center; padding:2rem }
    .feed-detail .empty { text-align:center; padding:2rem; color:#6b7280 }
  `],
})
export class FeedDetailComponent implements OnInit {
  private readonly svc = inject(FeedService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly location = inject(Location);

  feed = signal<FeedDto | null>(null);
  safeContent = signal<SafeHtml | string>('');
  loading = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((pm) => {
      const id = pm.get('id');
      if (id) this.load(id);
    });
  }

  load(id: string) {
    this.loading.set(true);
    this.svc.get(id).subscribe({
      next: (f) => {
        this.feed.set(f);
        this.safeContent.set(this.sanitizer.bypassSecurityTrustHtml(f.content ?? ''));
        this.loading.set(false);
      },
      error: (e) => {
        console.error('Failed to load feed', e);
        this.loading.set(false);
      },
    });
  }

  trackByIdx = (i: number) => i;

  goBack() {
    try { this.location.back(); } catch { window.history.back(); }
  }
}
