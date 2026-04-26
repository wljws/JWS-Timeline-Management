import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons } from './icons';
import { Project, Phase, Task, Allocation, Milestone, TeamMember, AdHocTask, Collection, ViewMode, Snapshot } from './types';
import { addDays, diffDays, diffExactDays, formatDate, generateId, toYMD, fromYMD, abbreviatePhase, checkTeamOverlap } from './utils';
import { THEME_COLORS, COLOR_PALETTES, STANDARD_TEMPLATE_PHASES, generateDefaultProjects, getPhaseColor, getIndicatorColor, DEFAULT_PHASE_COLORS } from './constants';
import { PhaseModal } from './components/PhaseModal';
import { TeamModal } from './components/TeamModal';
import { HistoryModal } from './components/HistoryModal';
import { ProjectView } from './views/ProjectView';
import { TeamView } from './views/TeamView';
import { OverviewView } from './views/OverviewView';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface TimelineAppProps {
  onLogout: () => void;
  userRole: string;
}

export const TimelineApp: React.FC<TimelineAppProps> = ({ onLogout, userRole }) => {
  const actualIsReadOnly = userRole === 'viewer';
  const [viewingSnapshot, setViewingSnapshot] = useState<Snapshot | null>(null);
  const [stashedLiveData, setStashedLiveData] = useState<any>(null);
  
  const isReadOnly = actualIsReadOnly || !!viewingSnapshot;
  const [viewMode, setViewMode] = useState<ViewMode>('projects'); 
  const [zoomLevel, setZoomLevel] = useState(40); 
  const [leftColWidth, setLeftColWidth] = useState(window.innerWidth < 768 ? 240 : 380); 
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [draggedPhase, setDraggedPhase] = useState<{ projectId: string; phaseIndex: number } | null>(null);
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);
  const [draggedMilestoneIndex, setDraggedMilestoneIndex] = useState<number | null>(null);
  const [draggedTeamMemberName, setDraggedTeamMemberName] = useState<string | null>(null);
  const [draggedTeamItem, setDraggedTeamItem] = useState<any>(null);
  
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [copyProjectMenuId, setCopyProjectMenuId] = useState<string | null>(null);
  const [copyAsSynced, setCopyAsSynced] = useState(false);
  const [showHiddenProjects, setShowHiddenProjects] = useState(false);
  const [copiedScope, setCopiedScope] = useState<Task[] | null>(null);
  const [selectedTaskIdsToCopy, setSelectedTaskIdsToCopy] = useState<Set<string>>(new Set());

  const [modalData, setModalData] = useState<any>(null);
  const [teamModalData, setTeamModalData] = useState<any>(null); 
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Connecting...'); 
  const [saveHistory, setSaveHistory] = useState<Snapshot[]>(() => {
    try {
      const saved = localStorage.getItem('timeline_version_history');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [confirmRestoreIdx, setConfirmRestoreIdx] = useState<number | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [past, setPast] = useState<any[]>([]);
  const [future, setFuture] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Vercel KV Config Fallback for standalone/public access
  const VERCEL_KV_URL = "https://awaited-drake-76193.upstash.io";
  const VERCEL_KV_TOKEN = "gQAAAAAAASmhAAIncDFiOGQ3N2EyNWRmNzM0NzdlOGM4MDVhZWMyY2NiZTJiMXAxNzYxOTM";
  const appId = 'timeline-app-data';

  const [isAltPressed, setIsAltPressed] = useState(false);
  const interactionTimeRef = useRef(0);

  const [collections, setCollections] = useState<Collection[]>([
    {
      id: 'default',
      title: 'Main Master Collection',
      projects: generateDefaultProjects(),
      teamMembers: [
        { name: 'Alice Design', isLocked: false },
        { name: 'Bob Builder', isLocked: false }
      ],
      adHocTasks: [],
      phaseColors: DEFAULT_PHASE_COLORS
    }
  ]);
  const [activeCollectionId, setActiveCollectionId] = useState('default');

  const collectionsRef = useRef(collections);
  const activeCollectionIdRef = useRef(activeCollectionId);
  useEffect(() => { collectionsRef.current = collections; }, [collections]);
  useEffect(() => { activeCollectionIdRef.current = activeCollectionId; }, [activeCollectionId]);

  const activeCollection = useMemo(() => collections.find(c => c.id === activeCollectionId) || collections[0], [collections, activeCollectionId]);
  const projects = activeCollection?.projects || [];
  const teamMembers = activeCollection?.teamMembers || [];
  const adHocTasks = activeCollection?.adHocTasks || [];

  const usedColors = useMemo(() => {
    const colors = new Set(projects.map(p => p.color).filter(Boolean));
    if (colors.size === 0) colors.add('slate');
    return Array.from(colors);
  }, [projects]);

  const uniquePhaseTitles = useMemo(() => {
    const titles = new Set<string>();
    collections.forEach(col => (col.projects || []).forEach(p => p.phases.forEach(ph => titles.add(ph.title))));
    return Array.from(titles).sort();
  }, [collections]);

  const phaseColors = activeCollection?.phaseColors || DEFAULT_PHASE_COLORS;

  const updatePhaseColor = (phaseTitle: string, hexColor: string) => {
    if (isReadOnly) return;
    setCollections(prev => prev.map(c => ({ ...c, phaseColors: { ...(c.phaseColors || DEFAULT_PHASE_COLORS), [phaseTitle]: hexColor } })));
  };

  const recordHistory = () => {
    if (isRemoteUpdate.current || isReadOnly) return;
    const c = collectionsRef.current.find(col => col.id === activeCollectionIdRef.current);
    if (c) {
      setPast(p => [...p, { projects: c.projects || [], adHocTasks: c.adHocTasks || [], teamMembers: c.teamMembers || [] }]);
      setFuture([]);
    }
  };

  const handleUndo = () => {
    if (past.length === 0 || isReadOnly) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const c = collectionsRef.current.find(col => col.id === activeCollectionIdRef.current);
    if (!c) return;

    setFuture(f => [{ projects: c.projects || [], adHocTasks: c.adHocTasks || [], teamMembers: c.teamMembers || [] }, ...f]);
    setPast(newPast);

    setProjects(previous.projects);
    setAdHocTasks(previous.adHocTasks);
    setTeamMembers(previous.teamMembers || []);
  };

  const handleRedo = () => {
    if (future.length === 0 || isReadOnly) return;
    const next = future[0];
    const newFuture = future.slice(1);
    const c = collectionsRef.current.find(col => col.id === activeCollectionIdRef.current);
    if (!c) return;

    setPast(p => [...p, { projects: c.projects || [], adHocTasks: c.adHocTasks || [], teamMembers: c.teamMembers || [] }]);
    setFuture(newFuture);

    setProjects(next.projects);
    setAdHocTasks(next.adHocTasks);
    setTeamMembers(next.teamMembers || []);
  };

  const createManualSnapshot = () => {
    const c = collectionsRef.current.find(col => col.id === activeCollectionIdRef.current);
    if (!c) return;
    const newSnapshot: Snapshot = {
        id: generateId(),
        name: `Manual Snapshot ${new Date().toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        data: { projects: c.projects || [], adHocTasks: c.adHocTasks || [] }
    };
    setSaveHistory(prev => [newSnapshot, ...prev]);
    localStorage.setItem('timeline_version_history', JSON.stringify([newSnapshot, ...saveHistory]));
  };

  useEffect(() => {
    // Weekly automated snapshot check
    const checkWeeklySnapshot = async () => {
      try {
        const lastSnapshotRaw = localStorage.getItem('last_weekly_snapshot');
        const lastSnapshot = lastSnapshotRaw ? parseInt(lastSnapshotRaw, 10) : 0;
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        
        if (now - lastSnapshot > oneWeek && collections.length > 0) {
           const res = await fetch('/api/save-snapshot', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ data: { collections, timestamp: new Date().toISOString() } })
           });
           if (res.ok) {
             localStorage.setItem('last_weekly_snapshot', now.toString());
           }
        }
      } catch(e) {
        console.error("Weekly snapshot failed", e);
      }
    };
    const interval = setInterval(checkWeeklySnapshot, 60000); // Check every minute
    checkWeeklySnapshot();
    return () => clearInterval(interval);
  }, [collections]);

  const setProjects = (newProjectsOrUpdater: Project[] | ((prev: Project[]) => Project[])) => {
    if (isReadOnly) return;
    setCollections(prevCols => {
      const activeCol = prevCols.find(c => c.id === activeCollectionIdRef.current);
      if (!activeCol) return prevCols;
      const currentProjects = activeCol.projects || [];
      const nextProjects = typeof newProjectsOrUpdater === 'function' ? newProjectsOrUpdater(currentProjects) : newProjectsOrUpdater;
      const syncedMap = new Map();
      nextProjects.forEach(p => {
        if (p.syncId) {
          const oldP = currentProjects.find(cp => cp.id === p.id);
          if (!oldP || oldP !== p) syncedMap.set(p.syncId, p);
        }
      });
      return prevCols.map(c => {
        const isTargetActive = c.id === activeCollectionIdRef.current;
        const sourceProjects = isTargetActive ? nextProjects : (c.projects || []);
        const updatedProjects = sourceProjects.map(p => {
          if (p.syncId && syncedMap.has(p.syncId)) {
            const syncedData = syncedMap.get(p.syncId);
            if (p !== syncedData) return { ...syncedData, id: p.id }; 
          }
          return p;
        });
        if (isTargetActive || updatedProjects !== sourceProjects) return { ...c, projects: updatedProjects };
        return c;
      });
    });
  };

  const setAdHocTasks = (newTasksOrUpdater: AdHocTask[] | ((prev: AdHocTask[]) => AdHocTask[])) => {
    if (isReadOnly) return;
    setCollections(prevCols => prevCols.map(c => {
      if (c.id === activeCollectionIdRef.current) {
        const currentTasks = c.adHocTasks || [];
        const nextTasks = typeof newTasksOrUpdater === 'function' ? newTasksOrUpdater(currentTasks) : newTasksOrUpdater;
        return { ...c, adHocTasks: nextTasks };
      }
      return c;
    }));
  };

  const setTeamMembers = (newMembersOrUpdater: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => {
    if (isReadOnly) return;
    setCollections(prevCols => prevCols.map(c => {
      if (c.id === activeCollectionIdRef.current) {
        const currentMembers = c.teamMembers || [];
        const nextMembers = typeof newMembersOrUpdater === 'function' ? newMembersOrUpdater(currentMembers) : newMembersOrUpdater;
        return { ...c, teamMembers: nextMembers };
      }
      return c;
    }));
  };

  const syncTaskDates = (task: Task): Task => {
    if (!task.allocations || task.allocations.length === 0) return { ...task, start: null, end: null };
    let min = task.allocations[0].start;
    let max = task.allocations[0].end;
    task.allocations.forEach(a => {
      if (a.start < min) min = a.start;
      if (a.end > max) max = a.end;
    });
    return { ...task, start: min, end: max };
  };

  const rehydrateProject = (p: any) => ({
    ...p,
    phases: (p.phases || []).map((ph: any) => ({
      ...ph,
      start: ph.start ? new Date(ph.start) : null,
      end: ph.end ? new Date(ph.end) : null,
      milestones: (ph.milestones || []).map((m: Milestone) => ({ ...m, date: m.date ? new Date(m.date) : null })),
      tasks: (ph.tasks || []).map((t: any) => {
        const safeAllocs = (t.allocations || []).length > 0 
          ? t.allocations.map((a: any) => ({ ...a, start: new Date(a.start), end: new Date(a.end) }))
          : (t.start && t.end ? [{ id: generateId(), start: new Date(t.start), end: new Date(t.end), subTasks: [] }] : []);
        return { ...t, start: t.start ? new Date(t.start) : null, end: t.end ? new Date(t.end) : null, assignees: t.assignees || (t.assignee ? [t.assignee] : []), assignee: '', allocations: safeAllocs }
      }),
      teamAllocations: (ph.teamAllocations || []).map((a: any) => ({ ...a, start: new Date(a.start), end: new Date(a.end) }))
    }))
  });

  const applyLoadedData = (data: any, isHistoryRestore = false) => {
    let loadedCollections: any[] = [];
    if (data.collections) {
      loadedCollections = typeof data.collections === 'string' ? JSON.parse(data.collections) : data.collections;
    } else if (data.projects) {
      let parsedProjects = typeof data.projects === 'string' ? JSON.parse(data.projects) : data.projects;
      let parsedMembers = typeof data.teamMembers === 'string' ? JSON.parse(data.teamMembers) : (data.teamMembers || []);
      loadedCollections = [{ id: 'default', title: 'Imported Master Collection', projects: parsedProjects, teamMembers: parsedMembers, adHocTasks: [] }];
    }

    if (loadedCollections && loadedCollections.length > 0) {
      const processedCollections = loadedCollections.map(c => ({
        ...c,
        phaseColors: c.phaseColors || DEFAULT_PHASE_COLORS,
        teamMembers: (c.teamMembers || []).map((m: any) => typeof m === 'string' ? { name: m, isLocked: false } : m),
        adHocTasks: (c.adHocTasks || []).map((t: any) => ({ ...t, start: t.start ? new Date(t.start) : null, end: t.end ? new Date(t.end) : null })),
        projects: (c.projects || []).map(rehydrateProject)
      }));
      setCollections(processedCollections);
      if (isHistoryRestore && data.activeCollectionId) setActiveCollectionId(data.activeCollectionId);
    }
  };

  const lastSavedTimestampRef = useRef(0);
  const isRemoteUpdate = useRef(false);

  // Sync Logic
  useEffect(() => {
    const fetchData = async (isInit = false) => {
      if (isInit) setSyncStatus('Connecting to Cloud...');
      try {
        // Try Server API first
        let data;
        const res = await fetch('/api/history');
        if (res.ok) {
          const json = await res.json();
          data = json.result;
        } else {
          // Fallback: Direct Vercel KV fetch if server fails or is missing
          console.log("Server API unavailable, falling back to direct KV fetch...");
          const kvRes = await fetch(VERCEL_KV_URL, {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${VERCEL_KV_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(["GET", appId])
          });
          if (kvRes.ok) {
            const kvJson = await kvRes.ok ? await kvRes.json() : null;
            data = kvJson?.result;
          }
        }

        if (data) {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (isInit || (parsed.timestamp && parsed.timestamp > lastSavedTimestampRef.current)) {
            if (!viewingSnapshot) {
              isRemoteUpdate.current = true;
              applyLoadedData(parsed);
              lastSavedTimestampRef.current = parsed.timestamp || 0;
            }
          }
        }
        if (isInit) setSyncStatus('Cloud Synced');
      } catch (e) {
        console.error("Sync error:", e);
        if (isInit) {
          setSyncStatus('Local Only');
          const local = localStorage.getItem('timeline_data');
          if (local) applyLoadedData(JSON.parse(local));
        }
      } finally {
        if (isInit) setIsDataLoaded(true);
      }
    };

    fetchData(true);
    const poll = setInterval(() => fetchData(false), 5000); // Poll every 5s for multi-user sync
    return () => clearInterval(poll);
  }, [viewingSnapshot]);

  // Save Logic
  useEffect(() => {
    if (!isDataLoaded || actualIsReadOnly || viewingSnapshot) return;
    if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }

    const timer = setTimeout(async () => {
      setSyncStatus('Saving to Cloud...');
      const ts = Date.now();
      const stateToSave = { collections, timestamp: ts };

      try {
        // Try Server API first
        const res = await fetch('/api/save-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: collections, timestamp: ts })
        });

        if (!res.ok) {
          // Fallback: Direct Vercel KV save
          await fetch(VERCEL_KV_URL, {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${VERCEL_KV_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(["SET", appId, JSON.stringify(stateToSave)])
          });
        }
        
        lastSavedTimestampRef.current = ts;
        setSyncStatus('Cloud Synced');
        setTimeout(() => setSyncStatus('Cloud Synced'), 3000);
      } catch (e) {
        console.error("Cloud save failed:", e);
        setSyncStatus('Local Save Only');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [collections, isDataLoaded, actualIsReadOnly, viewingSnapshot]);


  // Timeline Bounds
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const timelineStart = useMemo(() => new Date(today.getFullYear(), 0, 1), [today]);
  const timelineEnd = useMemo(() => new Date(today.getFullYear() + 2, 11, 31), [today]);
  const totalDays = diffDays(timelineStart, timelineEnd) + 1;
  const gridWidth = totalDays * zoomLevel;
  const weeks = useMemo(() => {
    const ws: any[] = [];
    for (let i = 0; i < totalDays; i += 7) {
      const s = addDays(timelineStart, i);
      ws.push({ start: s, label: `${formatDate(s)}`, daysFromStart: i, weekOfMonth: Math.floor(s.getDate() / 7) + 1 });
    }
    return ws;
  }, [timelineStart, totalDays]);

  const [currentTeamWeekStart, setCurrentTeamWeekStart] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0);
    const day = d.getDay();
    return new Date(d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)));
  });

  const [draggingBlock, setDraggingBlock] = useState<any>(null);

  const handleGridClick = (e: any, projectId: string, phaseId: string) => {
    if (isReadOnly || e.target !== e.currentTarget || viewMode !== 'projects') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const daysFromStart = Math.floor(clickX / zoomLevel);
    const weekIndex = Math.floor(daysFromStart / 7);
    const newStart = addDays(timelineStart, weekIndex * 7);
    const newEnd = addDays(newStart, 6);
    recordHistory();
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p, phases: p.phases.map(ph => {
            if (ph.id === phaseId && !ph.isLocked) return { ...ph, start: newStart, end: newEnd };
            return ph;
          })
        }
      }
      return p;
    }));
  };

  const handleBlockMouseDown = (e: any, projectId: string, phaseId: string, type: string, origStart: Date | null, origEnd: Date | null, taskId: string | null = null, allocationId: string | null = null, isAdHoc = false) => {
    if(!e.touches) e.preventDefault(); 
    e.stopPropagation();
    const phase = projects.find(p => p.id === projectId)?.phases.find(ph => ph.id === phaseId);
    if (phase?.isLocked && !allocationId) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const gridEl = e.currentTarget.closest('.team-row-container');
    console.log("handleBlockMouseDown", viewMode, !!gridEl, gridEl?.getBoundingClientRect().width);
    const ppday = (viewMode === 'team' && gridEl) ? (gridEl.getBoundingClientRect().width / 5) : zoomLevel;
    console.log("ppday calculation", ppday, zoomLevel);
    
    recordHistory();
    let blocksToMove = [];
    if (allocationId && taskId) {
      blocksToMove = [{ projectId, phaseId, taskId, allocationId, origStart, origEnd, isAdHoc }];
    } else if (isAdHoc) {
      blocksToMove = [{ taskId, origStart, origEnd, isAdHoc }];
    } else {
      blocksToMove = [{ projectId, phaseId, origStart: origStart!, origEnd: origEnd!, origTasks: phase?.tasks }];
    }
    setDraggingBlock({ blocksToMove, type, startX: clientX, pixelsPerDay: ppday });
  };

  const [isResizingCol, setIsResizingCol] = useState(false);

  useEffect(() => {
    const handleMove = (e: any) => {
      if (isResizingCol) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setLeftColWidth(Math.max(120, Math.min(800, clientX)));
        return;
      }
      if (!draggingBlock) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - draggingBlock.startX;
      const deltaDays = deltaX / draggingBlock.pixelsPerDay;
      console.log("handleMove", draggingBlock.type, deltaX, deltaDays, draggingBlock.pixelsPerDay);
    if (deltaDays !== 0) {
      setProjects(prev => prev.map(p => ({
        ...p, phases: p.phases.map(ph => {
          const block = draggingBlock.blocksToMove.find((b: any) => b.phaseId === ph.id && (b.projectId ? b.projectId === p.id : true));
          console.log("Project update check", ph.id, !!block, draggingBlock.type);
          if (!block) return ph;
          
          if (draggingBlock.type === 'move' && !block.taskId && !block.allocationId) {
            return { ...ph, start: addDays(block.origStart, deltaDays), end: addDays(block.origEnd, deltaDays) };
          }
          if (draggingBlock.type === 'resize-left' && !block.taskId && !block.allocationId) {
            return { ...ph, start: addDays(block.origStart, deltaDays) };
          }
          if (draggingBlock.type === 'resize-right' && !block.taskId && !block.allocationId) {
            return { ...ph, end: addDays(block.origEnd, deltaDays) };
          }
          
          if (block.taskId && block.allocationId) {
             console.log("Updating allocation", block.allocationId, draggingBlock.type);
             return {
               ...ph,
               teamAllocations: (ph.teamAllocations || []).map(a => {
                 if (a.id !== block.allocationId) return a;
                 console.log("Allocation match found", a.id);
                 let ns = a.start, ne = a.end;
                 if (draggingBlock.type === 'move' || draggingBlock.type === 'move-alloc') {
                   ns = addDays(block.origStart, deltaDays);
                   ne = addDays(block.origEnd, deltaDays);
                 } else if (draggingBlock.type === 'resize-alloc-right') {
                   ne = addDays(block.origEnd, deltaDays);
                 } else if (draggingBlock.type === 'resize-alloc-left') {
                   ns = addDays(block.origStart, deltaDays);
                 }
                 if (ne && ns && ne < ns) ne = ns;
                 return { ...a, start: ns, end: ne };
               })
             };
          }
          return ph;
        })
      })));
      
      setAdHocTasks(prev => prev.map(t => {
        const block = draggingBlock.blocksToMove.find((b: any) => b.isAdHoc && b.taskId === t.id);
        if (!block) return t;
        let ns = t.start || new Date(), ne = t.end || new Date();
        if (draggingBlock.type === 'move' || draggingBlock.type === 'move-alloc') {
          ns = addDays(block.origStart, deltaDays);
          ne = addDays(block.origEnd, deltaDays);
        } else if (draggingBlock.type === 'resize-alloc-right') {
          ne = addDays(block.origEnd, deltaDays);
        } else if (draggingBlock.type === 'resize-alloc-left') {
          ns = addDays(block.origStart, deltaDays);
        }
        if (ne < ns) ne = ns;
        return { ...t, start: ns, end: ne };
      }));
    }
    };
    const handleUp = () => { setIsResizingCol(false); setDraggingBlock(null); };
    if (draggingBlock || isResizingCol) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [draggingBlock, isResizingCol]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isDataLoaded) {
      if (viewMode === 'projects' || viewMode === 'overview') {
        const timer = setTimeout(() => {
          const dayOffset = diffDays(timelineStart, today);
          if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = (dayOffset * zoomLevel) - 200;
        }, 100);
        return () => clearTimeout(timer);
      } else if (viewMode === 'team') {
        const d = new Date(); d.setHours(0,0,0,0);
        const day = d.getDay();
        setCurrentTeamWeekStart(new Date(d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))));
      }
    }
  }, [viewMode, isDataLoaded]);

  const currentLeftWidth = isLeftPanelCollapsed ? (viewMode === 'team' ? 120 : 48) : leftColWidth;
  const toggleProjectExpand = (id: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, isExpanded: !p.isExpanded } : p));
  const updateProjectTitle = (id: string, title: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, title } : p));
  const updateProjectColor = (id: string, color: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, color } : p));

  const handleCopyProject = (projectId: string, targetCollectionId: string, isSynced = false) => {
    if (isReadOnly) return;
    recordHistory();
    const projectToCopy = projects.find(p => p.id === projectId);
    if (!projectToCopy) return;
    let clonedProject;
    if (isSynced) {
      const syncId = projectToCopy.syncId || generateId();
      clonedProject = { ...projectToCopy, id: generateId(), syncId: syncId };
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, syncId } : p));
    } else {
      clonedProject = { ...rehydrateProject(JSON.parse(JSON.stringify(projectToCopy))), id: generateId(), syncId: null, title: `${projectToCopy.title} (Copy)` };
    }
    setCollections(prev => prev.map(c => c.id === targetCollectionId ? { ...c, projects: [...(c.projects || []), clonedProject] } : c));
    setCopyProjectMenuId(null);
    setCopyAsSynced(false);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const target = document.getElementById('main-app-container');
      if (!target) return;
      const canvas = await html2canvas(target, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'l' : 'p', unit: 'pt', format: [canvas.width * 0.75, canvas.height * 0.75] });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);
      pdf.save(`Timeline_${activeCollection.title}.pdf`);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  const exportToJSON = () => {
    const data = JSON.stringify({ collections, activeCollectionId });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Timeline_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        applyLoadedData(parsed, true);
        if (importFileRef.current) importFileRef.current.value = '';
      } catch (err) {
        console.error("Error parsing JSON:", err);
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const onDragStartRow = (e: any, projectId: string) => {
    recordHistory();
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOverRow = (e: any, targetProjectId: string) => {
    e.preventDefault();
    if (!draggedProjectId || draggedProjectId === targetProjectId) return;
    const draggedIdx = projects.findIndex(p => p.id === draggedProjectId);
    const targetIdx = projects.findIndex(p => p.id === targetProjectId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const newProjects = [...projects];
    const [draggedItem] = newProjects.splice(draggedIdx, 1);
    newProjects.splice(targetIdx, 0, draggedItem);
    setProjects(newProjects);
  };
  const onDragEndRow = () => { setDraggedProjectId(null); };

  const onDragStartPhase = (e: any, projectId: string, phaseIndex: number) => {
    e.stopPropagation();
    recordHistory();
    setDraggedPhase({ projectId, phaseIndex });
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOverPhase = (e: any, projectId: string, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedPhase || draggedPhase.projectId !== projectId || draggedPhase.phaseIndex === targetIndex) return;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newPhases = [...p.phases];
        const draggedItem = newPhases[draggedPhase.phaseIndex];
        newPhases.splice(draggedPhase.phaseIndex, 1);
        newPhases.splice(targetIndex, 0, draggedItem);
        return { ...p, phases: newPhases };
      }
      return p;
    }));
    setDraggedPhase({ projectId, phaseIndex: targetIndex });
  };
  const onDragEndPhase = () => { setDraggedPhase(null); };

  const onDragStartTeamItem = (e: any, pId: string, phId: string, task: any, allocId: string | null, start: Date | null, end: Date | null, isAdHoc: boolean) => {
    if (isReadOnly) return;
    setDraggedTeamItem({ pId, phId, task, allocId, start, end, isAdHoc });
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropTeamGrid = (e: any, assigneeName: string, colIndex: number) => {
    console.log("onDropTeamGrid", assigneeName, colIndex, draggedTeamItem);
    if (!draggedTeamItem || isReadOnly) return;
    recordHistory();
    const isAlt = isAltPressed || e.altKey;
    const { pId, phId, task, allocId, isAdHoc, start: origStart, end: origEnd } = draggedTeamItem;
    
    const start = addDays(currentTeamWeekStart, Math.floor(colIndex / 2));
    if (colIndex % 2 !== 0) start.setHours(13, 0, 0, 0); else start.setHours(9, 0, 0, 0);
    
    let duration = 4 * 3600 * 1000;
    if (origStart && origEnd) {
      duration = new Date(origEnd).getTime() - new Date(origStart).getTime();
    }
    const end = new Date(new Date(start).getTime() + duration);

    if (isAdHoc) {
      if (isAlt) {
        setAdHocTasks(prev => [...prev, { ...task, id: generateId(), assignee: assigneeName, start, end }]);
      } else {
        setAdHocTasks(prev => prev.map(t => t.id === task.id ? { ...t, assignee: assigneeName, start, end } : t));
      }
    } else {
      setProjects(prev => prev.map(p => {
        if (p.id !== pId) return p;
        return {
          ...p,
          phases: p.phases.map(ph => {
            if (ph.id !== phId) return ph;
            const newAssignees = [...(ph.assignees || [])];
            if (assigneeName !== 'PROJECT_POOL' && !newAssignees.includes(assigneeName)) {
              newAssignees.push(assigneeName);
            }
            if (allocId && !isAlt) {
              return { ...ph, assignees: newAssignees, teamAllocations: (ph.teamAllocations || []).map(a => a.id === allocId ? { ...a, start, end, assignee: assigneeName } : a) };
            } else {
              return { ...ph, assignees: newAssignees, teamAllocations: [...(ph.teamAllocations || []), { id: generateId(), start, end, subTasks: [], assignee: assigneeName }] };
            }
          })
        };
      }));
    }
    setDraggedTeamItem(null);
  };

  const onDropTeamPool = (e: any, assigneeName: string) => {
    if (!draggedTeamItem || isReadOnly) return;
    recordHistory();
    const { pId, phId, task, allocId, isAdHoc } = draggedTeamItem;
    if (isAdHoc) {
      setAdHocTasks(prev => prev.map(t => t.id === task.id ? { ...t, assignee: assigneeName, start: null, end: null } : t));
    } else if (allocId) {
      setProjects(prev => prev.map(p => (p.id === pId ? { ...p, phases: p.phases.map(ph => (ph.id === phId ? { ...ph, teamAllocations: (ph.teamAllocations || []).filter(a => a.id !== allocId) } : ph)) } : p)));
    }
    setDraggedTeamItem(null);
  };
  const toggleProjectVisibility = (id: string) => { recordHistory(); setProjects(prev => prev.map(p => p.id === id ? { ...p, isHidden: !p.isHidden } : p)); };
  const addProject = () => { recordHistory(); setProjects([...projects, { id: generateId(), title: 'New Project', color: 'blue', isExpanded: true, phases: STANDARD_TEMPLATE_PHASES.map(t => ({ id: generateId(), title: t.title, isLocked: false, start: null, end: null, milestones: [], tasks: t.tasks.map(tt => ({ id: generateId(), text: tt.text, done: false, assignees: [], assignee: '', start: null, end: null, allocations: [] })) })) }]); };
  const deleteProject = (id: string) => { recordHistory(); setProjects(projects.filter(p => p.id !== id)); };
  const addPhase = (pId: string) => { recordHistory(); setProjects(projects.map(p => p.id === pId ? { ...p, isExpanded: true, phases: [...p.phases, { id: generateId(), title: 'New Phase', isLocked: false, assignees: [], start: null, end: null, tasks: [], milestones: [] }] } : p)); };
  const removePhase = (pId: string, phId: string) => { recordHistory(); setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.filter(ph => ph.id !== phId) } : p)); if (modalData?.phase.id === phId) setModalData(null); };
  const toggleLock = (pId: string, phId: string) => { setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, isLocked: !ph.isLocked } : ph) } : p)); };
  
  const editPhaseTitle = (pId: string, phId: string, title: string) => { setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, title } : ph) } : p)); if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, title } }); };
  const updatePhaseAssignees = (pId: string, phId: string, assignees: string[]) => {
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, assignees } : ph) } : p));
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, assignees } });
  };
  const updatePhaseDates = (pId: string, phId: string, start: string, end: string) => {
    const s = fromYMD(start); const e = fromYMD(end);
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, start: s, end: e } : ph) } : p));
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, start: s, end: e } });
  };

  const addPhaseMilestone = (pId: string, phId: string) => { recordHistory(); const m = { id: generateId(), date: new Date(), label: 'New Milestone' }; setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, milestones: [...(ph.milestones || []), m] } : ph) } : p)); if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, milestones: [...(modalData.phase.milestones || []), m] } }); };
  const updatePhaseMilestoneLabel = (pId: string, phId: string, mId: string, label: string) => { setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, milestones: ph.milestones.map(ms => ms.id === mId ? { ...ms, label } : ms) } : ph) } : p)); if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, milestones: modalData.phase.milestones.map((ms: any) => ms.id === mId ? { ...ms, label } : ms) } }); };
  const updatePhaseMilestoneDate = (pId: string, phId: string, mId: string, date: string) => { const d = fromYMD(date); setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, milestones: ph.milestones.map(ms => ms.id === mId ? { ...ms, date: d! } : ms) } : ph) } : p)); if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, milestones: modalData.phase.milestones.map((ms: any) => ms.id === mId ? { ...ms, date: d! } : ms) } }); };
  const removePhaseMilestone = (pId: string, phId: string, mId: string) => { recordHistory(); setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, milestones: ph.milestones.filter(ms => ms.id !== mId) } : ph) } : p)); if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, milestones: modalData.phase.milestones.filter((ms: any) => ms.id !== mId) } }); };

  const updateTasksInState = (tasks: Task[]) => {
    setProjects(projects.map(p => p.id === modalData.projectId ? { ...p, phases: p.phases.map(ph => ph.id === modalData.phase.id ? { ...ph, tasks } : ph) } : p));
    setModalData({ ...modalData, phase: { ...modalData.phase, tasks } });
  };
  const addTask = () => { recordHistory(); updateTasksInState([...modalData.phase.tasks, { id: generateId(), text: 'New Task', done: false, assignees: [], assignee: '', start: null, end: null, allocations: [] }]); };
  const toggleTask = (tId: string) => updateTasksInState(modalData.phase.tasks.map((t: Task) => t.id === tId ? { ...t, done: !t.done } : t));
  const updateTaskText = (tId: string, text: string) => updateTasksInState(modalData.phase.tasks.map((t: Task) => t.id === tId ? { ...t, text } : t));
  const deleteTask = (tId: string) => { recordHistory(); updateTasksInState(modalData.phase.tasks.filter((t: Task) => t.id !== tId)); };
  const updateTaskAssignees = (tId: string, assignees: string[]) => updateTasksInState(modalData.phase.tasks.map((t: Task) => t.id === tId ? { ...t, assignees, assignee: '' } : t));
  const updateTaskDates = (tId: string, start: string, end: string) => {
    const s = fromYMD(start); const e = fromYMD(end); if (e) e.setHours(23,59,59,999);
    updateTasksInState(modalData.phase.tasks.map((t: Task) => t.id === tId ? syncTaskDates({ ...t, start: s, end: e, allocations: s && e ? [{ id: generateId(), start: s, end: e, subTasks: [] }] : [] }) : t));
  };
  
  const teamViewData = useMemo(() => {
    if (viewMode !== 'team') return [];
    const map = new Map<string, any>();
    const weekEnd = addDays(currentTeamWeekStart, 5);
    map.set('PROJECT_POOL', { name: 'PROJECT_POOL', scheduled: [], pool: [] });
    teamMembers.forEach(m => map.set(m.name, { name: m.name, scheduled: [], pool: [] }));
    
    projects.filter(p => !p.isHidden).forEach(p => {
      // Add project to the central top pool
      if (p.phases.length > 0) {
        map.get('PROJECT_POOL').pool.push({
          name: 'PROJECT_POOL',
          isAdHoc: false,
          project: p,
          phase: p.phases[0],
          task: { id: `phase-task-${p.phases[0].id}`, text: 'Project' },
          hasAllocation: p.phases.some(ph => (ph.teamAllocations || []).length > 0)
        });
      }

      const userAddedToProject = new Set<string>();
      
      p.phases.forEach(ph => {
        const names = (ph.assignees && ph.assignees.length > 0) ? ph.assignees : [];
        names.forEach(n => {
          if (!map.has(n)) map.set(n, { name: n, scheduled: [], pool: [] });
          const a = map.get(n);
          // Pool shows the project once per person
          if (!userAddedToProject.has(n)) {
            a.pool.push({ name: n, isAdHoc: false, project: p, phase: ph, task: { id: `phase-task-${ph.id}`, text: 'Project' }, hasAllocation: (ph.teamAllocations || []).length > 0 });
            userAddedToProject.add(n);
          }
          
          // Schedule shows the phase allocations
          (ph.teamAllocations || []).forEach(alloc => {
            if ((!alloc.assignee || alloc.assignee === n) && alloc.start < weekEnd && alloc.end > currentTeamWeekStart) {
              const hrS = (Math.max(new Date(alloc.start).getTime(), currentTeamWeekStart.getTime()) - currentTeamWeekStart.getTime()) / (1000 * 3600);
              const hrE = (Math.min(new Date(alloc.end).getTime(), weekEnd.getTime() - 1) - currentTeamWeekStart.getTime()) / (1000 * 3600);
              const startCol = Math.max(0, Math.min(9, Math.floor(hrS / 24) * 2 + (hrS % 24 >= 12 ? 1 : 0)));
              const endCol = Math.max(1, Math.min(10, Math.ceil(hrE / 12)));
              a.scheduled.push({ isAdHoc: false, project: p, phase: ph, task: { id: `phase-task-${ph.id}`, text: ph.title }, allocation: alloc, startCol, span: Math.max(1, endCol - startCol) });
            }
          });
        });
      });
    });
    adHocTasks.forEach(t => {
      const n = t.assignee || 'PROJECT_POOL'; if (!map.has(n)) map.set(n, { name: n, scheduled: [], pool: [] });
      const a = map.get(n); if (!t.done) a.pool.push({ isAdHoc: true, task: t, project: { title: t.projectTitle, color: t.color, id: 'adhoc' }, phase: { id: 'adhoc' }, hasAllocation: !!t.start });
      if (t.start && t.end && t.end > currentTeamWeekStart && t.start < weekEnd) {
        const hrS = (Math.max(new Date(t.start).getTime(), currentTeamWeekStart.getTime()) - currentTeamWeekStart.getTime()) / (1000 * 3600);
        const hrE = (Math.min(new Date(t.end).getTime(), weekEnd.getTime() - 1) - currentTeamWeekStart.getTime()) / (1000 * 3600);
        const sc = Math.max(0, Math.min(9, Math.floor(hrS / 24) * 2 + (hrS % 24 >= 12 ? 1 : 0)));
        const ec = Math.max(1, Math.min(10, Math.ceil(hrE / 12)));
        a.scheduled.push({ isAdHoc: true, task: t, allocation: { id: t.id, start: t.start, end: t.end, subTasks: t.subTasks }, project: { color: t.color, title: t.projectTitle, id: 'adhoc' }, phase: { id: 'adhoc' }, startCol: sc, span: Math.max(1, ec - sc) });
      }
    });

    // Ensure we return PROJECT_POOL first
    const poolData = map.get('PROJECT_POOL');
    map.delete('PROJECT_POOL');
    return [poolData, ...Array.from(map.values())].filter(Boolean);
  }, [projects, adHocTasks, currentTeamWeekStart, teamMembers, viewMode]);

  const overviewData = useMemo(() => {
    if (viewMode !== 'overview') return [];
    return collections.map(col => ({
      collectionId: col.id, collectionTitle: col.title,
      projects: (col.projects || []).filter(p => showHiddenProjects || !p.isHidden).map(p => {
        let s: Date | null = null; let e: Date | null = null;
        p.phases.forEach(ph => { if (ph.start && (!s || ph.start < s)) s = ph.start; if (ph.end && (!e || ph.end > e)) e = ph.end; });
        return { ...p, calculatedStart: s!, calculatedEnd: e!, collectionName: col.title };
      }).filter(p => !!p.calculatedStart)
    })).filter(c => c.projects.length > 0);
  }, [collections, viewMode, showHiddenProjects]);

  return (
    <div id="main-app-container" className="flex flex-col h-[100dvh] w-full absolute inset-0 overflow-hidden bg-slate-50">
      {viewingSnapshot && (
        <div className="flex-shrink-0 bg-amber-500 text-white px-4 py-2 flex flex-col md:flex-row md:justify-between items-center z-[100] relative text-sm font-medium shadow-md gap-2">
          <div className="flex items-center gap-2">
            <Icons.Eye /> You are currently viewing a read-only snapshot: {viewingSnapshot.name}
          </div>
          <button onClick={() => setViewingSnapshot(null)} className="bg-black/20 hover:bg-black/30 px-3 py-1 rounded transition-colors text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            Return to Live Timeline
          </button>
        </div>
      )}

      <div className="flex-shrink-0 bg-slate-900 text-white px-2 py-1.5 md:px-4 md:py-2 shadow-md flex flex-col lg:flex-row justify-between items-center z-50 relative gap-1.5 md:gap-2">
        <div className="relative group/collection z-50 flex items-center">
          <div className="flex flex-col text-center lg:text-left justify-center">
            <div className="flex items-center justify-center lg:justify-start gap-1 cursor-pointer" onClick={() => !isReadOnly && setShowCollectionDropdown(!showCollectionDropdown)}>
              <input 
                type="text" 
                value={activeCollection?.title || ''} 
                onChange={(e) => setCollections(prev => prev.map(c => c.id === activeCollectionId ? { ...c, title: e.target.value } : c))}
                readOnly={isReadOnly}
                className="bg-transparent text-base md:text-lg font-bold border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none transition-colors w-64 leading-tight"
                placeholder="Collection Name"
              />
              {!isReadOnly && <Icons.ChevronDown />}
            </div>
          </div>
          
          {showCollectionDropdown && !isReadOnly && (
            <div className="absolute top-full left-0 pt-1.5 w-64 z-50 text-left">
              <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-md py-1">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 mb-1">Navigation</div>
                <div
                  onClick={() => { setViewMode('overview'); setShowCollectionDropdown(false); }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-700 flex items-center gap-2 ${viewMode === 'overview' ? 'text-blue-400 font-bold' : 'text-slate-200'}`}
                >
                  <Icons.Eye className="w-4 h-4" />
                  <span className="truncate">OVERVIEW: All Projects</span>
                  {viewMode === 'overview' && <Icons.CloudCheck />}
                </div>
                
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-y border-slate-700 my-1">Collections</div>
                {collections.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setViewMode('projects'); setActiveCollectionId(c.id); setShowCollectionDropdown(false); }}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-700 flex items-center justify-between ${c.id === activeCollectionId && viewMode !== 'overview' ? 'text-blue-400 font-bold' : 'text-slate-200'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icons.Layout className="w-4 h-4" />
                      <span className="truncate">{c.title}</span>
                    </div>
                    {c.id === activeCollectionId && viewMode !== 'overview' && <Icons.CloudCheck />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-1.5 w-full lg:w-auto">
          <div className="flex bg-slate-800 rounded p-0.5">
            <button onClick={() => setViewMode('projects')} className={`px-2 py-1 rounded text-[10px] md:text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === 'projects' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icons.Layout className="w-3 h-3"/> Projects
            </button>
            <button onClick={() => setViewMode('team')} className={`px-2 py-1 rounded text-[10px] md:text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === 'team' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icons.Users className="w-3 h-3"/> Team View
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 rounded px-1.5 py-0.5">
            <div className={`px-2 py-1 flex items-center gap-1 text-[10px] md:text-xs font-medium ${syncStatus === 'Synced' ? 'text-green-400' : 'text-slate-400'}`}>
              {syncStatus === 'Saving...' ? <Icons.Spinner /> : <Icons.CloudCheck />} 
              <span className="hidden md:inline">{syncStatus}</span>
            </div>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
            <button onClick={createManualSnapshot} className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1 text-[10px] md:text-xs font-medium" title="Create Snapshot">
              <Icons.Camera /> <span className="hidden md:inline">Snap</span>
            </button>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
            <button onClick={() => setShowHistoryModal(true)} className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1 text-[10px] md:text-xs font-medium" title="Version History">
              <Icons.History /> <span className="hidden md:inline">History</span>
            </button>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
            <button onClick={() => setShowSettings(!showSettings)} className={`p-1 rounded flex items-center gap-1 text-[10px] md:text-xs font-medium transition-colors ${showSettings ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`} title="Timeline Settings">
              <Icons.Target className="w-3.5 h-3.5" /> <span className="hidden md:inline">Settings</span>
            </button>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
            <button onClick={exportToPDF} disabled={isExporting} className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1 text-[10px] md:text-xs font-medium transition-colors" title="Export as PDF">
              {isExporting ? <Icons.Spinner /> : <Icons.Download />} <span className="hidden md:inline">PDF</span>
            </button>
          </div>

          <button onClick={onLogout} className="text-xs font-medium text-slate-300 hover:text-white px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded transition-colors ml-1 mr-1" title="Log Out">
            Logout
          </button>

          {!isReadOnly && (
            <div className="flex items-center gap-1 border-x border-slate-700 px-2 mx-1">
              <button onClick={handleUndo} disabled={past.length === 0} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors" title="Undo">
                <Icons.Undo />
              </button>
              <button onClick={handleRedo} disabled={future.length === 0} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors" title="Redo">
                <Icons.Redo />
              </button>
            </div>
          )}

          {(viewMode === 'projects' || viewMode === 'overview') && (
            <div className="flex items-center gap-1.5 md:gap-2">
              <button 
                onClick={() => {
                  const dayOffset = diffDays(timelineStart, today);
                  if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = (dayOffset * zoomLevel) - 200;
                }}
                className="text-[10px] md:text-xs text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1 transition-colors font-medium"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <span className="text-[9px] md:text-[10px] text-slate-400 hidden md:inline uppercase font-bold tracking-wider">Zoom</span>
                <input 
                  type="range" min="5" max="100" value={zoomLevel} onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-16 md:w-20 accent-blue-500"
                />
              </div>
              {!isReadOnly && viewMode === 'projects' && (
                <button onClick={addProject} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-medium transition-colors">
                  <Icons.Plus /> Add Project
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="flex-shrink-0 bg-white border-b border-slate-200 p-4 shadow-sm z-40 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Icons.Target className="w-4 h-4 text-blue-600" /> Phase Color Configuration
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Assign specific colors to phases by their label</p>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              {uniquePhaseTitles.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No phases found in current projects</span>
              ) : (
                uniquePhaseTitles.map(title => (
                  <div key={title} className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-200">
                    <span className="text-xs text-slate-700 font-bold whitespace-nowrap">{title}</span>
                    <input 
                      type="color" 
                      value={phaseColors[title] || '#cbd5e1'} 
                      onChange={(e) => updatePhaseColor(title, e.target.value)}
                      disabled={isReadOnly}
                      className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                    />
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowSettings(false)} className="bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors self-start md:self-center">
              <Icons.X />
            </button>
          </div>
        </div>
      )}

      {viewMode === 'projects' && (
        <ProjectView
          visibleProjects={projects.filter(p => showHiddenProjects || !p.isHidden)}
          currentLeftWidth={currentLeftWidth} gridWidth={gridWidth} weeks={weeks} zoomLevel={zoomLevel}
          timelineStart={timelineStart} today={today} totalDays={totalDays}
          isLeftPanelCollapsed={isLeftPanelCollapsed} setIsLeftPanelCollapsed={setIsLeftPanelCollapsed}
          setIsResizingCol={setIsResizingCol} scrollContainerRef={scrollContainerRef} isReadOnly={isReadOnly}
          draggedProjectId={draggedProjectId} onDragStartRow={onDragStartRow} onDragOverRow={onDragOverRow} onDragEndRow={onDragEndRow}
          toggleProjectExpand={toggleProjectExpand} updateProjectColor={updateProjectColor} updateProjectTitle={updateProjectTitle}
          addPhase={addPhase} copyProjectMenuId={copyProjectMenuId} setCopyProjectMenuId={setCopyProjectMenuId}
          copyAsSynced={copyAsSynced} setCopyAsSynced={setCopyAsSynced} handleCopyProject={handleCopyProject}
          collections={collections} activeCollectionId={activeCollectionId} deleteProject={deleteProject}
          toggleProjectVisibility={toggleProjectVisibility} handleBlockMouseDown={handleBlockMouseDown} handleBlockClick={(e, pId, phase, idx) => setModalData({ projectId: pId, phase, colorIndex: idx })}
          selectedPhaseIds={selectedPhaseIds} toggleProjectSelection={() => {}} togglePhaseSelection={(id) => setSelectedPhaseIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
          editPhaseTitle={editPhaseTitle} updatePhaseAssignees={updatePhaseAssignees} toggleLock={toggleLock} removePhase={removePhase}
          draggedPhase={draggedPhase} onDragStartPhase={onDragStartPhase} onDragOverPhase={onDragOverPhase} onDragEndPhase={onDragEndPhase}
          handleGridClick={handleGridClick} addProject={addProject} showHiddenProjects={showHiddenProjects} setShowHiddenProjects={setShowHiddenProjects} hiddenCount={projects.filter(p => p.isHidden).length}
          phaseColors={phaseColors}
        />
      )}
      {viewMode === 'team' && (
        <TeamView
          teamViewData={teamViewData} currentLeftWidth={currentLeftWidth} isLeftPanelCollapsed={isLeftPanelCollapsed}
          setIsLeftPanelCollapsed={setIsLeftPanelCollapsed} isReadOnly={isReadOnly} currentTeamWeekStart={currentTeamWeekStart}
          jumpToEarliestTask={() => {}} prevWeek={() => setCurrentTeamWeekStart(addDays(currentTeamWeekStart, -7))}
          nextWeek={() => setCurrentTeamWeekStart(addDays(currentTeamWeekStart, 7))} today={today}
          draggedTeamMemberName={draggedTeamMemberName} onDragStartTeamMember={() => {}} onDragOverTeamMember={() => {}} onDragEndTeamMember={() => {}}
          teamMembers={teamMembers} editingMember={{ oldName: null, newName: '' }} setEditingMember={() => {}}
          updateTeamMemberName={() => {}} toggleTeamMemberLock={() => {}} handleRemoveTeamMember={() => {}}
          isAddingTeamMember={false} setIsAddingTeamMember={() => {}} newTeamMemberName="" setNewTeamMemberName={() => {}}
          handleAddTeamMember={() => {}} addAdHocTask={(name) => {
            recordHistory();
            setAdHocTasks(prev => [...prev, {
              id: generateId(), projectTitle: 'Manual Task', color: 'slate', text: 'New Task',
              assignee: name, start: null, end: null, done: false, subTasks: [], isAdHoc: true
            }]);
          }} onDragStartTeamItem={onDragStartTeamItem}
          setDraggedTeamItem={setDraggedTeamItem} onDropTeamGrid={onDropTeamGrid} onDropTeamPool={onDropTeamPool}
          handleTeamBlockClick={(e, pId, phId, tId, aId, ad) => setTeamModalData({ projectId: pId, phaseId: phId, taskId: tId, allocationId: aId, isAdHoc: ad })}
          handleBlockMouseDown={handleBlockMouseDown} handleDeleteFromPool={(item) => {
            recordHistory();
            if (item.isAdHoc) {
              if (item.allocation) {
                setAdHocTasks(prev => prev.map(t => t.id === item.task.id ? { ...t, start: null, end: null } : t));
              } else {
                setAdHocTasks(prev => prev.filter(t => t.id !== item.task.id));
              }
            } else {
               if (item.allocation) {
                 setProjects(prev => prev.map(p => p.id === item.project.id ? {
                   ...p, phases: p.phases.map(ph => ph.id === item.phase.id ? { ...ph, teamAllocations: (ph.teamAllocations || []).filter(a => a.id !== item.allocation.id) } : ph)
                 } : p));
               } else {
                 setProjects(prev => prev.map(p => p.id === item.project.id ? {
                   ...p, phases: p.phases.map(ph => ph.id === item.phase.id ? { ...ph, assignees: ph.assignees.filter((n: string) => n !== item.name) } : ph)
                 } : p));
               }
            }
          }}
          setCurrentTeamWeekStart={setCurrentTeamWeekStart}
        />
      )}
      {viewMode === 'overview' && (
        <OverviewView
          overviewData={overviewData} currentLeftWidth={currentLeftWidth} gridWidth={gridWidth} weeks={weeks}
          zoomLevel={zoomLevel} timelineStart={timelineStart} today={today} totalDays={totalDays}
          isLeftPanelCollapsed={isLeftPanelCollapsed} setIsLeftPanelCollapsed={setIsLeftPanelCollapsed}
          setIsResizingCol={() => {}} scrollContainerRef={scrollContainerRef}
          phaseColors={phaseColors}
        />
      )}

      {modalData && (
        <PhaseModal
          modalData={modalData} activeProject={projects.find(p => p.id === modalData.projectId)!} isReadOnly={isReadOnly}
          selectedTaskIdsToCopy={selectedTaskIdsToCopy} setSelectedTaskIdsToCopy={setSelectedTaskIdsToCopy}
          copiedScope={copiedScope} setCopiedScope={setCopiedScope} setModalData={setModalData}
          editPhaseTitle={editPhaseTitle} updatePhaseAssignees={updatePhaseAssignees} updatePhaseDates={updatePhaseDates} addPhaseMilestone={addPhaseMilestone}
          updatePhaseMilestoneLabel={updatePhaseMilestoneLabel} updatePhaseMilestoneDate={updatePhaseMilestoneDate}
          removePhaseMilestone={removePhaseMilestone} toggleTask={toggleTask} addTask={addTask}
          updateTaskText={updateTaskText} updateTaskAssignees={updateTaskAssignees} updateTaskDates={updateTaskDates}
          deleteTask={deleteTask} removePhase={removePhase} recordHistory={recordHistory} updateTasksInState={updateTasksInState}
          teamMembers={teamMembers} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId}
          onDragStartTask={() => {}} onDragOverTask={() => {}} onDragEndTask={() => {}}
          onDragStartMilestone={() => {}} onDragOverMilestone={() => {}} onDragEndMilestone={() => {}}
          draggedTaskIndex={null} draggedMilestoneIndex={null} interactionTimeRef={interactionTimeRef}
        />
      )}

      {teamModalData && (
        <TeamModal
          teamModalData={teamModalData} isReadOnly={isReadOnly} projects={projects} adHocTasks={adHocTasks}
          setTeamModalData={setTeamModalData} updateAdHocTaskProjectTitle={() => {}} updateAdHocTaskText={() => {}}
          updateAdHocTaskColor={() => {}} updateAdHocTaskDone={() => {}} toggleSubTask={() => {}}
          addSubTask={() => {}} updateSubTaskText={() => {}} deleteSubTask={() => {}} deleteAdHocTask={() => {}} usedColors={usedColors}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          setShowHistoryModal={setShowHistoryModal} setConfirmRestoreIdx={setConfirmRestoreIdx}
          confirmRestoreIdx={confirmRestoreIdx} saveHistory={saveHistory} actualIsReadOnly={actualIsReadOnly}
          importFileRef={importFileRef} handleImportJSON={handleImportJSON} exportToJSON={exportToJSON}
          handleViewSnapshot={(s) => setViewingSnapshot(s)} handleExitSnapshotView={() => setViewingSnapshot(null)} viewingSnapshot={viewingSnapshot}
          applyLoadedData={applyLoadedData} deleteSnapshot={(e, id) => {
            e.stopPropagation();
            const newList = saveHistory.filter(s => s.id !== id);
            setSaveHistory(newList);
            localStorage.setItem('timeline_version_history', JSON.stringify(newList));
          }}
        />
      )}
    </div>
  );
};
