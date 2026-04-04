import type { NextSessionDto, SendSessionMessageDto, SessionMessageDto } from './dtos/models';
import type { CancelSessionDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  apiName = 'Default';
  

  cancelTodaySession = (input: CancelSessionDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/session/cancel-today-session',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getNextSession = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, NextSessionDto>({
      method: 'GET',
      url: '/api/app/session/next-session',
    },
    { apiName: this.apiName,...config });
  

  getNextSessionsPerCourse = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, NextSessionDto[]>({
      method: 'GET',
      url: '/api/app/session/next-sessions-per-course',
    },
    { apiName: this.apiName,...config });
  

  getSessionMessages = (groupScheduleId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SessionMessageDto[]>({
      method: 'GET',
      url: `/api/app/session/session-messages/${groupScheduleId}`,
    },
    { apiName: this.apiName,...config });
  

  notifySessionStart = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/session/notify-session-start',
    },
    { apiName: this.apiName,...config });
  

  sendSessionMessage = (groupScheduleId: string, input: SendSessionMessageDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SessionMessageDto>({
      method: 'POST',
      url: `/api/app/session/send-session-message/${groupScheduleId}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
