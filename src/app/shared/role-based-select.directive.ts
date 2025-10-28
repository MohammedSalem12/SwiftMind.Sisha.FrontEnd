import { Directive, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RoleBasedUIService } from './role-based-ui.service';

/**
 * Directive to automatically configure form controls based on user role
 * Usage: <select appRoleBasedSelect="teacher" [items]="teachers" ...>
 */
@Directive({
  selector: '[appRoleBasedSelect]',
  standalone: true
})
export class RoleBasedSelectDirective implements OnInit, OnDestroy {
  @Input() appRoleBasedSelect: 'teacher' | 'parent' | 'student' | 'secretary' = 'teacher';
  @Input() items: any[] = [];
  @Input() control?: FormControl;
  @Input() idField = 'id';
  @Input() nameField = 'name';
  @Input() codeField?: string;
  
  @Output() roleAutoSelected = new EventEmitter<{ disabled: boolean, selectedValue?: string }>();

  private readonly roleService = inject(RoleBasedUIService);
  private subscription?: Subscription;

  ngOnInit(): void {
    this.applyRoleBasedLogic();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private applyRoleBasedLogic(): void {
    const isCorrectRole = this.checkRole();
    
    if (isCorrectRole && this.items.length > 0) {
      const currentActorId = this.roleService.getCurrentActorId();
      const currentActorCode = this.roleService.getCurrentActorCode();
      
      const currentItem = this.items.find(item => 
        String(item[this.idField]) === currentActorId ||
        (this.codeField && String(item[this.codeField]) === currentActorCode)
      );

      if (currentItem) {
        const selectedValue = String(currentItem[this.idField]);
        
        if (this.control) {
          this.control.setValue(selectedValue);
          this.control.disable();
        }
        
        this.roleAutoSelected.emit({ disabled: true, selectedValue });
        return;
      }
    }

    // Enable control if not auto-selected
    if (this.control) {
      this.control.enable();
    }
    this.roleAutoSelected.emit({ disabled: false });
  }

  private checkRole(): boolean {
    switch (this.appRoleBasedSelect) {
      case 'teacher': return this.roleService.isTeacher();
      case 'parent': return this.roleService.isParent();
      case 'student': return this.roleService.isStudent();
      case 'secretary': return this.roleService.isSecretary();
      default: return false;
    }
  }
}