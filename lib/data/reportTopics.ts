import reportTopicsData from './report-topics.json';

export interface ReportTopic {
  id: string;
  label: string;
  description?: string;
}

interface ReportTopicsData {
  topics: ReportTopic[];
}

const data: ReportTopicsData = reportTopicsData;

export function getAllReportTopics(): ReportTopic[] {
  return data.topics;
}

export function isValidReportTopic(topic: string): topic is ReportTopic['id'] {
  return data.topics.some((item) => item.id === topic);
}

export const reportTopicSet: ReadonlySet<string> = new Set(
  data.topics.map((item) => item.id)
);
