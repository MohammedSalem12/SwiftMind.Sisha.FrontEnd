import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';

/**
 * Touch-friendly square/circular image cropper.
 *
 * Pure-canvas, dependency-free (no ngx-image-cropper) so it stays light and
 * works inside the Capacitor WebView. The user drags to pan and uses the
 * slider (or pinch) to zoom; the fixed circular window is the crop region.
 * On confirm it renders the visible window to a square JPEG data URL.
 *
 * Mounted programmatically by ImageCropService — components never declare it.
 */
@Component({
  selector: 'app-image-crop-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="crop-overlay" dir="rtl" (click)="onBackdrop($event)">
      <div class="crop-sheet" (click)="$event.stopPropagation()">
        <div class="crop-head">
          <span class="crop-title">قص الصورة · Crop photo</span>
        </div>

        <div
          #stage
          class="crop-stage"
          (pointerdown)="onDown($event)"
          (pointermove)="onMove($event)"
          (pointerup)="onUp($event)"
          (pointercancel)="onUp($event)"
          (wheel)="onWheel($event)"
        >
          @if (imgSrc()) {
            <img
              #img
              class="crop-img"
              [src]="imgSrc()"
              (load)="onImgLoad()"
              [style.transform]="transform()"
              draggable="false"
              alt=""
            />
          }
          <div class="crop-mask"></div>
        </div>

        <div class="crop-zoom">
          <i class="fas fa-image crop-zoom-ico small"></i>
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            [value]="zoom()"
            (input)="onZoomInput($event)"
            aria-label="Zoom"
          />
          <i class="fas fa-image crop-zoom-ico"></i>
        </div>

        <div class="crop-actions">
          <button type="button" class="crop-btn cancel" (click)="cancel.emit()">
            إلغاء · Cancel
          </button>
          <button type="button" class="crop-btn confirm" (click)="confirm()">
            <i class="fas fa-check"></i> تأكيد · Confirm
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 100000; }
    .crop-overlay {
      position: fixed; inset: 0; display: flex; align-items: flex-end; justify-content: center;
      background: rgba(15, 18, 40, 0.72); backdrop-filter: blur(2px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      animation: fade .15s ease;
    }
    @media (min-width: 768px) { .crop-overlay { align-items: center; } }
    .crop-sheet {
      width: 100%; max-width: 460px; background: #fff;
      border-radius: 20px 20px 0 0; padding: 16px 16px 18px;
      box-shadow: 0 -8px 30px rgba(0,0,0,.25);
      animation: rise .2s cubic-bezier(.2,.8,.2,1);
    }
    @media (min-width: 768px) { .crop-sheet { border-radius: 20px; } }
    .crop-head { text-align: center; margin-bottom: 12px; }
    .crop-title { font-weight: 800; font-size: 1rem; color: #2d2150; }

    .crop-stage {
      position: relative; width: 100%; aspect-ratio: 1 / 1; max-height: 60vh;
      overflow: hidden; border-radius: 14px; background: #14152b;
      touch-action: none; user-select: none; cursor: grab;
    }
    .crop-stage:active { cursor: grabbing; }
    .crop-img {
      position: absolute; top: 50%; left: 50%; transform-origin: center center;
      will-change: transform; pointer-events: none; max-width: none;
    }
    /* circular hole punched with a huge box-shadow */
    .crop-mask {
      position: absolute; top: 50%; left: 50%; width: 78%; aspect-ratio: 1;
      transform: translate(-50%, -50%); border-radius: 50%;
      box-shadow: 0 0 0 9999px rgba(15,18,40,.55);
      border: 2px solid rgba(255,255,255,.9); pointer-events: none;
    }

    .crop-zoom { display: flex; align-items: center; gap: 10px; margin: 16px 4px 4px; }
    .crop-zoom input[type=range] { flex: 1; accent-color: #667eea; height: 28px; }
    .crop-zoom-ico { color: #667eea; font-size: 1.15rem; }
    .crop-zoom-ico.small { font-size: .8rem; opacity: .7; }

    .crop-actions { display: flex; gap: 10px; margin-top: 14px; }
    .crop-btn {
      flex: 1; min-height: 48px; border-radius: 12px; border: none;
      font-weight: 800; font-size: .95rem; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    }
    .crop-btn.cancel { background: #eef0f6; color: #5b6072; }
    .crop-btn.confirm { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
    .crop-btn:active { transform: scale(.98); }

    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes rise { from { transform: translateY(24px); opacity: .6; } to { transform: none; opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
      .crop-overlay, .crop-sheet { animation: none; }
    }
  `],
})
export class ImageCropModalComponent {
  @Input() set src(v: string) { this.imgSrc.set(v); }
  /** Output square edge in px and JPEG quality. */
  @Input() outputSize = 320;
  @Input() quality = 0.8;

  @Output() cropped = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  /** Diameter of the circular crop window as a fraction of the stage — keep in sync with `.crop-mask` width in styles. */
  static readonly MASK_RATIO = 0.78;

  @ViewChild('stage') stageRef!: ElementRef<HTMLDivElement>;
  @ViewChild('img') imgRef?: ElementRef<HTMLImageElement>;

  readonly imgSrc = signal<string>('');
  readonly zoom = signal(1);

  // pan offset in px relative to the stage centre
  private offX = 0;
  private offY = 0;
  // natural image dims and the "cover" base scale that fills the stage at zoom=1
  private natW = 0;
  private natH = 0;
  private baseScale = 1;

  // pointer / pinch tracking
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private lastX = 0;
  private lastY = 0;
  private pinchStartDist = 0;
  private pinchStartZoom = 1;

  transform(): string {
    const scale = this.baseScale * this.zoom();
    return `translate(-50%, -50%) translate(${this.offX}px, ${this.offY}px) scale(${scale})`;
  }

  onImgLoad(): void {
    const img = this.imgRef?.nativeElement;
    const stage = this.stageRef?.nativeElement;
    if (!img || !stage) return;
    this.natW = img.naturalWidth;
    this.natH = img.naturalHeight;
    const stageSize = stage.clientWidth;
    // "cover" the square stage so there are never empty gutters at zoom=1
    this.baseScale = Math.max(stageSize / this.natW, stageSize / this.natH);
    this.offX = 0;
    this.offY = 0;
    this.zoom.set(1);
    this.clampPan();
  }

  // ---- pointer handling (pan + pinch) ----
  onDown(e: PointerEvent): void {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) {
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    } else if (this.pointers.size === 2) {
      this.pinchStartDist = this.pointerDist();
      this.pinchStartZoom = this.zoom();
    }
  }

  onMove(e: PointerEvent): void {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size >= 2) {
      const dist = this.pointerDist();
      if (this.pinchStartDist > 0) {
        const next = this.pinchStartZoom * (dist / this.pinchStartDist);
        this.setZoom(next);
      }
      return;
    }
    // single-finger pan
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.offX += dx;
    this.offY += dy;
    this.clampPan();
  }

  onUp(e: PointerEvent): void {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 1) {
      const p = [...this.pointers.values()][0];
      this.lastX = p.x;
      this.lastY = p.y;
    }
    this.pinchStartDist = 0;
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.setZoom(this.zoom() * (e.deltaY < 0 ? 1.08 : 0.92));
  }

  onZoomInput(e: Event): void {
    this.setZoom(parseFloat((e.target as HTMLInputElement).value));
  }

  private pointerDist(): number {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  private setZoom(v: number): void {
    this.zoom.set(Math.min(4, Math.max(1, v)));
    this.clampPan();
  }

  /** Keep the image covering the crop window — no empty edges. */
  private clampPan(): void {
    const stage = this.stageRef?.nativeElement;
    if (!stage) return;
    const stageSize = stage.clientWidth;
    const scale = this.baseScale * this.zoom();
    const dispW = this.natW * scale;
    const dispH = this.natH * scale;
    const maxX = Math.max(0, (dispW - stageSize) / 2);
    const maxY = Math.max(0, (dispH - stageSize) / 2);
    this.offX = Math.min(maxX, Math.max(-maxX, this.offX));
    this.offY = Math.min(maxY, Math.max(-maxY, this.offY));
  }

  onBackdrop(_e: MouseEvent): void {
    this.cancel.emit();
  }

  confirm(): void {
    const img = this.imgRef?.nativeElement;
    const stage = this.stageRef?.nativeElement;
    if (!img || !stage) {
      this.cancel.emit();
      return;
    }
    const stageSize = stage.clientWidth;
    const scale = this.baseScale * this.zoom();
    // top-left of the displayed image within the stage (stage-centred coords)
    const dispW = this.natW * scale;
    const dispH = this.natH * scale;
    const imgLeft = stageSize / 2 + this.offX - dispW / 2;
    const imgTop = stageSize / 2 + this.offY - dispH / 2;
    // crop the circular window's bounding square (must match .crop-mask width: 78%)
    const cropSize = stageSize * ImageCropModalComponent.MASK_RATIO;
    const cropOff = (stageSize - cropSize) / 2;
    // source rect (in natural px) that maps to the crop window
    const sx = (cropOff - imgLeft) / scale;
    const sy = (cropOff - imgTop) / scale;
    const sSize = cropSize / scale;

    const out = this.outputSize;
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.cancel.emit();
      return;
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, out, out);
    this.cropped.emit(canvas.toDataURL('image/jpeg', this.quality));
  }
}
