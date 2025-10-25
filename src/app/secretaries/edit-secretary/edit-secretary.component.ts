import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import type { CreateUpdateSecretaryDto, SecretaryDto } from '../../proxy/secretaries/models';
import { SecretaryService } from '../../proxy/secretaries/secretary.service';

@Component({
  selector: 'app-edit-secretary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-secretary.component.html',
  styleUrls: ['./edit-secretary.component.scss'],
})
export class EditSecretaryComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly secretaryService = inject(SecretaryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;
  loading = signal(false);
  secretaryId = signal<string>('');
  secretary = signal<SecretaryDto | null>(null);

  constructor() {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.required, Validators.maxLength(20)]],
      address: ['', [Validators.maxLength(200)]],
      department: ['', [Validators.maxLength(50)]],
      jobTitle: ['', [Validators.maxLength(50)]],
      hireDate: [''],
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.secretaryId.set(id);
      await this.loadSecretary(id);
    }
  }

  private async loadSecretary(id: string) {
    this.loading.set(true);
    try {
      const secretary = await this.secretaryService.get(id).toPromise();
      this.secretary.set(secretary!);
      
      // Populate the form
      const hireDate = secretary?.hireDate ? new Date(secretary.hireDate).toISOString().split('T')[0] : '';
      
      this.form.patchValue({
        firstName: secretary?.firstName || '',
        middleName: secretary?.middleName || '',
        lastName: secretary?.lastName || '',
        email: secretary?.email || '',
        phoneNumber: secretary?.phoneNumber || '',
        address: secretary?.address || '',
        department: secretary?.department || '',
        jobTitle: secretary?.jobTitle || '',
        hireDate: hireDate,
      });
    } catch (error) {
      console.error('Error loading secretary:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    if (this.form.valid && this.secretaryId()) {
      this.loading.set(true);
      try {
        const dto: CreateUpdateSecretaryDto = {
          ...this.form.value,
          hireDate: this.form.value.hireDate || undefined,
        };
        
        await this.secretaryService.update(this.secretaryId(), dto).toPromise();
        this.router.navigate(['/secretaries']);
      } catch (error) {
        console.error('Error updating secretary:', error);
      } finally {
        this.loading.set(false);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/secretaries']);
  }

  private markFormGroupTouched() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldDisplayName(controlName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['maxlength']) {
        return `${this.getFieldDisplayName(controlName)} is too long`;
      }
    }
    return '';
  }

  private getFieldDisplayName(controlName: string): string {
    const fieldNames: { [key: string]: string } = {
      firstName: 'First Name',
      middleName: 'Middle Name',
      lastName: 'Last Name',
      email: 'Email',
      phoneNumber: 'Phone Number',
      address: 'Address',
      department: 'Department',
      jobTitle: 'Job Title',
      hireDate: 'Hire Date',
    };
    return fieldNames[controlName] || controlName;
  }
}