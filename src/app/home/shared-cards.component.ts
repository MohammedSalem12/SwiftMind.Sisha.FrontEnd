import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { SharedKnowledgeCardService } from '@proxy/knowledge-cards';
import type { SharedKnowledgeCardDto, UserSearchResultDto, ShareKnowledgeCardDto } from '@proxy/knowledge-cards/models';

@Component({
  selector: 'app-shared-cards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="header">
        <button class="back-btn" (click)="router.navigate(['/'])"><i class="fas fa-arrow-right"></i></button>
        <h1>المشاركات المعرفية · Shared Cards</h1>
      </div>

      @if (loading()) {
        <div class="load"><div class="spinner"></div></div>
      }

      @if (!loading() && cards().length === 0) {
        <div class="empty">
          <div class="empty-icon"><i class="fas fa-share-alt"></i></div>
          <h3>لا توجد مشاركات</h3>
          <p>No shared cards yet</p>
        </div>
      }

      @if (!loading() && cards().length > 0) {
        <div class="list">
          @for (c of cards(); track c.id) {
            <div class="card" [class.unread]="!c.isRead" (click)="markRead(c)">
              <div class="card-top">
                <div class="card-icon"><i class="fas fa-lightbulb"></i></div>
                <div class="card-body">
                  <span class="card-title">{{ c.cardTitleAr || c.cardTitleEn }}</span>
                  <span class="card-topic"><i class="fas fa-tag"></i> {{ c.cardTopic }}</span>
                </div>
                @if (!c.isRead) { <div class="unread-dot"></div> }
              </div>
              <p class="card-content">{{ c.cardContentAr || c.cardContentEn }}</p>
              <div class="card-footer">
                <span class="card-sender"><i class="fas fa-user"></i> {{ c.senderName }}</span>
                @if (c.message) { <span class="card-msg"><i class="fas fa-comment"></i> {{ c.message }}</span> }
                <span class="card-time">{{ timeAgo(c.creationTime) }}</span>
              </div>
              <button class="reshare-btn" (click)="openShare(c); $event.stopPropagation()">
                <i class="fas fa-share"></i> مشاركة · Share
              </button>
            </div>
          }
        </div>
      }

      <!-- Share Modal -->
      @if (showShareModal()) {
        <div class="modal-overlay" (click)="showShareModal.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h3 class="modal-title"><i class="fas fa-share-alt"></i> مشاركة البطاقة · Share Card</h3>
            <div class="modal-card-preview">{{ shareCard()?.cardTitleAr || shareCard()?.cardTitleEn }}</div>

            <div class="search-wrap">
              <input class="search-input" type="text" placeholder="ابحث بالاسم أو الكود · Search user..."
                     [ngModel]="searchQuery()"
                     (ngModelChange)="onSearchChange($event)" />
            </div>

            @if (searching()) { <div class="search-load"><div class="spinner-sm"></div></div> }

            @if (searchResults().length > 0) {
              <div class="user-list">
                @for (u of searchResults(); track u.userId) {
                  <button class="user-item" [class.selected]="selectedUser()?.userId === u.userId" (click)="selectedUser.set(u)">
                    <div class="user-avatar">{{ u.displayName?.charAt(0) || '?' }}</div>
                    <div class="user-info">
                      <span class="user-name">{{ u.displayName }}</span>
                      <span class="user-meta">{{ u.code }} · {{ roleLabel(u.role) }}</span>
                    </div>
                    @if (selectedUser()?.userId === u.userId) {
                      <i class="fas fa-check-circle selected-check"></i>
                    }
                  </button>
                }
              </div>
            }

            @if (selectedUser()) {
              <input class="msg-input" type="text" placeholder="رسالة (اختياري) · Optional message"
                     [ngModel]="shareMessage()" (ngModelChange)="shareMessage.set($event)" maxlength="300" />
            }

            @if (shareError()) { <div class="share-error"><i class="fas fa-exclamation-circle"></i> {{ shareError() }}</div> }
            @if (shareSuccess()) { <div class="share-success"><i class="fas fa-check-circle"></i> تم المشاركة بنجاح!</div> }

            <div class="modal-actions">
              <button class="modal-btn btn-cancel" (click)="showShareModal.set(false)">إلغاء</button>
              <button class="modal-btn btn-send" [disabled]="!selectedUser() || sending()" (click)="sendShare()">
                @if (sending()) { <span class="spinner-sm"></span> }
                @else { <i class="fas fa-paper-plane"></i> }
                إرسال · Send
              </button>
            </div>
          </div>
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }
    .header {
      background:linear-gradient(135deg,#667eea,#764ba2);
      padding:calc(env(safe-area-inset-top,0px) + .6rem) 1rem .75rem;
      display:flex; align-items:center; gap:.75rem; color:#fff;
    }
    .header h1 { margin:0; font-size:1.05rem; font-weight:700; }
    .back-btn {
      width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,.15);
      border:1.5px solid rgba(255,255,255,.25); color:#fff; font-size:.9rem;
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }
    .load { text-align:center; padding:3rem; }
    .spinner { width:32px; height:32px; border:3px solid #e5e7eb; border-top-color:#667eea; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty { text-align:center; padding:3rem 1.5rem; }
    .empty-icon { font-size:2.5rem; color:#d1d5db; margin-bottom:.75rem; }
    .empty h3 { margin:0 0 .2rem; font-size:1rem; font-weight:700; color:#1a1a2e; }
    .empty p { margin:0; font-size:.8rem; color:#9ca3af; }
    .list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.6rem; }
    .card {
      background:#fff; border-radius:16px; padding:1rem; border:1.5px solid #f0f0f5;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .card.unread { border-color:rgba(102,126,234,.25); background:#fafaff; }
    .card-top { display:flex; align-items:flex-start; gap:.6rem; margin-bottom:.5rem; }
    .card-icon {
      width:38px; height:38px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:.9rem;
    }
    .card-body { flex:1; min-width:0; }
    .card-title { display:block; font-size:.9rem; font-weight:700; color:#1a1a2e; }
    .card-topic { font-size:.68rem; color:#667eea; display:flex; align-items:center; gap:.2rem; i { font-size:.55rem; } }
    .unread-dot { width:8px; height:8px; border-radius:50%; background:#667eea; flex-shrink:0; margin-top:4px; }
    .card-content { font-size:.82rem; color:#4b5563; line-height:1.5; margin:0 0 .5rem; }
    .card-footer { display:flex; flex-wrap:wrap; gap:.5rem; font-size:.7rem; color:#9ca3af; margin-bottom:.5rem; }
    .card-sender, .card-msg { display:flex; align-items:center; gap:.2rem; i { font-size:.55rem; } }
    .card-time { margin-right:auto; }
    .reshare-btn {
      width:100%; padding:.5rem; border:1.5px solid rgba(102,126,234,.2); border-radius:10px;
      background:rgba(102,126,234,.04); color:#667eea; font-size:.78rem; font-weight:700;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.3rem;
      min-height:40px;
    }
    .reshare-btn:active { background:rgba(102,126,234,.1); }

    /* Modal */
    .modal-overlay {
      position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.45);
      backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:1rem;
    }
    .modal-card {
      background:#fff; border-radius:20px; width:100%; max-width:360px;
      padding:1.25rem; box-shadow:0 20px 60px rgba(0,0,0,.2);
    }
    .modal-title { margin:0 0 .6rem; font-size:.95rem; font-weight:700; color:#1a1a2e; display:flex; align-items:center; gap:.4rem; i { color:#667eea; } }
    .modal-card-preview {
      background:rgba(102,126,234,.06); border-radius:10px; padding:.5rem .75rem;
      font-size:.82rem; font-weight:600; color:#4a4a6a; margin-bottom:.75rem;
    }
    .search-wrap { margin-bottom:.5rem; }
    .search-input {
      width:100%; padding:.6rem .75rem; border:1.5px solid #e5e7eb; border-radius:12px;
      font-size:16px; box-sizing:border-box; font-family:inherit;
    }
    .search-input:focus { outline:none; border-color:#667eea; }
    .search-load { text-align:center; padding:.5rem; }
    .spinner-sm { width:16px; height:16px; border:2px solid #e5e7eb; border-top-color:#667eea; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
    .user-list { max-height:200px; overflow-y:auto; margin-bottom:.5rem; }
    .user-item {
      width:100%; display:flex; align-items:center; gap:.6rem; padding:.5rem;
      border:none; background:transparent; cursor:pointer; border-radius:10px;
      text-align:right; transition:background .1s;
    }
    .user-item:active, .user-item.selected { background:rgba(102,126,234,.06); }
    .user-avatar {
      width:34px; height:34px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:.8rem; font-weight:700;
    }
    .user-info { flex:1; min-width:0; }
    .user-name { display:block; font-size:.85rem; font-weight:600; color:#1a1a2e; }
    .user-meta { display:block; font-size:.68rem; color:#9ca3af; }
    .selected-check { color:#667eea; font-size:.9rem; flex-shrink:0; }
    .msg-input {
      width:100%; padding:.55rem .75rem; border:1.5px solid #e5e7eb; border-radius:10px;
      font-size:.85rem; box-sizing:border-box; font-family:inherit; margin-bottom:.5rem;
    }
    .msg-input:focus { outline:none; border-color:#667eea; }
    .share-error { background:rgba(239,68,68,.08); color:#dc2626; padding:.4rem .6rem; border-radius:8px; font-size:.75rem; margin-bottom:.5rem; display:flex; align-items:center; gap:.3rem; }
    .share-success { background:rgba(34,197,94,.08); color:#16a34a; padding:.4rem .6rem; border-radius:8px; font-size:.75rem; margin-bottom:.5rem; display:flex; align-items:center; gap:.3rem; }
    .modal-actions { display:flex; gap:.4rem; }
    .modal-btn {
      flex:1; padding:.65rem; border:none; border-radius:12px; font-size:.85rem; font-weight:700;
      cursor:pointer; min-height:44px; display:flex; align-items:center; justify-content:center; gap:.3rem;
    }
    .modal-btn:disabled { opacity:.5; }
    .btn-cancel { background:#f3f4f6; color:#4b5563; }
    .btn-send { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; }
  `],
})
export class SharedCardsComponent implements OnInit {
  readonly router = inject(Router);
  private readonly svc = inject(SharedKnowledgeCardService);

  loading = signal(true);
  cards = signal<SharedKnowledgeCardDto[]>([]);

  // Share modal
  showShareModal = signal(false);
  shareCard = signal<SharedKnowledgeCardDto | null>(null);
  searchQuery = signal('');
  searchResults = signal<UserSearchResultDto[]>([]);
  searching = signal(false);
  selectedUser = signal<UserSearchResultDto | null>(null);
  shareMessage = signal('');
  sending = signal(false);
  shareError = signal<string | null>(null);
  shareSuccess = signal(false);

  private searchDebounce = new Subject<string>();

  async ngOnInit(): Promise<void> {
    // Setup debounced search
    this.searchDebounce.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(q => this.doSearch(q));

    try {
      const result = await lastValueFrom(this.svc.getSharedWithMe());
      this.cards.set(result || []);
    } catch { /* silent */ }
    finally { this.loading.set(false); }
  }

  async markRead(c: SharedKnowledgeCardDto): Promise<void> {
    if (c.isRead) return;
    try {
      await lastValueFrom(this.svc.markAsRead(c.id!));
      this.cards.update(list => list.map(x => x.id === c.id ? { ...x, isRead: true } : x));
    } catch { /* silent */ }
  }

  openShare(c: SharedKnowledgeCardDto): void {
    this.shareCard.set(c);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.selectedUser.set(null);
    this.shareMessage.set('');
    this.shareError.set(null);
    this.shareSuccess.set(false);
    this.showShareModal.set(true);
  }

  onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this.searchDebounce.next(q);
  }

  private async doSearch(q: string): Promise<void> {
    if (!q || q.length < 2) { this.searchResults.set([]); return; }
    this.searching.set(true);
    try {
      const results = await lastValueFrom(this.svc.searchUsers(q));
      this.searchResults.set(results || []);
    } catch { this.searchResults.set([]); }
    finally { this.searching.set(false); }
  }

  async sendShare(): Promise<void> {
    const card = this.shareCard();
    const user = this.selectedUser();
    if (!card || !user) return;
    this.sending.set(true);
    this.shareError.set(null);
    this.shareSuccess.set(false);
    try {
      await lastValueFrom(this.svc.share({
        knowledgeCardId: card.knowledgeCardId,
        recipientUserId: user.userId,
        message: this.shareMessage() || undefined,
        cardTitleAr: card.cardTitleAr,
        cardTitleEn: card.cardTitleEn,
        cardContentAr: card.cardContentAr,
        cardContentEn: card.cardContentEn,
        cardTopic: card.cardTopic,
      } as any));
      this.shareSuccess.set(true);
      setTimeout(() => this.showShareModal.set(false), 1200);
    } catch (e: any) {
      this.shareError.set(e?.error?.error?.message || 'حدث خطأ');
    } finally { this.sending.set(false); }
  }

  roleLabel(role: string): string {
    switch (role?.toUpperCase()) {
      case 'STUDENT': return 'طالب';
      case 'TEACHER': return 'معلم';
      case 'PARENT': return 'ولي أمر';
      default: return role;
    }
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return 'الآن';
    if (diff < 60) return `منذ ${diff} دقيقة`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `منذ ${hrs} ساعة`;
    const days = Math.floor(hrs / 24);
    return `منذ ${days} يوم`;
  }
}
