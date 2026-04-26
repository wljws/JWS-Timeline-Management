import { generateId } from './utils';
import { Project } from './types';

export const THEME_COLORS = ['blue', 'green', 'orange', 'purple', 'pink', 'slate'];

export const DEFAULT_PHASE_COLORS: Record<string, string> = {
  'Feasibility': '#f97316',
  'Concept Design': '#3b82f6',
  'Schematic Design': '#a855f7',
  'Design Development': '#22c55e',
};

export const COLOR_PALETTES: Record<string, string[]> = {
  blue: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'],
  green: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#052e16'],
  orange: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#431407'],
  purple: ['#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#3b0764'],
  pink: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#500724'],
  slate: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617']
};

export const STANDARD_TEMPLATE_PHASES = [
  { title: 'Feasibility', tasks: [{ text: 'Feasibility Presentation' }, { text: 'Initial Concept Narrative' }, { text: 'Initial Block Planning' }] },
  { title: 'Concept Design', tasks: [{ text: 'Concept Presentation' }, { text: 'Look & Feel Pages' }, { text: 'Colour Plans' }, { text: 'Colour Elevations' }, { text: 'Rendering' }, { text: 'Furniture Selections' }, { text: 'Digital Material Board' }] },
  { title: 'Schematic Design', tasks: [{ text: 'Coordinated Plans (GA, FFP, RCP)' }, { text: 'Revised Elevations' }, { text: 'Digital Material Board' }, { text: 'Table of Materials' }] },
  { title: 'Design Development', tasks: [{ text: 'Architectural Details' }, { text: 'Joinery Details' }, { text: 'Door Details' }, { text: 'Full Specification' }, { text: 'Physical Materials' }] }
];

export const generateDefaultProjects = (): Project[] => ([
  {
    id: 'p1',
    title: 'Project Template',
    color: 'blue',
    isExpanded: true,
    phases: STANDARD_TEMPLATE_PHASES.map((t, i) => ({
      id: `ph_${i}`,
      title: t.title,
      isLocked: false,
      assignees: [],
      start: i === 0 ? new Date(new Date().getFullYear(), new Date().getMonth(), 5) : (i === 1 ? new Date(new Date().getFullYear(), new Date().getMonth(), 25) : null),
      end: i === 0 ? new Date(new Date().getFullYear(), new Date().getMonth(), 20) : (i === 1 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 20) : null),
      tasks: t.tasks.map((taskTemplate, tIdx) => {
        const isAllocated = i === 0 && tIdx === 0;
        const tStart = isAllocated ? new Date(new Date().getFullYear(), new Date().getMonth(), 6) : null;
        const tEnd = isAllocated ? new Date(new Date().getFullYear(), new Date().getMonth(), 8) : null;
        return {
          id: `t_${i}_${tIdx}`,
          text: taskTemplate.text,
          done: false,
          assignees: isAllocated ? ['Alice Design'] : [],
          assignee: '',
          start: tStart,
          end: tEnd,
          allocations: (tStart && tEnd) ? [{ id: generateId(), start: tStart, end: tEnd, subTasks: [] }] : []
        }
      }),
      milestones: []
    }))
  }
]);

export const getPhaseColor = (colorName: string, index: number): string => {
  if (colorName && colorName.startsWith('#')) {
    const p = index % 6;
    if (p === 0) return `color-mix(in srgb, ${colorName} 40%, white)`;
    if (p === 1) return `color-mix(in srgb, ${colorName} 70%, white)`;
    if (p === 2) return colorName;
    if (p === 3) return `color-mix(in srgb, ${colorName} 80%, black)`;
    if (p === 4) return `color-mix(in srgb, ${colorName} 60%, black)`;
    if (p === 5) return `color-mix(in srgb, ${colorName} 40%, black)`;
  }
  const palette = COLOR_PALETTES[colorName] || COLOR_PALETTES.blue;
  return palette[index % palette.length];
};

export const getIndicatorColor = (colorName: string): string => {
  if (colorName && colorName.startsWith('#')) return colorName;
  return COLOR_PALETTES[colorName] ? COLOR_PALETTES[colorName][1] : COLOR_PALETTES.blue[1];
};
