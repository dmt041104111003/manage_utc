export type StudentDashboardItem = {
  internshipStatus: string;
  reportSubmittedCount: number;
  newFeedbackCount: number;
  tasks: string[];
};

export type StudentDashboardOverviewResponse = {
  item: StudentDashboardItem;
};

