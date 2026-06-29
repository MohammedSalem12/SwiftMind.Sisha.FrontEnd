import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
} from '@angular/core';

import { ImageCropModalComponent } from '../components/image-crop-modal.component';

export interface CropOptions {
  /** Output square edge in px (default 320). */
  size?: number;
  /** JPEG quality 0–1 (default 0.8). */
  quality?: number;
}

/**
 * Opens the touch crop modal for a picked File and resolves with a square
 * cropped JPEG data URL — or `null` if the user cancels. Drop-in replacement
 * for the old per-component `resizeImageToDataUrl(file, 320, 0.8)` helpers, so
 * every photo upload (register + all profile editors) now crops consistently.
 *
 *   const dataUrl = await this.imageCrop.crop(file);
 *   if (dataUrl) this.editPhoto.set(dataUrl);
 */
@Injectable({ providedIn: 'root' })
export class ImageCropService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  crop(file: File, opts: CropOptions = {}): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onload = () => this.openModal(reader.result as string, opts, resolve);
      reader.readAsDataURL(file);
    });
  }

  private openModal(
    src: string,
    opts: CropOptions,
    resolve: (v: string | null) => void,
  ): void {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const ref: ComponentRef<ImageCropModalComponent> = createComponent(
      ImageCropModalComponent,
      { environmentInjector: this.injector, hostElement: host },
    );
    ref.setInput('src', src);
    if (opts.size) ref.setInput('outputSize', opts.size);
    if (opts.quality != null) ref.setInput('quality', opts.quality);

    const cleanup = (value: string | null) => {
      try {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      } finally {
        host.remove();
      }
      resolve(value);
    };

    ref.instance.cropped.subscribe((dataUrl: string) => cleanup(dataUrl));
    ref.instance.cancel.subscribe(() => cleanup(null));

    this.appRef.attachView(ref.hostView);
  }
}
