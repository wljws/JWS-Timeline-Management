import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons } from './icons';
import { Project, Phase, Task, Allocation, Milestone, TeamMember, AdHocTask, Collection, ViewMode, Snapshot } from './types';
import { addDays, diffDays, diffExactDays, formatDate, generateId, toYMD, fromYMD, abbreviatePhase, checkTeamOverlap, countVisibleDays, getDayOffset, getDateFromOffset } from './utils';
import { THEME_COLORS, COLOR_PALETTES, STANDARD_TEMPLATE_PHASES, generateDefaultProjects, getPhaseColor, getIndicatorColor, DEFAULT_PHASE_COLORS } from './constants';
import { PhaseModal } from './components/PhaseModal';
import { TeamModal } from './components/TeamModal';
import { HistoryModal, formatSnapshotDateTime } from './components/HistoryModal';
import { PDFExportModal } from './components/PDFExportModal';
import { ProjectView } from './views/ProjectView';
import { TeamView } from './views/TeamView';
import { OverviewView } from './views/OverviewView';
import { OccasionThemeId, getThemeById, OCCASION_THEMES } from './themes';
import { SeasonalThemeOverlay } from './components/SeasonalThemeOverlay';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { ThemeHeaderGraphic, ThemeHeaderGarland } from './components/ThemeDecorations';
import { TimelineAnimatedCharacters } from './components/TimelineAnimatedCharacters';
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
  const isAdmin = userRole === 'admin';
  const [viewMode, setViewMode] = useState<ViewMode>('projects'); 
  const [zoomLevel, setZoomLevel] = useState(5); 
  const [hideWeekends, setHideWeekends] = useState(true);
  const [leftColWidth, setLeftColWidth] = useState(window.innerWidth < 768 ? 160 : 380); 
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [globalLocked, setGlobalLocked] = useState(false);
  
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
  const [showHiddenTeamMembers, setShowHiddenTeamMembers] = useState(false);
  const [copiedScope, setCopiedScope] = useState<Task[] | null>(null);
  const [selectedTaskIdsToCopy, setSelectedTaskIdsToCopy] = useState<Set<string>>(new Set());

  const [modalData, setModalData] = useState<any>(null);
  const [teamModalData, setTeamModalData] = useState<any>(null); 
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reviewsReminderExpanded, setReviewsReminderExpanded] = useState(true);
  
  const [isExporting, setIsExporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Connecting...'); 
  const [saveHistory, setSaveHistory] = useState<Snapshot[]>(() => {
    try {
      const saved = localStorage.getItem('timeline_version_history');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  
  // Seasonal & Holiday Theme Mode State
  const [themeId, setThemeId] = useState<OccasionThemeId>(() => {
    try {
      const saved = localStorage.getItem('timeline_theme_occasion');
      return (saved as OccasionThemeId) || 'default';
    } catch(e) { return 'default'; }
  });
  const [animationEnabled, setAnimationEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('timeline_theme_animation_enabled');
      return saved !== 'false';
    } catch(e) { return true; }
  });
  const [animationIntensity, setAnimationIntensity] = useState<'low' | 'medium' | 'high'>(() => {
    try {
      const saved = localStorage.getItem('timeline_theme_animation_intensity');
      return (saved as 'low' | 'medium' | 'high') || 'medium';
    } catch(e) { return 'medium'; }
  });
  const [showThemeModal, setShowThemeModal] = useState(false);

  const currentTheme = useMemo(() => getThemeById(themeId), [themeId]);

  const handleSelectTheme = (newThemeId: OccasionThemeId) => {
    setThemeId(newThemeId);
    try {
      localStorage.setItem('timeline_theme_occasion', newThemeId);
    } catch(e) {}
  };

  const handleToggleAnimation = (enabled: boolean) => {
    setAnimationEnabled(enabled);
    try {
      localStorage.setItem('timeline_theme_animation_enabled', enabled ? 'true' : 'false');
    } catch(e) {}
  };

  const handleChangeIntensity = (intensity: 'low' | 'medium' | 'high') => {
    setAnimationIntensity(intensity);
    try {
      localStorage.setItem('timeline_theme_animation_intensity', intensity);
    } catch(e) {}
  };

  const renderThemeIcon = (iconName: string, className: string = "w-3.5 h-3.5") => {
    switch (iconName) {
      case 'Snowflake':
        return <Icons.Snowflake className={className} />;
      case 'Flame':
        return <Icons.Flame className={className} />;
      case 'Crown':
        return <Icons.Crown className={className} />;
      case 'Ghost':
        return <Icons.Ghost className={className} />;
      case 'Flower':
        return <Icons.Flower className={className} />;
      case 'Sun':
        return <Icons.Sun className={className} />;
      case 'Clover':
        return <Icons.Clover className={className} />;
      default:
        return <Icons.Sparkles className={className} />;
    }
  };
  const [autoSnapshotSettings, setAutoSnapshotSettings] = useState<'off' | 'daily' | 'weekly'>(() => {
    try {
      const saved = localStorage.getItem('timeline_auto_snapshot_settings');
      return (saved as any) || 'off';
    } catch(e) { return 'off'; }
  });
  const [editingMember, setEditingMember] = useState<{ oldName: string | null; newName: string }>({ oldName: null, newName: '' });
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [newTeamMemberName, setNewTeamMemberName] = useState('');

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

  const createManualSnapshot = (customName?: string) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const defaultName = `Snapshot (${formattedDate}, ${formattedTime})`;
    const snapshotName = customName && customName.trim() ? customName.trim() : defaultName;

    const newSnapshot: Snapshot = {
      id: generateId(),
      name: snapshotName,
      timestamp: now.toISOString(),
      data: {
        collections: JSON.parse(JSON.stringify(collectionsRef.current)),
        activeCollectionId: activeCollectionIdRef.current,
        timestamp: now.toISOString(),
      }
    };

    setSaveHistory(prev => {
      const next = [newSnapshot, ...prev];
      try {
        localStorage.setItem('timeline_version_history', JSON.stringify(next));
      } catch(e) {
        console.error("Failed to save history", e);
      }
      return next;
    });

    // Also attempt server snapshot save
    fetch('/api/save-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: newSnapshot.data })
    }).catch(err => console.warn("Cloud snapshot save error:", err));
  };

  const deleteSnapshot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (actualIsReadOnly) return;
    const newHistory = saveHistory.filter(s => s.id !== id);
    setSaveHistory(newHistory);
    try {
      localStorage.setItem('timeline_version_history', JSON.stringify(newHistory));
    } catch(e) {}
  };

  useEffect(() => {
    // Automated snapshot check
    const checkAutoSnapshot = async () => {
      try {
        if (autoSnapshotSettings === 'off') return;
        
        const lastSnapshotRaw = localStorage.getItem('last_auto_snapshot');
        const lastSnapshot = lastSnapshotRaw ? parseInt(lastSnapshotRaw, 10) : 0;
        const now = Date.now();
        const interval = autoSnapshotSettings === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        
        if (now - lastSnapshot > interval && collectionsRef.current.length > 0) {
          const nowDate = new Date();
          const formattedDate = nowDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
          const formattedTime = nowDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          
          const newSnapshot: Snapshot = {
            id: generateId(),
            name: `Auto ${autoSnapshotSettings.charAt(0).toUpperCase() + autoSnapshotSettings.slice(1)} Snapshot (${formattedDate}, ${formattedTime})`,
            timestamp: nowDate.toISOString(),
            data: {
              collections: JSON.parse(JSON.stringify(collectionsRef.current)),
              activeCollectionId: activeCollectionIdRef.current,
              timestamp: nowDate.toISOString()
            }
          };
          
          setSaveHistory(prev => {
            const next = [newSnapshot, ...prev].slice(0, 50); // Keep last 50
            try {
              localStorage.setItem('timeline_version_history', JSON.stringify(next));
            } catch(e) {}
            return next;
          });
          
          localStorage.setItem('last_auto_snapshot', now.toString());
          
          // Also backup to server if possible
          await fetch('/api/save-snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: newSnapshot.data })
          });
        }
      } catch(e) {
        console.error("Auto snapshot failed", e);
      }
    };
    const checkInterval = setInterval(checkAutoSnapshot, 60000 * 5); // Check every 5 minutes
    checkAutoSnapshot();
    return () => clearInterval(checkInterval);
  }, [autoSnapshotSettings]);

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
      internalReviews: (ph.internalReviews || []).map((m: Milestone) => ({ ...m, date: m.date ? new Date(m.date) : null })),
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
    if (!data) return;
    let loadedCollections: any[] = [];
    let targetActiveId: string | null = null;

    if (Array.isArray(data)) {
      loadedCollections = data;
    } else if (data.collections) {
      loadedCollections = typeof data.collections === 'string' ? JSON.parse(data.collections) : data.collections;
      if (data.activeCollectionId) targetActiveId = data.activeCollectionId;
    } else if (data.projects) {
      let parsedProjects = typeof data.projects === 'string' ? JSON.parse(data.projects) : data.projects;
      let parsedMembers = typeof data.teamMembers === 'string' ? JSON.parse(data.teamMembers) : (data.teamMembers || []);
      let parsedAdHoc = typeof data.adHocTasks === 'string' ? JSON.parse(data.adHocTasks) : (data.adHocTasks || []);
      loadedCollections = [{
        id: 'default',
        title: 'Master Collection',
        projects: parsedProjects,
        teamMembers: parsedMembers,
        adHocTasks: parsedAdHoc,
        phaseColors: data.phaseColors || DEFAULT_PHASE_COLORS
      }];
    }

    if (loadedCollections && loadedCollections.length > 0) {
      const processedCollections: Collection[] = loadedCollections.map(c => ({
        id: c.id || generateId(),
        title: c.title || 'Collection',
        phaseColors: c.phaseColors || DEFAULT_PHASE_COLORS,
        teamMembers: (c.teamMembers || []).map((m: any) => typeof m === 'string' ? { name: m, isLocked: false } : m),
        adHocTasks: (c.adHocTasks || []).map((t: any) => ({
          ...t,
          start: t.start ? new Date(t.start) : null,
          end: t.end ? new Date(t.end) : null,
          subTasks: t.subTasks || []
        })),
        projects: (c.projects || []).map(rehydrateProject)
      }));
      setCollections(processedCollections);
      if (targetActiveId && processedCollections.some(c => c.id === targetActiveId)) {
        setActiveCollectionId(targetActiveId);
      } else if (processedCollections.length > 0) {
        if (!processedCollections.some(c => c.id === activeCollectionIdRef.current)) {
          setActiveCollectionId(processedCollections[0].id);
        }
      }
    }
  };

  const handleViewSnapshot = (snapshot: Snapshot) => {
    if (!viewingSnapshot) {
      // Stash the live state before viewing historical snapshot
      setStashedLiveData({
        collections: JSON.parse(JSON.stringify(collectionsRef.current)),
        activeCollectionId: activeCollectionIdRef.current,
        timestamp: lastSavedTimestampRef.current
      });
    }
    setViewingSnapshot(snapshot);
    applyLoadedData(snapshot.data, false);
    setShowHistoryModal(false);
  };

  const handleExitSnapshotView = () => {
    if (stashedLiveData) {
      applyLoadedData(stashedLiveData, true);
      setStashedLiveData(null);
    }
    setViewingSnapshot(null);
  };

  const handleRestoreSnapshot = (snapshotData: any) => {
    applyLoadedData(snapshotData, true);
    setStashedLiveData(null);
    setViewingSnapshot(null);
    setConfirmRestoreIdx(null);
    setShowHistoryModal(false);
    
    // Save to local storage and queue cloud save
    const ts = Date.now();
    lastSavedTimestampRef.current = ts;
    try {
      localStorage.setItem('timeline_data', JSON.stringify({
        collections: collectionsRef.current,
        timestamp: ts
      }));
    } catch(e) {}
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
        const contentType = res.headers.get("content-type");
        
        if (res.ok && contentType && contentType.includes("application/json")) {
          const json = await res.json();
          data = json.result;
        } else {
          // Fallback: Direct Vercel KV fetch if server fails or returns HTML (likely index.html on 404)
          if (!res.ok) console.warn(`Server API returned status ${res.status}, falling back...`);
          else if (contentType && !contentType.includes("application/json")) {
            console.warn("Server API returned non-JSON response (likely HTML index), falling back to direct KV...");
          }
          
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
  const timelineStart = useMemo(() => {
    const d = new Date(today.getFullYear(), 0, 1);
    const day = d.getDay(); 
    // Snap to previous Monday: if Sunday (0) go back 6, if Mon (1) go back 0, if Tue (2) go back 1...
    const diff = (day === 0 ? -6 : 1 - day); 
    return addDays(d, diff);
  }, [today]);
  const timelineEnd = useMemo(() => new Date(today.getFullYear() + 2, 11, 31), [today]);
  const totalDays = useMemo(() => diffDays(timelineStart, timelineEnd) + 1, [timelineStart, timelineEnd]);
  const gridWidth = useMemo(() => countVisibleDays(timelineStart, timelineEnd, hideWeekends) * zoomLevel, [timelineStart, timelineEnd, hideWeekends, zoomLevel]);
  const weeks = useMemo(() => {
    const ws: any[] = [];
    for (let i = 0; i < totalDays; i += 7) {
      const s = addDays(timelineStart, i);
      const e = addDays(s, 6);
      ws.push({ 
        start: s, 
        end: e,
        label: `${formatDate(s)} - ${formatDate(e)}`, 
        daysFromStart: i, 
        weekOfMonth: Math.floor(s.getDate() / 7) + 1 
      });
    }
    return ws;
  }, [timelineStart, totalDays]);

  const [currentTeamWeekStart, setCurrentTeamWeekStart] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0);
    const day = d.getDay();
    return new Date(d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)));
  });

  const currentLeftWidth = isLeftPanelCollapsed ? (viewMode === 'team' ? 120 : 48) : leftColWidth;

  const [hasAutoZoomedTeam, setHasAutoZoomedTeam] = useState(false);
  useEffect(() => {
    if (viewMode === 'team' && !hasAutoZoomedTeam && isDataLoaded) {
      const availableWidth = window.innerWidth - currentLeftWidth - 40; 
      const newZoom = Math.max(5, Math.min(100, Math.floor(availableWidth / 25)));
      setZoomLevel(newZoom);
      setHasAutoZoomedTeam(true);
    }
  }, [viewMode, isDataLoaded, hasAutoZoomedTeam, currentLeftWidth]);

  const [draggingBlock, setDraggingBlock] = useState<any>(null);

  const handleGridClick = (e: any, projectId: string, phaseId: string) => {
    if (isReadOnly || e.target !== e.currentTarget || viewMode !== 'projects') return;
    const project = projects.find(p => p.id === projectId);
    if (globalLocked || project?.isLocked) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const daysOffset = Math.floor(clickX / zoomLevel);
    const clickedDate = getDateFromOffset(timelineStart, daysOffset, hideWeekends);
    
    // Default 1 week behavior
    const newStart = clickedDate;
    const newEnd = addDays(newStart, 6);
    recordHistory();
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p, phases: p.phases.map(ph => {
            if (ph.id === phaseId) return { ...ph, start: newStart, end: newEnd };
            return ph;
          })
        }
      }
      return p;
    }));
  };

  const handleBlockMouseDown = (e: any, projectId: string, phaseId: string, type: string, origStart: Date | null, origEnd: Date | null, taskId: string | null = null, allocationId: string | null = null, isAdHoc = false, assigneeName: string | null = null) => {
    if(!e.touches) e.preventDefault(); 
    e.stopPropagation();
    if (!isAdmin) return; // Only admin can drag/resize
    const project = projects.find(p => p.id === projectId);
    const phase = project?.phases.find(ph => ph.id === phaseId);
    if ((globalLocked || project?.isLocked) && !allocationId) return;
    if (globalLocked && allocationId) return; // Add this line to lock team blocks too
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const gridEl = e.currentTarget.closest('.team-row-container');
    const ppday = (viewMode === 'team' && gridEl) ? (gridEl.getBoundingClientRect().width / 5) : zoomLevel;
    
    recordHistory();
    let blocksToMove = [];
    if (allocationId && taskId) {
      blocksToMove = [{ projectId, phaseId, taskId, allocationId, origStart, origEnd, isAdHoc, assigneeName }];
    } else if (isAdHoc) {
      blocksToMove = [{ taskId, origStart, origEnd, isAdHoc, assigneeName }];
    } else {
      // Check if the current phase being dragged is part of a selection
      if (selectedPhaseIds.has(phaseId)) {
        // If it is, move all selected phases together (only if they have dates)
        blocksToMove = projects.flatMap(p => 
          p.phases.filter(ph => selectedPhaseIds.has(ph.id) && ph.start && ph.end).map(ph => ({
            projectId: p.id,
            phaseId: ph.id,
            origStart: ph.start!,
            origEnd: ph.end!,
            origMilestones: ph.milestones || [],
            origInternalReviews: ph.internalReviews || [],
            origTasks: ph.tasks || [],
            origAllocations: ph.teamAllocations || []
          }))
        );
      } else {
        // Otherwise just move the single phase
        blocksToMove = [{ 
          projectId, 
          phaseId, 
          origStart: origStart!, 
          origEnd: origEnd!, 
          origMilestones: phase?.milestones || [],
          origInternalReviews: phase?.internalReviews || [],
          origTasks: phase?.tasks || [],
          origAllocations: phase?.teamAllocations || []
        }];
      }
    }
    setDraggingBlock({ blocksToMove, type, startX: clientX, pixelsPerDay: ppday });
  };

  const [isResizingCol, setIsResizingCol] = useState(false);
  const [isPoolCollapsed, setIsPoolCollapsed] = useState(false);
  const resizeRaf = useRef<number | null>(null);

  useEffect(() => {
    const handleMove = (e: any) => {
      if (isResizingCol) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        if (resizeRaf.current) cancelAnimationFrame(resizeRaf.current);
        resizeRaf.current = requestAnimationFrame(() => {
          setLeftColWidth(Math.round(Math.max(120, Math.min(800, clientX))));
        });
        return;
      }
      if (!draggingBlock) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - draggingBlock.startX;
      const deltaDays = deltaX / draggingBlock.pixelsPerDay;
      const snappedDelta = viewMode === 'team' ? Math.round(deltaDays * 2) / 2 : Math.round(deltaDays);
      if (snappedDelta !== 0 || deltaDays !== 0) {
        if (resizeRaf.current) cancelAnimationFrame(resizeRaf.current);
        resizeRaf.current = requestAnimationFrame(() => {
          // Collision detection helper
          const isOverlap = (start: Date, end: Date, currentAssignee: string, ignoreAllocId: string) => {
            if (!currentAssignee || currentAssignee === 'PROJECT_POOL') return false;
            
            // Check other project allocations for this user
            for (const p of projects) {
              for (const ph of p.phases) {
                for (const a of (ph.teamAllocations || [])) {
                  if (a.id === ignoreAllocId) continue;
                  if (a.assignee === currentAssignee) {
                    if (start < a.end && end > a.start) return true;
                  }
                }
              }
            }
            // Check adhoc tasks for this user
            for (const t of adHocTasks) {
              if (t.id === ignoreAllocId) continue;
              if (t.assignee === currentAssignee && t.start && t.end) {
                if (start < t.end && end > t.start) return true;
              }
            }
            return false;
          };

          setProjects(prev => prev.map(p => ({
            ...p, phases: p.phases.map(ph => {
              const block = draggingBlock.blocksToMove.find((b: any) => b.phaseId === ph.id && (b.projectId ? b.projectId === p.id : true));
              if (!block) return ph;
              
              if (draggingBlock.type === 'move' && !block.taskId && !block.allocationId) {
                const startOffset = getDayOffset(timelineStart, block.origStart, hideWeekends);
                const endOffset = getDayOffset(timelineStart, block.origEnd, hideWeekends);
                const newStart = getDateFromOffset(timelineStart, startOffset + snappedDelta, hideWeekends);
                const newEnd = getDateFromOffset(timelineStart, endOffset + snappedDelta, hideWeekends);
                
                 const shiftedMilestones = (block.origMilestones || []).map((m: any) => ({
                  ...m,
                  date: getDateFromOffset(timelineStart, getDayOffset(timelineStart, m.date, hideWeekends) + snappedDelta, hideWeekends)
                }));
                
                const shiftedInternalReviews = (block.origInternalReviews || []).map((m: any) => ({
                  ...m,
                  date: getDateFromOffset(timelineStart, getDayOffset(timelineStart, m.date, hideWeekends) + snappedDelta, hideWeekends)
                }));
                
                const shiftedTasks = (block.origTasks || []).map((t: any) => ({
                  ...t,
                  start: t.start ? getDateFromOffset(timelineStart, getDayOffset(timelineStart, t.start, hideWeekends) + snappedDelta, hideWeekends) : null,
                  end: t.end ? getDateFromOffset(timelineStart, getDayOffset(timelineStart, t.end, hideWeekends) + snappedDelta, hideWeekends) : null,
                  allocations: (t.allocations || []).map((a: any) => ({
                    ...a,
                    start: getDateFromOffset(timelineStart, getDayOffset(timelineStart, a.start, hideWeekends) + snappedDelta, hideWeekends),
                    end: getDateFromOffset(timelineStart, getDayOffset(timelineStart, a.end, hideWeekends) + snappedDelta, hideWeekends)
                  }))
                }));
                
                const shiftedAllocations = (block.origAllocations || []).map((a: any) => ({
                  ...a,
                  start: getDateFromOffset(timelineStart, getDayOffset(timelineStart, a.start, hideWeekends) + snappedDelta, hideWeekends),
                  end: getDateFromOffset(timelineStart, getDayOffset(timelineStart, a.end, hideWeekends) + snappedDelta, hideWeekends)
                }));
                
                return { ...ph, start: newStart, end: newEnd, milestones: shiftedMilestones, internalReviews: shiftedInternalReviews, tasks: shiftedTasks, teamAllocations: shiftedAllocations };
              }
              if (draggingBlock.type === 'resize-left' && !block.taskId && !block.allocationId) {
                const startOffset = getDayOffset(timelineStart, block.origStart, hideWeekends);
                return { ...ph, start: getDateFromOffset(timelineStart, startOffset + snappedDelta, hideWeekends) };
              }
              if (draggingBlock.type === 'resize-right' && !block.taskId && !block.allocationId) {
                const endOffset = getDayOffset(timelineStart, block.origEnd, hideWeekends);
                return { ...ph, end: getDateFromOffset(timelineStart, endOffset + snappedDelta, hideWeekends) };
              }
              
              if (block.taskId && block.allocationId) {
                return {
                  ...ph,
                  teamAllocations: (ph.teamAllocations || []).map(a => {
                    if (a.id !== block.allocationId) return a;
                    let ns = a.start, ne = a.end;
                    const startOffset = getDayOffset(timelineStart, block.origStart, hideWeekends);
                    const endOffset = getDayOffset(timelineStart, block.origEnd, hideWeekends);

                    if (draggingBlock.type === 'move' || draggingBlock.type === 'move-alloc') {
                      ns = getDateFromOffset(timelineStart, startOffset + snappedDelta, hideWeekends);
                      ne = getDateFromOffset(timelineStart, endOffset + snappedDelta, hideWeekends);
                    } else if (draggingBlock.type === 'resize-alloc-right') {
                      ne = getDateFromOffset(timelineStart, endOffset + snappedDelta, hideWeekends);
                    } else if (draggingBlock.type === 'resize-alloc-left') {
                      ns = getDateFromOffset(timelineStart, startOffset + snappedDelta, hideWeekends);
                    }
                    if (ne && ns && ne < ns) ne = ns;
                    
                    // Apply collision constraint
                    if (isOverlap(ns, ne, block.assigneeName, block.allocationId)) return a;

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
            const startOffset = getDayOffset(timelineStart, block.origStart, hideWeekends);
            const endOffset = getDayOffset(timelineStart, block.origEnd, hideWeekends);

            if (draggingBlock.type === 'move' || draggingBlock.type === 'move-alloc') {
              ns = getDateFromOffset(timelineStart, startOffset + snappedDelta, hideWeekends);
              ne = getDateFromOffset(timelineStart, endOffset + snappedDelta, hideWeekends);
            } else if (draggingBlock.type === 'resize-alloc-right') {
              ne = getDateFromOffset(timelineStart, endOffset + snappedDelta, hideWeekends);
            } else if (draggingBlock.type === 'resize-alloc-left') {
              ns = getDateFromOffset(timelineStart, startOffset + snappedDelta, hideWeekends);
            }
            if (ne < ns) ne = ns;

            // Apply collision constraint
            if (isOverlap(ns, ne, block.assigneeName, t.id)) return t;

            return { ...t, start: ns, end: ne };
          }));
        });
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
          const dayOffset = getDayOffset(timelineStart, today, hideWeekends);
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

  const toggleProjectExpand = (id: string) => {
    setCollections(prevCols => prevCols.map(c => {
      if (c.id === activeCollectionIdRef.current) {
        return { ...c, projects: (c.projects || []).map(p => p.id === id ? { ...p, isExpanded: !p.isExpanded } : p) };
      }
      return c;
    }));
  };

  const toggleAllProjects = (expanded: boolean) => {
    setCollections(prevCols => prevCols.map(c => {
      if (c.id === activeCollectionIdRef.current) {
        return { ...c, projects: (c.projects || []).map(p => ({ ...p, isExpanded: expanded })) };
      }
      return c;
    }));
  };
  const updateProjectTitle = (id: string, title: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, title } : p));
  const updateProjectColor = (id: string, color: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, color } : p));

  const cloneAndRegenerateProjectIds = (p: any) => {
    return {
      ...p,
      id: generateId(),
      syncId: null,
      title: p.title.endsWith('(Copy)') ? p.title : `${p.title} (Copy)`,
      phases: (p.phases || []).map((ph: any) => {
        const newPhaseId = generateId();
        return {
          ...ph,
          id: newPhaseId,
          start: ph.start ? new Date(ph.start) : null,
          end: ph.end ? new Date(ph.end) : null,
          milestones: (ph.milestones || []).map((m: any) => ({
            ...m,
            id: generateId(),
            date: m.date ? new Date(m.date) : null
          })),
          internalReviews: (ph.internalReviews || []).map((m: any) => ({
            ...m,
            id: generateId(),
            date: m.date ? new Date(m.date) : null
          })),
          tasks: (ph.tasks || []).map((t: any) => ({
            ...t,
            id: generateId(),
            start: t.start ? new Date(t.start) : null,
            end: t.end ? new Date(t.end) : null,
            allocations: (t.allocations || []).map((a: any) => ({
              ...a,
              id: generateId(),
              start: a.start ? new Date(a.start) : null,
              end: a.end ? new Date(a.end) : null,
              subTasks: (a.subTasks || []).map((s: any) => ({
                ...s,
                id: generateId()
              }))
            }))
          })),
          teamAllocations: (ph.teamAllocations || []).map((a: any) => ({
            ...a,
            id: generateId(),
            start: a.start ? new Date(a.start) : null,
            end: a.end ? new Date(a.end) : null,
            subTasks: (a.subTasks || []).map((s: any) => ({
              ...s,
              id: generateId()
            }))
          }))
        };
      })
    };
  };

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
      clonedProject = cloneAndRegenerateProjectIds(projectToCopy);
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
  const lastDragUpdate = useRef(0);
  const onDragOverRow = (e: any, targetProjectId: string) => {
    e.preventDefault();
    if (!draggedProjectId || draggedProjectId === targetProjectId) return;
    
    // Throttle updates to 16ms (approx 60fps) to prevent lag
    const now = Date.now();
    if (now - lastDragUpdate.current < 16) return;
    lastDragUpdate.current = now;

    const draggedIdx = projects.findIndex(p => p.id === draggedProjectId);
    const targetIdx = projects.findIndex(p => p.id === targetProjectId);
    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;
    
    const newProjects = [...projects];
    const [draggedItem] = newProjects.splice(draggedIdx, 1);
    newProjects.splice(targetIdx, 0, draggedItem);
    setProjects(newProjects);
  };
  const onDragStartTeamMember = (e: any, name: string) => {
    if (isReadOnly) return;
    setDraggedTeamMemberName(name);
  };

  const onDragOverTeamMember = (e: any, targetName: string) => {
    e.preventDefault();
    if (!draggedTeamMemberName || draggedTeamMemberName === targetName || isReadOnly) return;
    const fromIdx = teamMembers.findIndex(m => m.name === draggedTeamMemberName);
    const toIdx = teamMembers.findIndex(m => m.name === targetName);
    if (fromIdx !== -1 && toIdx !== -1) {
      const newList = [...teamMembers];
      const [item] = newList.splice(fromIdx, 1);
      newList.splice(toIdx, 0, item);
      setTeamMembers(newList);
    }
  };

  const onDragEndTeamMember = () => { setDraggedTeamMemberName(null); };

  const handleAddTeamMember = () => {
    if (!newTeamMemberName.trim() || isReadOnly) return;
    recordHistory();
    setTeamMembers([...teamMembers, { name: newTeamMemberName.trim(), isLocked: false }]);
    setNewTeamMemberName('');
    setIsAddingTeamMember(false);
  };

  const handleRemoveTeamMember = (name: string) => {
    if (isReadOnly) return;
    recordHistory();
    setTeamMembers(teamMembers.filter(m => m.name !== name));
    setAdHocTasks(prev => prev.map(t => t.assignee === name ? { ...t, assignee: 'PROJECT_POOL' } : t));
    setProjects(prev => prev.map(p => ({
      ...p,
      phases: p.phases.map(ph => ({
        ...ph,
        assignees: (ph.assignees || []).filter((n: string) => n !== name),
        teamAllocations: (ph.teamAllocations || []).map(a => a.assignee === name ? { ...a, assignee: 'PROJECT_POOL' } : a)
      }))
    })));
  };

  const updateTeamMemberName = (oldName: string, newName: string) => {
    if (isReadOnly || !newName.trim() || oldName === newName) return;
    recordHistory();
    const cleanNewName = newName.trim();
    setTeamMembers(teamMembers.map(m => m.name === oldName ? { ...m, name: cleanNewName } : m));
    setAdHocTasks(prev => prev.map(t => t.assignee === oldName ? { ...t, assignee: cleanNewName } : t));
    setProjects(prev => prev.map(p => ({
      ...p,
      phases: p.phases.map(ph => ({
        ...ph,
        assignees: (ph.assignees || []).map((n: string) => n === oldName ? cleanNewName : n),
        teamAllocations: (ph.teamAllocations || []).map(a => a.assignee === oldName ? { ...a, assignee: cleanNewName } : a)
      }))
    })));
  };

  const toggleTeamMemberLock = (name: string) => {
    if (isReadOnly) return;
    setTeamMembers(teamMembers.map(m => m.name === name ? { ...m, isLocked: !m.isLocked } : m));
  };

  const toggleTeamMemberVisibility = (name: string) => {
    if (isReadOnly) return;
    recordHistory();
    setTeamMembers(teamMembers.map(m => m.name === name ? { ...m, isHidden: !m.isHidden } : m));
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

    // Throttle updates
    const now = Date.now();
    if (now - lastDragUpdate.current < 16) return;
    lastDragUpdate.current = now;

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
    
    // Force half-day duration (4 hours) if it's a new drop or doesn't have a duration
    let duration = 4 * 3600 * 1000;
    if (origStart && origEnd && !isAlt) {
      duration = new Date(origEnd).getTime() - new Date(origStart).getTime();
    }
    const end = new Date(new Date(start).getTime() + duration);

    if (isAdHoc) {
      const isFromPool = !task.assignee || task.assignee === 'PROJECT_POOL';
      if (isAlt || isFromPool) {
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
  const addProject = () => { recordHistory(); setProjects([...projects, { id: generateId(), title: 'New Project', color: 'blue', isExpanded: true, isLocked: false, phases: STANDARD_TEMPLATE_PHASES.map(t => ({ id: generateId(), title: t.title, start: null, end: null, milestones: [], internalReviews: [], tasks: t.tasks.map(tt => ({ id: generateId(), text: tt.text, done: false, assignees: [], assignee: '', start: null, end: null, allocations: [] })) })) }]); };
  const deleteProject = (id: string) => { recordHistory(); setProjects(projects.filter(p => p.id !== id)); };
  const addPhase = (pId: string) => { recordHistory(); setProjects(projects.map(p => p.id === pId ? { ...p, isExpanded: true, phases: [...p.phases, { id: generateId(), title: 'New Phase', assignees: [], start: null, end: null, tasks: [], milestones: [], internalReviews: [] }] } : p)); };
  const removePhase = (pId: string, phId: string) => { recordHistory(); setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.filter(ph => ph.id !== phId) } : p)); if (modalData?.phase.id === phId) setModalData(null); };
  const toggleLock = (pId: string) => { 
    if (!isAdmin) return;
    setProjects(projects.map(p => {
      if (p.id === pId) {
        return { ...p, isLocked: !p.isLocked };
      }
      return p;
    }));
  };
  
  const toggleGlobalLock = () => {
    if (!isAdmin) return;
    setGlobalLocked(!globalLocked);
  };
  
  const editPhaseTitle = (pId: string, phId: string, title: string) => { setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, title } : ph) } : p)); if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, title } }); };
  const updatePhaseAssignees = (pId: string, phId: string, assignees: string[]) => {
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, assignees } : ph) } : p));
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, assignees } });
  };
  const updatePhaseDates = (pId: string, phId: string, start: string, end: string) => {
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;
    
    const s = fromYMD(start); const e = fromYMD(end);
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, start: s, end: e } : ph) } : p));
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, start: s, end: e } });
  };

  const addPhaseMilestone = (pId: string, phId: string) => { 
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;
    
    recordHistory(); 
    const m = { id: generateId(), date: new Date(), label: 'New Milestone' }; 
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, milestones: [...(ph.milestones || []), m] } : ph) } : p)); 
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, milestones: [...(modalData.phase.milestones || []), m] } }); 
  };
  const updatePhaseMilestoneLabel = (pId: string, phId: string, mId: string, label: string) => { 
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;

    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, milestones: ph.milestones.map(ms => ms.id === mId ? { ...ms, label } : ms) } : ph) } : p)); 
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, milestones: modalData.phase.milestones.map((ms: any) => ms.id === mId ? { ...ms, label } : ms) } }); 
  };
  const updatePhaseMilestoneDate = (pId: string, phId: string, mId: string, date: string) => { 
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;

    const d = fromYMD(date); 
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, milestones: ph.milestones.map(ms => ms.id === mId ? { ...ms, date: d! } : ms) } : ph) } : p)); 
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, milestones: modalData.phase.milestones.map((ms: any) => ms.id === mId ? { ...ms, date: d! } : ms) } }); 
  };
  const removePhaseMilestone = (pId: string, phId: string, mId: string) => { 
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;

    recordHistory(); 
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, milestones: ph.milestones.filter(ms => ms.id !== mId) } : ph) } : p)); 
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, milestones: modalData.phase.milestones.filter((ms: any) => ms.id !== mId) } }); 
  };

  const addPhaseInternalReview = (pId: string, phId: string) => { 
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;

    recordHistory(); 
    const ir = { id: generateId(), date: new Date(), label: 'New Internal Review' }; 
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, internalReviews: [...(ph.internalReviews || []), ir] } : ph) } : p)); 
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, internalReviews: [...(modalData.phase.internalReviews || []), ir] } }); 
  };
  const updatePhaseInternalReviewLabel = (pId: string, phId: string, irId: string, label: string) => { 
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;

    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, internalReviews: (ph.internalReviews || []).map(ir => ir.id === irId ? { ...ir, label } : ir) } : ph) } : p)); 
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, internalReviews: (modalData.phase.internalReviews || []).map((ir: any) => ir.id === irId ? { ...ir, label } : ir) } }); 
  };
  const updatePhaseInternalReviewDate = (pId: string, phId: string, irId: string, date: string) => { 
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;

    const d = fromYMD(date); 
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, internalReviews: (ph.internalReviews || []).map(ir => ir.id === irId ? { ...ir, date: d! } : ir) } : ph) } : p)); 
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, internalReviews: (modalData.phase.internalReviews || []).map((ir: any) => ir.id === irId ? { ...ir, date: d! } : ir) } }); 
  };
  const removePhaseInternalReview = (pId: string, phId: string, irId: string) => { 
    if (isReadOnly) return;
    const project = projects.find(p => p.id === pId);
    if (globalLocked || project?.isLocked) return;

    recordHistory(); 
    setProjects(projects.map(p => p.id === pId ? { ...p, phases: p.phases.map(ph => ph.id === phId ? { ...ph, internalReviews: (ph.internalReviews || []).filter(ir => ir.id !== irId) } : ph) } : p)); 
    if (modalData?.phase.id === phId) setModalData({ ...modalData, phase: { ...modalData.phase, internalReviews: (modalData.phase.internalReviews || []).filter((ir: any) => ir.id !== irId) } }); 
  };

  const updateTasksInState = (tasks: Task[]) => {
    if (isReadOnly) return;
    const project = projects.find(p => p.id === modalData.projectId);
    if (globalLocked || project?.isLocked) return;
    
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
    
    const visibleMembers = teamMembers.filter(m => showHiddenTeamMembers || !m.isHidden);
    visibleMembers.forEach(m => map.set(m.name, { name: m.name, scheduled: [], pool: [] }));
    
    projects.forEach(p => {
      // Add project to the central top pool only if NOT hidden
      if (!p.isHidden && p.phases.length > 0) {
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
        // Pool shows the project once per person if project NOT hidden
        if (!p.isHidden) {
          const names = (ph.assignees && ph.assignees.length > 0) ? ph.assignees : [];
          names.forEach(n => {
            if (map.has(n)) {
              const a = map.get(n);
              if (!userAddedToProject.has(n)) {
                a.pool.push({ name: n, isAdHoc: false, project: p, phase: ph, task: { id: `phase-task-${ph.id}`, text: 'Project' }, hasAllocation: (ph.teamAllocations || []).length > 0 });
                userAddedToProject.add(n);
              }
            }
          });
        }
        
        // Schedule shows the phase allocations for ALL personnel (even if project is hidden or assignee is removed from the pool)
        const allocations = ph.teamAllocations || [];
        allocations.forEach(alloc => {
          if (alloc.assignee && map.has(alloc.assignee)) {
            const assigneeName = alloc.assignee;
            const a = map.get(assigneeName);
            if (alloc.start < weekEnd && alloc.end > currentTeamWeekStart) {
              const startD = new Date(alloc.start < currentTeamWeekStart ? currentTeamWeekStart : alloc.start);
              const endD = new Date(alloc.end > weekEnd ? weekEnd : alloc.end);
              
              const hrS = diffDays(currentTeamWeekStart, startD) * 24 + startD.getHours() + startD.getMinutes() / 60;
              const hrE = diffDays(currentTeamWeekStart, endD) * 24 + endD.getHours() + endD.getMinutes() / 60;
              
              const startCol = Math.max(0, Math.min(9, Math.floor(hrS / 24) * 2 + (startD.getHours() >= 12 ? 1 : 0)));
              const endCol = Math.max(1, Math.min(10, Math.ceil(hrE / 12)));
              
              const isAlreadyAdded = a.scheduled.some((item: any) => !item.isAdHoc && item.allocation.id === alloc.id);
              if (!isAlreadyAdded) {
                a.scheduled.push({ isAdHoc: false, project: p, phase: ph, task: { id: `phase-task-${ph.id}`, text: ph.title }, allocation: alloc, startCol, span: Math.max(1, endCol - startCol) });
              }
            }
          }
        });
      });
    });
    
    adHocTasks.forEach(t => {
      const n = t.assignee || 'PROJECT_POOL';
      if (map.has(n)) {
        const a = map.get(n);
        if (!t.done) {
          a.pool.push({ isAdHoc: true, task: t, project: { title: t.projectTitle, color: t.color, id: 'adhoc' }, phase: { id: 'adhoc' }, hasAllocation: !!t.start });
        }
        if (t.start && t.end && t.end > currentTeamWeekStart && t.start < weekEnd) {
          const startD = new Date(t.start < currentTeamWeekStart ? currentTeamWeekStart : t.start);
          const endD = new Date(t.end > weekEnd ? weekEnd : t.end);
          
          const hrS = diffDays(currentTeamWeekStart, startD) * 24 + startD.getHours() + startD.getMinutes() / 60;
          const hrE = diffDays(currentTeamWeekStart, endD) * 24 + endD.getHours() + endD.getMinutes() / 60;
          
          const sc = Math.max(0, Math.min(9, Math.floor(hrS / 24) * 2 + (startD.getHours() >= 12 ? 1 : 0)));
          const ec = Math.max(1, Math.min(10, Math.ceil(hrE / 12)));
          
          const isAlreadyAdded = a.scheduled.some((item: any) => item.isAdHoc && item.task.id === t.id);
          if (!isAlreadyAdded) {
            a.scheduled.push({ isAdHoc: true, task: t, allocation: { id: t.id, start: t.start, end: t.end, subTasks: t.subTasks }, project: { color: t.color, title: t.projectTitle, id: 'adhoc' }, phase: { id: 'adhoc' }, startCol: sc, span: Math.max(1, ec - sc) });
          }
        }
      }
    });

    const poolData = map.get('PROJECT_POOL');
    map.delete('PROJECT_POOL');
    return [poolData, ...Array.from(map.values())].filter(Boolean);
  }, [projects, adHocTasks, currentTeamWeekStart, teamMembers, viewMode, showHiddenTeamMembers]);

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

  const internalReviewsList = useMemo(() => {
    const list: Array<{
      projectId: string;
      projectTitle: string;
      projectColor: string;
      phaseId: string;
      phaseTitle: string;
      id: string;
      label: string;
      date: Date | null;
      isOverdue: boolean;
      daysRemaining: number;
    }> = [];

    projects.forEach((p) => {
      p.phases.forEach((ph) => {
        if (ph.internalReviews) {
          ph.internalReviews.forEach((ir) => {
            if (ir.date) {
              const d = new Date(ir.date);
              d.setHours(0,0,0,0);
              const t = new Date(today);
              t.setHours(0,0,0,0);
              const timeDiff = d.getTime() - t.getTime();
              const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
              const isOverdue = daysRemaining < 0;
              
              list.push({
                projectId: p.id,
                projectTitle: p.title || 'Untitled Project',
                projectColor: p.color || 'blue',
                phaseId: ph.id,
                phaseTitle: ph.title || 'Untitled Phase',
                id: ir.id,
                label: ir.label || 'Unnamed Review',
                date: ir.date,
                isOverdue,
                daysRemaining,
              });
            }
          });
        }
      });
    });

    return list.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (!a.date || !b.date) return 0;
      return a.date.getTime() - b.date.getTime();
    });
  }, [projects, today]);

  return (
    <div id="main-app-container" className="flex flex-col h-[100dvh] w-full absolute inset-0 overflow-hidden bg-slate-50">
      {/* Seasonal Live Ambient Animation Overlay */}
      <SeasonalThemeOverlay 
        theme={currentTheme} 
        enabled={animationEnabled} 
        intensity={animationIntensity} 
      />

      {/* Animated Characters moving along timeline (Skier, Snowman, Santa, etc.) */}
      <TimelineAnimatedCharacters
        theme={currentTheme}
        enabled={animationEnabled}
      />

      {viewingSnapshot && (
        <div className="flex-shrink-0 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white px-3.5 py-2 flex flex-col md:flex-row md:justify-between items-center z-[100] relative text-xs md:text-sm font-medium shadow-md gap-2 border-b border-amber-400/40">
          <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/20 text-white shrink-0">
              <Icons.Eye />
            </span>
            <span className="font-bold tracking-wide uppercase text-[10px] bg-black/30 px-2 py-0.5 rounded">
              Snapshot View (Read-Only)
            </span>
            <span className="font-bold text-white drop-shadow-xs">{viewingSnapshot.name}</span>
            <span className="text-amber-200 text-xs hidden sm:inline">•</span>
            <span className="text-xs text-amber-100 flex items-center gap-1">
              <Icons.Clock className="w-3.5 h-3.5 opacity-90" />
              Captured: <strong className="text-white font-mono">{formatSnapshotDateTime(viewingSnapshot.timestamp)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => handleRestoreSnapshot(viewingSnapshot.data)} 
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1 rounded transition-all text-xs font-bold shadow flex items-center gap-1.5 whitespace-nowrap"
              title="Make this snapshot state your active live timeline"
            >
              <Icons.Check className="w-3.5 h-3.5" /> Restore As Live Timeline
            </button>
            <button 
              onClick={handleExitSnapshotView} 
              className="bg-black/30 hover:bg-black/50 active:scale-95 text-white px-3 py-1 rounded transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap border border-white/20 flex items-center gap-1"
              title="Return to your live editable timeline"
            >
              <Icons.X /> Return to Live
            </button>
          </div>
        </div>
      )}

      <div className={`flex-shrink-0 text-white px-2 py-1.5 md:px-4 md:py-2 shadow-md flex flex-col lg:flex-row justify-between items-center z-50 relative gap-1.5 md:gap-2 transition-all duration-300 ${currentTheme.headerBg} ${currentTheme.headerBorder}`}>
        {/* Theme Garland / Fairy Lights / Icicles */}
        <ThemeHeaderGarland theme={currentTheme} />

        <div className="relative group/collection z-50 flex items-center">
          <div className="flex flex-col text-center lg:text-left justify-center">
            <div className="flex items-center justify-center lg:justify-start gap-1 cursor-pointer" onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}>
              <input 
                type="text" 
                value={activeCollection?.title || ''} 
                onChange={(e) => setCollections(prev => prev.map(c => c.id === activeCollectionId ? { ...c, title: e.target.value } : c))}
                readOnly={isReadOnly}
                className="bg-transparent text-base md:text-lg font-bold border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none transition-colors w-64 leading-tight"
                placeholder="Collection Name"
              />
              <Icons.ChevronDown />
              
              {/* Graphic Logo Badge on Titles */}
              <ThemeHeaderGraphic theme={currentTheme} onThemeClick={() => setShowThemeModal(true)} />
            </div>
          </div>
          
          {showCollectionDropdown && (
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

          {isAdmin && (
            <button 
              onClick={toggleGlobalLock}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] md:text-xs font-bold transition-all border ${globalLocked ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
              title={globalLocked ? "Unlock All Projects" : "Lock All Projects"}
            >
              {globalLocked ? <><Icons.Lock className="w-3.5 h-3.5" /> MASTER LOCKED</> : <><Icons.Unlock className="w-3.5 h-3.5" /> MASTER UNLOCKED</>}
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-800 rounded px-1.5 py-0.5">
            <div className={`px-2 py-1 flex items-center gap-1 text-[10px] md:text-xs font-medium ${syncStatus === 'Synced' ? 'text-green-400' : 'text-slate-400'}`}>
              {syncStatus === 'Saving...' ? <Icons.Spinner /> : <Icons.CloudCheck />} 
              <span className="hidden md:inline">{syncStatus}</span>
            </div>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
            <button onClick={() => setShowHistoryModal(true)} className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1 text-[10px] md:text-xs font-medium" title="Version History & Backups">
              <Icons.History /> <span className="hidden md:inline">History</span>
            </button>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
            <button onClick={() => setShowPDFModal(true)} className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1 text-[10px] md:text-xs font-medium" title="Export to PDF">
              <Icons.Download /> <span className="hidden md:inline">PDF</span>
            </button>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
            <button 
              onClick={() => setShowThemeModal(true)} 
              className={`p-1 px-1.5 rounded flex items-center gap-1 text-[10px] md:text-xs font-medium transition-all ${
                themeId !== 'default' 
                  ? 'bg-blue-600/30 text-blue-200 border border-blue-400/40 hover:bg-blue-600/50 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`} 
              title={`Seasonal & Holiday Theme: ${currentTheme.name} (${animationEnabled ? 'Animation Active' : 'Animation Off'})`}
            >
              {renderThemeIcon(currentTheme.iconName, themeId !== 'default' ? "w-3.5 h-3.5 text-amber-300" : "w-3.5 h-3.5 text-slate-300")} 
              <span className="hidden md:inline">Theme</span>
              {animationEnabled && currentTheme.animationType !== 'none' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
              )}
            </button>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
            <button onClick={() => setShowSettings(!showSettings)} className={`p-1 rounded flex items-center gap-1 text-[10px] md:text-xs font-medium transition-colors ${showSettings ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`} title="Timeline Settings">
              <Icons.Target className="w-3.5 h-3.5" /> <span className="hidden md:inline">Settings</span>
            </button>
            <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
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

          {(viewMode === 'projects' || viewMode === 'overview' || viewMode === 'team') && (
              <div className="flex items-center gap-1.5 md:gap-2">
                <button 
                  onClick={() => toggleAllProjects(false)}
                  className="text-[10px] md:text-xs text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded px-2 py-1 transition-colors font-bold flex items-center gap-1.5"
                  title="Collapse All Projects"
                >
                  <Icons.ChevronUp className="w-3 h-3" /> COLLAPSE ALL
                </button>
                <button 
                  onClick={() => toggleAllProjects(true)}
                  className="text-[10px] md:text-xs text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded px-2 py-1 transition-colors font-bold flex items-center gap-1.5 mr-1"
                  title="Expand All Projects"
                >
                  <Icons.ChevronDown className="w-3 h-3" /> EXPAND ALL
                </button>
                <button 
                  onClick={() => {
                  if (viewMode === 'team') {
                    const d = new Date(); d.setHours(0,0,0,0);
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    setCurrentTeamWeekStart(new Date(d.setDate(diff)));
                  } else {
                    const dayOffset = getDayOffset(timelineStart, today, hideWeekends);
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollLeft = (dayOffset * zoomLevel) - 200;
                    }
                  }
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
              <div className="flex items-center gap-2 border-l border-slate-700 pl-2 ml-1">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider group-hover:text-slate-300 transition-colors">Business days</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={hideWeekends} onChange={() => setHideWeekends(!hideWeekends)} className="sr-only peer" />
                    <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
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

      {/* Internal Review Notification / Reminder Bar */}
      {internalReviewsList.length > 0 && (
        <div 
          id="internal-review-reminder-banner" 
          className={`flex-shrink-0 bg-slate-800 border-b border-teal-500/30 text-white shadow-sm z-40 relative transition-all duration-300 ease-in-out ${
            reviewsReminderExpanded ? 'py-1.5' : 'py-1 hover:bg-slate-750 cursor-pointer'
          }`}
          onClick={() => {
            if (!reviewsReminderExpanded) {
              setReviewsReminderExpanded(true);
            }
          }}
        >
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
            {reviewsReminderExpanded ? (
              <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
                <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400"></span>
                    </span>
                    <span className="text-teal-400 bg-teal-500/10 p-[4px] rounded-full flex items-center justify-center border border-teal-500/20"><Icons.Search className="w-3.5 h-3.5 font-bold" /></span>
                    <span className="text-xs font-black uppercase tracking-wider text-teal-300">Internal Reviews Reminder</span>
                    <span className="bg-teal-500 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full leading-tight">
                      {internalReviewsList.filter(ir => ir.isOverdue).length > 0 ? `${internalReviewsList.filter(ir => ir.isOverdue).length} Overdue` : `${internalReviewsList.length} Active`}
                    </span>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewsReminderExpanded(false);
                    }}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 px-2.5 py-1 rounded transition-all font-bold border border-slate-600/50"
                  >
                    Hide <Icons.ChevronUp className="w-3 h-3 inline" />
                  </button>
                </div>

                <div className="w-full md:flex-1 md:max-w-5xl flex items-center gap-2.5 overflow-x-auto py-1 pr-2 no-scrollbar scroll-smooth">
                  {internalReviewsList.map(ir => {
                    const isOverdue = ir.isOverdue;
                    const days = ir.daysRemaining;
                    let statusText = "";
                    let badgeStyles = "";

                    if (isOverdue) {
                      statusText = `${Math.abs(days)}d Overdue`;
                      badgeStyles = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                    } else if (days === 0) {
                      statusText = "Today";
                      badgeStyles = "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse";
                    } else {
                      statusText = `In ${days}d`;
                      badgeStyles = "bg-teal-500/20 text-teal-300 border-teal-500/20";
                    }

                    return (
                      <div 
                        key={ir.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ir.date) {
                            const dayOffset = getDayOffset(timelineStart, ir.date, hideWeekends);
                            if (scrollContainerRef.current) {
                              scrollContainerRef.current.scrollLeft = (dayOffset * zoomLevel) - 300;
                            }
                          }
                        }}
                        className="bg-slate-900/50 hover:bg-slate-900 border border-slate-700/50 hover:border-teal-500/50 rounded-md px-3 py-1 text-left cursor-pointer transition-all flex items-center gap-3 shrink-0 group select-none min-w-[190px]"
                        title="Click to locate on timeline"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-100 group-hover:text-teal-300 transition-colors truncate max-w-[140px]" title={ir.label}>{ir.label}</p>
                          <p className="text-[9.5px] text-slate-400 truncate max-w-[140px]">{ir.phaseTitle} • <span className="text-slate-500 italic">{ir.projectTitle}</span></p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-0.5">
                          <span className={`text-[8px] font-mono tracking-wide uppercase px-1.5 py-0.5 rounded border font-semibold ${badgeStyles}`}>
                            {statusText}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 font-semibold">{formatDate(ir.date)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full h-7">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                  </span>
                  <span className="text-teal-400 bg-teal-500/10 p-[2px] rounded-full flex items-center justify-center border border-teal-500/20"><Icons.Search className="w-2.5 h-2.5 font-bold" /></span>
                  <span className="text-[11px] font-bold text-slate-300">Internal Reviews</span>
                  <span className="bg-teal-500 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight">
                    {internalReviewsList.length} Active
                  </span>
                  {internalReviewsList.filter(ir => ir.isOverdue).length > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight animate-pulse">
                      {internalReviewsList.filter(ir => ir.isOverdue).length} Overdue!
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 italic font-medium hidden sm:inline ml-2">Click anywhere on this bar to display upcoming review milestones</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setReviewsReminderExpanded(true);
                  }}
                  className="text-[11px] text-slate-300 hover:text-teal-300 flex items-center gap-1 bg-slate-700/30 hover:bg-slate-700/70 p-1 px-2.5 rounded transition-all font-bold border border-slate-600/30 font-semibold"
                >
                  Expand <Icons.ChevronDown className="w-3 h-3 inline animate-bounce" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="flex-shrink-0 bg-white border-b border-slate-200 p-4 shadow-sm z-40 overflow-x-auto space-y-4">
          {/* Seasonal Theme & Holiday Controls Section */}
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Icons.Sparkles className="w-4 h-4 text-purple-600" /> Seasonal Themes & Holiday Occasions
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Switch workspace atmosphere for Christmas, British holidays & live ambient animations
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {OCCASION_THEMES.map((t) => {
                const isSelected = themeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {renderThemeIcon(t.iconName, isSelected ? "w-3.5 h-3.5 text-amber-300" : "w-3.5 h-3.5 text-slate-500")}
                    <span>{t.name.split(' (')[0]}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                  </button>
                );
              })}

              <button
                onClick={() => { setShowSettings(false); setShowThemeModal(true); }}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Icons.Sparkles className="w-3 h-3" /> All Themes
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={animationEnabled}
                  onChange={(e) => handleToggleAnimation(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 bg-white border-slate-300"
                />
                Live Animation
              </label>
              {animationEnabled && (
                <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                  {(['low', 'medium', 'high'] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => handleChangeIntensity(lvl)}
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        animationIntensity === lvl ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {lvl[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Phase Color Configuration Section */}
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
          isAdmin={isAdmin} globalLocked={globalLocked}
          currentLeftWidth={currentLeftWidth} gridWidth={gridWidth} weeks={weeks} zoomLevel={zoomLevel}
          timelineStart={timelineStart} today={today} totalDays={totalDays} hideWeekends={hideWeekends}
          isLeftPanelCollapsed={isLeftPanelCollapsed} setIsLeftPanelCollapsed={setIsLeftPanelCollapsed}
          isResizingCol={isResizingCol} setIsResizingCol={setIsResizingCol} scrollContainerRef={scrollContainerRef} isReadOnly={isReadOnly}
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
          teamViewData={teamViewData} isAdmin={isAdmin} globalLocked={globalLocked} 
          currentLeftWidth={currentLeftWidth} isLeftPanelCollapsed={isLeftPanelCollapsed}
          setIsLeftPanelCollapsed={setIsLeftPanelCollapsed} isReadOnly={isReadOnly} currentTeamWeekStart={currentTeamWeekStart}
          jumpToEarliestTask={() => {}} prevWeek={() => setCurrentTeamWeekStart(addDays(currentTeamWeekStart, -7))}
          nextWeek={() => setCurrentTeamWeekStart(addDays(currentTeamWeekStart, 7))} today={today}
          draggedTeamMemberName={draggedTeamMemberName} 
          onDragStartTeamMember={onDragStartTeamMember} 
          onDragOverTeamMember={onDragOverTeamMember} 
          onDragEndTeamMember={onDragEndTeamMember}
          teamMembers={teamMembers} 
          editingMember={editingMember} 
          setEditingMember={setEditingMember}
          updateTeamMemberName={updateTeamMemberName} 
          toggleTeamMemberLock={toggleTeamMemberLock} 
          toggleTeamMemberVisibility={toggleTeamMemberVisibility}
          showHiddenTeamMembers={showHiddenTeamMembers}
          setShowHiddenTeamMembers={setShowHiddenTeamMembers}
          handleRemoveTeamMember={handleRemoveTeamMember}
          isAddingTeamMember={isAddingTeamMember} 
          setIsAddingTeamMember={setIsAddingTeamMember} 
          newTeamMemberName={newTeamMemberName} 
          setNewTeamMemberName={setNewTeamMemberName}
          handleAddTeamMember={handleAddTeamMember} 
          addAdHocTask={(name) => {
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
          zoomLevel={zoomLevel}
          isPoolCollapsed={isPoolCollapsed}
          setIsPoolCollapsed={setIsPoolCollapsed}
        />
      )}
      {viewMode === 'overview' && (
        <OverviewView
          overviewData={overviewData} currentLeftWidth={currentLeftWidth} gridWidth={gridWidth} weeks={weeks}
          zoomLevel={zoomLevel} timelineStart={timelineStart} today={today} totalDays={totalDays}
          hideWeekends={hideWeekends}
          isLeftPanelCollapsed={isLeftPanelCollapsed} setIsLeftPanelCollapsed={setIsLeftPanelCollapsed}
          setIsResizingCol={() => {}} scrollContainerRef={scrollContainerRef}
          phaseColors={phaseColors}
        />
      )}

      {modalData && (
        <PhaseModal
          modalData={modalData} activeProject={projects.find(p => p.id === modalData.projectId)!} isReadOnly={isReadOnly}
          isAdmin={isAdmin} globalLocked={globalLocked}
          selectedTaskIdsToCopy={selectedTaskIdsToCopy} setSelectedTaskIdsToCopy={setSelectedTaskIdsToCopy}
          copiedScope={copiedScope} setCopiedScope={setCopiedScope} setModalData={setModalData}
          editPhaseTitle={editPhaseTitle} updatePhaseAssignees={updatePhaseAssignees} updatePhaseDates={updatePhaseDates} addPhaseMilestone={addPhaseMilestone}
          updatePhaseMilestoneLabel={updatePhaseMilestoneLabel} updatePhaseMilestoneDate={updatePhaseMilestoneDate}
          removePhaseMilestone={removePhaseMilestone}
          addPhaseInternalReview={addPhaseInternalReview}
          updatePhaseInternalReviewLabel={updatePhaseInternalReviewLabel}
          updatePhaseInternalReviewDate={updatePhaseInternalReviewDate}
          removePhaseInternalReview={removePhaseInternalReview}
          toggleTask={toggleTask} addTask={addTask}
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
          setTeamModalData={setTeamModalData} 
          updateAdHocTaskProjectTitle={(id, title) => setAdHocTasks(prev => prev.map(t => t.id === id ? { ...t, projectTitle: title } : t))} 
          updateAdHocTaskText={(id, text) => setAdHocTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t))}
          updateAdHocTaskColor={(id, color) => setAdHocTasks(prev => prev.map(t => t.id === id ? { ...t, color } : t))} 
          updateAdHocTaskDone={(id, done) => setAdHocTasks(prev => prev.map(t => t.id === id ? { ...t, done } : t))} 
          toggleSubTask={(taskId, subId) => {
            setAdHocTasks(prev => prev.map(t => {
              if (t.id === taskId) {
                return { ...t, subTasks: (t.subTasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s) };
              }
              return t;
            }));
            setProjects(projects.map(p => ({
              ...p, phases: p.phases.map(ph => ({
                ...ph, teamAllocations: (ph.teamAllocations || []).map(a => {
                  if (a.id === taskId) {
                    return { ...a, subTasks: (a.subTasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s) };
                  }
                  return a;
                })
              }))
            })));
          }}
          addSubTask={(taskId) => {
            const ns = { id: generateId(), text: 'New Sub-task', done: false };
            setAdHocTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: [...(t.subTasks || []), ns] } : t));
            setProjects(projects.map(p => ({
              ...p, phases: p.phases.map(ph => ({
                ...ph, teamAllocations: (ph.teamAllocations || []).map(a => a.id === taskId ? { ...a, subTasks: [...(a.subTasks || []), ns] } : a)
              }))
            })));
          }} 
          updateSubTaskText={(taskId, subId, text) => {
            setAdHocTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: (t.subTasks || []).map(s => s.id === subId ? { ...s, text } : s) } : t));
            setProjects(projects.map(p => ({
              ...p, phases: p.phases.map(ph => ({
                ...ph, teamAllocations: (ph.teamAllocations || []).map(a => a.id === taskId ? { ...a, subTasks: (a.subTasks || []).map(s => s.id === subId ? { ...s, text } : s) } : a)
              }))
            })));
          }} 
          deleteSubTask={(taskId, subId) => {
            setAdHocTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: (t.subTasks || []).filter(s => s.id !== subId) } : t));
            setProjects(projects.map(p => ({
              ...p, phases: p.phases.map(ph => ({
                ...ph, teamAllocations: (ph.teamAllocations || []).map(a => a.id === taskId ? { ...a, subTasks: (a.subTasks || []).filter(s => s.id !== subId) } : a)
              }))
            })));
          }} 
          deleteAdHocTask={(id) => {
            setAdHocTasks(prev => prev.filter(t => t.id !== id));
            setProjects(projects.map(p => ({
              ...p, phases: p.phases.map(ph => ({
                ...ph, teamAllocations: (ph.teamAllocations || []).filter(a => a.id !== id)
              }))
            })));
            setTeamModalData(null);
          }}
          usedColors={usedColors}
        />
      )}

      {showHistoryModal && (
        <HistoryModal 
          setShowHistoryModal={setShowHistoryModal}
          setConfirmRestoreIdx={setConfirmRestoreIdx}
          confirmRestoreIdx={confirmRestoreIdx}
          saveHistory={saveHistory}
          actualIsReadOnly={actualIsReadOnly && !viewingSnapshot}
          importFileRef={importFileRef}
          handleImportJSON={handleImportJSON}
          exportToJSON={exportToJSON}
          handleViewSnapshot={handleViewSnapshot}
          handleExitSnapshotView={handleExitSnapshotView}
          viewingSnapshot={viewingSnapshot}
          applyLoadedData={applyLoadedData}
          deleteSnapshot={deleteSnapshot}
          createManualSnapshot={createManualSnapshot}
          autoSnapshotSettings={autoSnapshotSettings}
          setAutoSnapshotSettings={(val) => {
            setAutoSnapshotSettings(val);
            localStorage.setItem('timeline_auto_snapshot_settings', val);
          }}
        />
      )}

      {showPDFModal && (
        <PDFExportModal 
          projects={projects}
          phaseColors={phaseColors}
          onClose={() => setShowPDFModal(false)}
        />
      )}

      {showThemeModal && (
        <ThemeSelectorModal
          currentTheme={currentTheme}
          onSelectTheme={handleSelectTheme}
          animationEnabled={animationEnabled}
          onToggleAnimation={handleToggleAnimation}
          animationIntensity={animationIntensity}
          onChangeIntensity={handleChangeIntensity}
          onClose={() => setShowThemeModal(false)}
        />
      )}
    </div>
  );
};
