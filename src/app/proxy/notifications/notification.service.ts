import type { NotificationDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  apiName = 'Default';
  

  getMyNotifications = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, NotificationDto[]>({
      method: 'GET',
      url: '/api/app/notification/my-notifications',
    },
    { apiName: this.apiName,...config });
  

  getUnreadCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/notification/unread-count',
    },
    { apiName: this.apiName,...config });
  

  markAllAsRead = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/mark-all-as-read',
    },
    { apiName: this.apiName,...config });
  

  markAsRead = (notificationId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/mark-as-read/${notificationId}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
