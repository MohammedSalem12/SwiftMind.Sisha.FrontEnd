import { Injectable, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, combineLatest, map } from 'rxjs';
import { RoleBasedUIService } from './role-based-ui.service';
import type { TeacherDto } from '../proxy/teachers/models';
import type { ParentDto } from '../proxy/parents/models'; 
import type { StudentDto } from '../proxy/students/models';
import type { SecretaryDto } from '../proxy/secretaries/models';

export interface SelectOption {
  value: string;
  label: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormRoleHelperService {
  private readonly roleService = inject(RoleBasedUIService);

  /**
   * Auto-populate and disable teacher select based on current user
   */
  configureTeacherSelect<T extends TeacherDto>(
    control: FormControl,
    teachers: T[] | Observable<T[]>,
    idField: keyof T = 'id' as keyof T,
    nameField: keyof T = 'name' as keyof T,
    codeField?: keyof T
  ): Observable<{ options: SelectOption[], disabled: boolean }> {
    const teachersObs = Array.isArray(teachers) ? 
      new Observable<T[]>(subscriber => {
        subscriber.next(teachers);
        subscriber.complete();
      }) : teachers;

    return combineLatest([
      teachersObs,
      new Observable(subscriber => {
        const checkAndEmit = () => {
          const userInfo = this.roleService.userInfo();
          subscriber.next(userInfo);
        };
        checkAndEmit();
        // Simple interval check for changes (in production, use proper reactive patterns)
        const interval = setInterval(checkAndEmit, 1000);
        return () => clearInterval(interval);
      })
    ]).pipe(
      map(([teachersList, userInfo]) => {
        const options: SelectOption[] = teachersList.map(teacher => ({
          value: String(teacher[idField]),
          label: String(teacher[nameField]),
          code: codeField ? String(teacher[codeField]) : undefined
        }));

        if (this.roleService.isTeacher()) {
          // Find current teacher in the list
          const currentActorId = this.roleService.getCurrentActorId();
          const currentActorCode = this.roleService.getCurrentActorCode();
          
          const currentTeacher = teachersList.find(teacher => 
            String(teacher[idField]) === currentActorId ||
            (codeField && String(teacher[codeField]) === currentActorCode)
          );

          if (currentTeacher) {
            const teacherId = String(currentTeacher[idField]);
            // Auto-select and disable
            control.setValue(teacherId);
            control.disable();
            return { options, disabled: true };
          }
        }

        // Enable control for non-teachers or if teacher not found
        control.enable();
        return { options, disabled: false };
      })
    );
  }

  /**
   * Auto-populate and disable parent select based on current user
   */
  configureParentSelect<T extends ParentDto>(
    control: FormControl,
    parents: T[] | Observable<T[]>,
    idField: keyof T = 'id' as keyof T,
    nameField: keyof T = 'name' as keyof T,
    codeField?: keyof T
  ): Observable<{ options: SelectOption[], disabled: boolean }> {
    const parentsObs = Array.isArray(parents) ? 
      new Observable<T[]>(subscriber => {
        subscriber.next(parents);
        subscriber.complete();
      }) : parents;

    return combineLatest([
      parentsObs,
      new Observable(subscriber => {
        const checkAndEmit = () => {
          const userInfo = this.roleService.userInfo();
          subscriber.next(userInfo);
        };
        checkAndEmit();
        const interval = setInterval(checkAndEmit, 1000);
        return () => clearInterval(interval);
      })
    ]).pipe(
      map(([parentsList, userInfo]) => {
        const options: SelectOption[] = parentsList.map(parent => ({
          value: String(parent[idField]),
          label: String(parent[nameField]),
          code: codeField ? String(parent[codeField]) : undefined
        }));

        if (this.roleService.isParent()) {
          // Find current parent in the list
          const currentActorId = this.roleService.getCurrentActorId();
          const currentActorCode = this.roleService.getCurrentActorCode();
          
          const currentParent = parentsList.find(parent => 
            String(parent[idField]) === currentActorId ||
            (codeField && String(parent[codeField]) === currentActorCode)
          );

          if (currentParent) {
            const parentId = String(currentParent[idField]);
            // Auto-select and disable
            control.setValue(parentId);
            control.disable();
            return { options, disabled: true };
          }
        }

        // Enable control for non-parents or if parent not found
        control.enable();
        return { options, disabled: false };
      })
    );
  }

  /**
   * Auto-populate and disable student select based on current user
   */
  configureStudentSelect<T extends StudentDto>(
    control: FormControl,
    students: T[] | Observable<T[]>,
    idField: keyof T = 'id' as keyof T,
    nameField: keyof T = 'name' as keyof T,
    codeField?: keyof T
  ): Observable<{ options: SelectOption[], disabled: boolean }> {
    const studentsObs = Array.isArray(students) ? 
      new Observable<T[]>(subscriber => {
        subscriber.next(students);
        subscriber.complete();
      }) : students;

    return combineLatest([
      studentsObs,
      new Observable(subscriber => {
        const checkAndEmit = () => {
          const userInfo = this.roleService.userInfo();
          subscriber.next(userInfo);
        };
        checkAndEmit();
        const interval = setInterval(checkAndEmit, 1000);
        return () => clearInterval(interval);
      })
    ]).pipe(
      map(([studentsList, userInfo]) => {
        const options: SelectOption[] = studentsList.map(student => ({
          value: String(student[idField]),
          label: String(student[nameField]),
          code: codeField ? String(student[codeField]) : undefined
        }));

        if (this.roleService.isStudent()) {
          // Find current student in the list
          const currentActorId = this.roleService.getCurrentActorId();
          const currentActorCode = this.roleService.getCurrentActorCode();
          
          const currentStudent = studentsList.find(student => 
            String(student[idField]) === currentActorId ||
            (codeField && String(student[codeField]) === currentActorCode)
          );

          if (currentStudent) {
            const studentId = String(currentStudent[idField]);
            // Auto-select and disable
            control.setValue(studentId);
            control.disable();
            return { options, disabled: true };
          }
        }

        // Enable control for non-students or if student not found
        control.enable();
        return { options, disabled: false };
      })
    );
  }

  /**
   * Auto-populate and disable secretary select based on current user
   */
  configureSecretarySelect<T extends SecretaryDto>(
    control: FormControl,
    secretaries: T[] | Observable<T[]>,
    idField: keyof T = 'id' as keyof T,
    nameField: keyof T = 'name' as keyof T,
    codeField?: keyof T
  ): Observable<{ options: SelectOption[], disabled: boolean }> {
    const secretariesObs = Array.isArray(secretaries) ? 
      new Observable<T[]>(subscriber => {
        subscriber.next(secretaries);
        subscriber.complete();
      }) : secretaries;

    return combineLatest([
      secretariesObs,
      new Observable(subscriber => {
        const checkAndEmit = () => {
          const userInfo = this.roleService.userInfo();
          subscriber.next(userInfo);
        };
        checkAndEmit();
        const interval = setInterval(checkAndEmit, 1000);
        return () => clearInterval(interval);
      })
    ]).pipe(
      map(([secretariesList, userInfo]) => {
        const options: SelectOption[] = secretariesList.map(secretary => ({
          value: String(secretary[idField]),
          label: String(secretary[nameField]),
          code: codeField ? String(secretary[codeField]) : undefined
        }));

        if (this.roleService.isSecretary()) {
          // Find current secretary in the list
          const currentActorId = this.roleService.getCurrentActorId();
          const currentActorCode = this.roleService.getCurrentActorCode();
          
          const currentSecretary = secretariesList.find(secretary => 
            String(secretary[idField]) === currentActorId ||
            (codeField && String(secretary[codeField]) === currentActorCode)
          );

          if (currentSecretary) {
            const secretaryId = String(currentSecretary[idField]);
            // Auto-select and disable
            control.setValue(secretaryId);
            control.disable();
            return { options, disabled: true };
          }
        }

        // Enable control for non-secretaries or if secretary not found
        control.enable();
        return { options, disabled: false };
      })
    );
  }

  /**
   * Generic method to configure any select based on role
   */
  configureRoleBasedSelect<T>(
    control: FormControl,
    items: T[] | Observable<T[]>,
    config: {
      roleCheck: () => boolean;
      getCurrentId: () => string | undefined;
      getCurrentCode?: () => string | undefined;
      idField: keyof T;
      nameField: keyof T;
      codeField?: keyof T;
    }
  ): Observable<{ options: SelectOption[], disabled: boolean }> {
    const itemsObs = Array.isArray(items) ? 
      new Observable<T[]>(subscriber => {
        subscriber.next(items);
        subscriber.complete();
      }) : items;

    return combineLatest([
      itemsObs,
      new Observable(subscriber => {
        const checkAndEmit = () => {
          const userInfo = this.roleService.userInfo();
          subscriber.next(userInfo);
        };
        checkAndEmit();
        const interval = setInterval(checkAndEmit, 1000);
        return () => clearInterval(interval);
      })
    ]).pipe(
      map(([itemsList, userInfo]) => {
        const options: SelectOption[] = itemsList.map(item => ({
          value: String(item[config.idField]),
          label: String(item[config.nameField]),
          code: config.codeField ? String(item[config.codeField]) : undefined
        }));

        if (config.roleCheck()) {
          const currentId = config.getCurrentId();
          const currentCode = config.getCurrentCode?.();
          
          const currentItem = itemsList.find(item => 
            String(item[config.idField]) === currentId ||
            (config.codeField && currentCode && String(item[config.codeField]) === currentCode)
          );

          if (currentItem) {
            const itemId = String(currentItem[config.idField]);
            control.setValue(itemId);
            control.disable();
            return { options, disabled: true };
          }
        }

        control.enable();
        return { options, disabled: false };
      })
    );
  }
}