import { TestBed } from '@angular/core/testing';
import { BiometricService } from './biometric.service';

describe('BiometricService', () => {
  let service: BiometricService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BiometricService],
    });
    service = TestBed.inject(BiometricService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isLocked signal should default to false', () => {
    expect(service.isLocked()).toBeFalse();
  });

  it('lock() should set isLocked to true', () => {
    service.lock();
    expect(service.isLocked()).toBeTrue();
  });

  it('unlock() should set isLocked to false', () => {
    service.lock();
    service.unlock();
    expect(service.isLocked()).toBeFalse();
  });

  it('isEnabled() should return false on web platform', async () => {
    const enabled = await service.isEnabled();
    expect(enabled).toBeFalse();
  });

  it('authenticate() should return false on web platform', async () => {
    const result = await service.authenticate();
    expect(result).toBeFalse();
  });

  it('isAvailable() should return false on web platform', async () => {
    const available = await service.isAvailable();
    expect(available).toBeFalse();
  });
});
