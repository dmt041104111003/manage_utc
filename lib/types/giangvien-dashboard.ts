export type LecturerDashboardItem = {
  assignedStudents: number;
  pendingReports: number;
  weeklyReviews: number;
  tasks: string[];
};

export type LecturerDashboardOverviewResponse = {
  item: LecturerDashboardItem;
};

