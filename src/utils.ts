import { Project, AdHocTask } from './types';

export const addDays = (date: Date | string | number, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.floor(days));
  // If there's a fractional part, add it separately via time (for sub-day accuracy if needed)
  if (days % 1 !== 0) {
    return new Date(d.getTime() + (days % 1) * 24 * 60 * 60 * 1000);
  }
  return d;
};

export const diffDays = (date1: Date | string | number, date2: Date | string | number): number => {
  const d1 = new Date(date1);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(date2);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

export const countVisibleDays = (start: Date | string | number, end: Date | string | number, hideWeekends: boolean): number => {
  if (!hideWeekends) return diffDays(start, end) + 1;
  
  let count = 0;
  const curr = new Date(start);
  curr.setHours(0,0,0,0);
  const finish = new Date(end);
  finish.setHours(0,0,0,0);
  
  while (curr <= finish) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) count++;
    curr.setDate(curr.getDate() + 1);
  }
  return count;
};

export const getDayOffset = (timelineStart: Date, targetDate: Date, hideWeekends: boolean): number => {
  if (!hideWeekends) return diffDays(timelineStart, targetDate);
  
  let count = 0;
  const curr = new Date(timelineStart);
  curr.setHours(0,0,0,0);
  const target = new Date(targetDate);
  target.setHours(0,0,0,0);
  
  if (target < curr) {
    // Basic reverse handle if needed, though usually timeline only goes forward
    while (curr > target) {
      const day = curr.getDay();
      if (day !== 0 && day !== 6) count--;
      curr.setDate(curr.getDate() - 1);
    }
    return count;
  }

  while (curr < target) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) count++;
    curr.setDate(curr.getDate() + 1);
  }
  return count;
};

export const getDateFromOffset = (timelineStart: Date, offset: number, hideWeekends: boolean): Date => {
  if (!hideWeekends) return addDays(timelineStart, offset);
  
  const curr = new Date(timelineStart);
  curr.setHours(0,0,0,0);
  let count = 0;
  
  if (offset >= 0) {
    while (count < offset) {
      curr.setDate(curr.getDate() + 1);
      const day = curr.getDay();
      if (day !== 0 && day !== 6) count++;
    }
  } else {
    while (count > offset) {
      curr.setDate(curr.getDate() - 1);
      const day = curr.getDay();
      if (day !== 0 && day !== 6) count--;
    }
  }
  return curr;
};

export const diffExactDays = (date1: Date | string | number, date2: Date | string | number): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
};

export const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const toYMD = (d: Date | null): string => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
};

export const fromYMD = (str: string): Date | null => {
  if (!str) return null;
  const [y, m, d] = str.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

export const abbreviatePhase = (text: string): string => {
  if (!text) return '';
  const words = text.trim().split(/[\s-]+/);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
};

export const checkTeamOverlap = (
  projectsData: Project[],
  adHocData: AdHocTask[],
  targetAssignees: string[],
  start: Date,
  end: Date,
  excludeAllocId: string | null,
  excludeAdHocId: string | null
): boolean => {
  if (!targetAssignees || targetAssignees.length === 0 || !start || !end) return false;

  for (const p of projectsData) {
    for (const ph of p.phases) {
      for (const t of ph.tasks) {
        const tAssignees = t.assignees || (t.assignee ? [t.assignee] : []);
        const isIntersecting = targetAssignees.some(a => tAssignees.includes(a));
        if (isIntersecting) {
          for (const a of t.allocations || []) {
            if (excludeAllocId && a.id === excludeAllocId) continue;
            if (start < new Date(a.end) && end > new Date(a.start)) {
              return true;
            }
          }
        }
      }
    }
  }

  for (const t of adHocData) {
    if (excludeAdHocId && t.id === excludeAdHocId) continue;
    if (!t.start || !t.end) continue;
    const tAssignee = t.assignee || 'Unassigned';
    if (targetAssignees.includes(tAssignee)) {
      if (start < new Date(t.end) && end > new Date(t.start)) {
        return true;
      }
    }
  }

  return false;
};
