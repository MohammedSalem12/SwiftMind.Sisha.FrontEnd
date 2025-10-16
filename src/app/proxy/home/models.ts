
export interface DashboardSummaryDto {
  stats: HomeStatsDto;
  entityCounts: EntityCountDto[];
  recentActivity: RecentActivityDto;
}

export interface EntityCountDto {
  entityName?: string;
  count: number;
  description?: string;
}

export interface HomeStatsDto {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalCourses: number;
  totalGroups: number;
  totalEnrollments: number;
  totalExams: number;
  totalExamGrades: number;
  lastUpdated?: string;
}

export interface RecentActivityDto {
  recentEnrollments: number;
  recentExams: number;
  recentGrades: number;
  activityDate?: string;
}
