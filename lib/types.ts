export const EPIC_STATUS = ["Requirement", "Development", "User Testing", "Deploy", "Hold"] as const;
export const STORY_PROGRESS = ["Todo", "In Dev", "Done"] as const;
export const RELEASE_STATUS = ["-", "Merging to UAT", "Deployed"] as const;
export const DOC_TYPES = ["TAT", "QCR", "DR", "Testing Result", "UAT Sign Off", "Lainnya"] as const;

export type EpicStatus = (typeof EPIC_STATUS)[number];
export type StoryProgress = (typeof STORY_PROGRESS)[number];
export type ReleaseStatus = (typeof RELEASE_STATUS)[number];
export type DocType = (typeof DOC_TYPES)[number];

export type Epic = {
  id: string;
  name: string;
  jira_key: string | null;
  status: EpicStatus;
  start_date: string | null;
  end_date: string | null;
  est_deploy: string | null;
  notes: string | null;
};

export type Story = {
  id: string;
  epic_id: string | null;
  task_group: string | null;
  title: string;
  jira_key: string | null;
  story_points: number | null;
  sprint: number | null;
  start_date: string | null;
  end_date: string | null;
  progress: StoryProgress;
  release_id: string | null;
  release_status: ReleaseStatus;
  jira_status: string | null;
  synced_at: string | null;
};

export type Release = {
  id: string;
  fix_version: string;
  deploy_date: string | null;
  folder_url: string | null;
  notes: string | null;
};

export type ReleaseDoc = {
  id: string;
  release_id: string;
  doc_type: DocType;
  url: string;
};

export type Flag = {
  id: string;
  name: string;
  epic_id: string | null;
  description: string | null;
  dev: boolean | null;
  uat: boolean | null;
  prod: boolean | null;
  jira_key: string | null;
};

export type SyncRun = {
  id: string;
  ran_at: string;
  jql: string | null;
  epics_upsert: number;
  stories_upsert: number;
  status: string;
  message: string | null;
};

export type Tracker = {
  epics: Epic[];
  stories: Story[];
  releases: Release[];
  docs: ReleaseDoc[];
  flags: Flag[];
};

export const EMPTY_TRACKER: Tracker = { epics: [], stories: [], releases: [], docs: [], flags: [] };

/** Base URL Jira buat bikin link dari issue key. */
export const JIRA_BROWSE =
  (process.env.NEXT_PUBLIC_JIRA_BASE_URL || "https://incubation.atlassian.net") + "/browse/";
