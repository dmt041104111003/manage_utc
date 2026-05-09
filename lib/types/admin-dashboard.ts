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

export type LatestJobItem = {
  id: string;
  title: string;
  enterpriseName: string | null;
  batchName: string | null;
  createdAt: string | null;
  deadlineAt: string | null;
  recruitmentCount: number;
  expertise: string;
  taxCode: string | null;
};

export type OverviewPayload = {
  faculties: string[];
  batches: Array<{ id: string; name: string; status: string }>;
  selectedFaculty: string;
  selectedBatchId: string | null;
  donut: {
    segments: DonutSegment[];
    total: number;
    totalPercentText?: string;
  };
  enterprisesByField: { labels: string[]; values: number[] };
  progress: { labels: string[]; values: number[] };
  latestJobs: LatestJobItem[];
  lineJobPosts: { labels: string[]; series: SimpleChartSeries[] };
  topFields: {
    top: Array<{ label: string; count: number }>;
    bottom: Array<{ label: string; count: number }>;
  };
};

