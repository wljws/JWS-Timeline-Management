export interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

export interface Allocation {
  id: string;
  start: Date;
  end: Date;
  subTasks: SubTask[];
  assignee?: string;
}

export interface Milestone {
  id: string;
  date: Date;
  label: string;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  assignees: string[];
  assignee: string; // Legacy field
  start: Date | null;
  end: Date | null;
  allocations: Allocation[];
  isAdHoc?: boolean;
}

export interface Phase {
  id: string;
  title: string;
  isLocked: boolean;
  start: Date | null;
  end: Date | null;
  assignees: string[];
  tasks: Task[];
  teamAllocations?: Allocation[];
  milestones: Milestone[];
}

export interface Project {
  id: string;
  title: string;
  color: string;
  isExpanded: boolean;
  isHidden?: boolean;
  syncId?: string | null;
  phases: Phase[];
}

export interface TeamMember {
  name: string;
  isLocked: boolean;
}

export interface AdHocTask {
  id: string;
  text: string;
  projectTitle: string;
  assignee: string;
  start: Date | null;
  end: Date | null;
  subTasks: SubTask[];
  isAdHoc: boolean;
  done: boolean;
  color: string;
}

export interface Collection {
  id: string;
  title: string;
  projects: Project[];
  teamMembers: TeamMember[];
  adHocTasks: AdHocTask[];
  phaseColors?: Record<string, string>;
}

export type ViewMode = 'projects' | 'team' | 'overview';

export interface Snapshot {
  id: string;
  timestamp: string;
  name: string;
  data: any;
}
