export type EnterpriseDashboardItem = {
  openPosts: number;
  newApplications: number;
  receivingStudents: number;
  tasks: string[];
};

export type EnterpriseDashboardOverviewResponse = {
  item: EnterpriseDashboardItem;
};

