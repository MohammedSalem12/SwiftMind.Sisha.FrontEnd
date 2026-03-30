import type { AcademicTermDto, CopySemesterResultDto, CreateUpdateAcademicTermDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { ListResultDto, PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AcademicTermService {
  apiName = 'Default';
  

  activateTerm = (termId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademicTermDto>({
      method: 'POST',
      url: `/api/app/academic-term/activate-term/${termId}`,
    },
    { apiName: this.apiName,...config });
  

  copyGroupsToNewSemester = (sourceTermId: string, targetTermId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CopySemesterResultDto>({
      method: 'POST',
      url: '/api/app/academic-term/copy-groups-to-new-semester',
      params: { sourceTermId, targetTermId },
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateUpdateAcademicTermDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademicTermDto>({
      method: 'POST',
      url: '/api/app/academic-term',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/academic-term/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademicTermDto>({
      method: 'GET',
      url: `/api/app/academic-term/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getActiveTerm = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademicTermDto>({
      method: 'GET',
      url: '/api/app/academic-term/active-term',
    },
    { apiName: this.apiName,...config });
  

  getAllTerms = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ListResultDto<AcademicTermDto>>({
      method: 'GET',
      url: '/api/app/academic-term/terms',
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<AcademicTermDto>>({
      method: 'GET',
      url: '/api/app/academic-term',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateAcademicTermDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademicTermDto>({
      method: 'PUT',
      url: `/api/app/academic-term/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
