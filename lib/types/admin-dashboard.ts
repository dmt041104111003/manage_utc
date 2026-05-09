export type DonutSegment = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

export type SimpleChartSeries = {
  name: string;
  data: number[];
  color: string;
};

export type FacultyStatItem = {
  label: string;
  applications: number;
  offered: number;
};

export type OverviewPayload = {
  faculties: string[];
  batches: Array<{ id: string; name: string; status: string }>;
  selectedFaculty: string;
  selectedBatchId: string | null;
  applicationStatusDonut: {
    segments: DonutSegment[];
    total: number;
  };
  jobStatusDonut: {
    segments: DonutSegment[];
    total: number;
  };
  enterprisesByField: { labels: string[]; values: number[] };
  progress: { labels: string[]; values: number[] };
  lineJobPosts: { labels: string[]; series: SimpleChartSeries[] };
  topFaculties: {
    top: FacultyStatItem[];
    bottom: FacultyStatItem[];
  };
};
