import React, { useState } from 'react';
import { Icons } from '../icons';
import { Snapshot } from '../types';

interface HistoryModalProps {
  setShowHistoryModal: (show: boolean) => void;
  setConfirmRestoreIdx: (idx: number | null) => void;
  confirmRestoreIdx: number | null;
  saveHistory: Snapshot[];
  actualIsReadOnly: boolean;
  importFileRef: React.RefObject<HTMLInputElement>;
  handleImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportToJSON: () => void;
  handleViewSnapshot: (snapshot: Snapshot) => void;
  handleExitSnapshotView: () => void;
  viewingSnapshot: Snapshot | null;
  applyLoadedData: (data: any, isHistoryRestore: boolean) => void;
  deleteSnapshot: (e: React.MouseEvent, id: string) => void;
  createManualSnapshot: (customName?: string) => void;
  autoSnapshotSettings: 'off' | 'daily' | 'weekly';
  setAutoSnapshotSettings: (val: 'off' | 'daily' | 'weekly') => void;
}

export const formatSnapshotDateTime = (isoString: string) => {
  if (!isoString) return 'Unknown Time';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  
  const dateStr = d.toLocaleDateString(undefined, { 
    weekday: 'short',
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = d.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  return `${dateStr} at ${timeStr}`;
};

export const getRelativeTime = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return 'Just now';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return '';
};

export const HistoryModal: React.FC<HistoryModalProps> = ({
  setShowHistoryModal, setConfirmRestoreIdx, confirmRestoreIdx, saveHistory,
  actualIsReadOnly, importFileRef, handleImportJSON, exportToJSON,
  handleViewSnapshot, handleExitSnapshotView, viewingSnapshot, applyLoadedData, deleteSnapshot,
  createManualSnapshot, autoSnapshotSettings, setAutoSnapshotSettings
}) => {
  const [customSnapshotName, setCustomSnapshotName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateSnapshot = () => {
    createManualSnapshot(customSnapshotName);
    setCustomSnapshotName('');
  };

  const filteredHistory = saveHistory.filter(hist => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = hist.name?.toLowerCase().includes(q);
    const dateMatch = formatSnapshotDateTime(hist.timestamp).toLowerCase().includes(q);
    return nameMatch || dateMatch;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex justify-center items-center md:p-4" onMouseDown={() => { setShowHistoryModal(false); setConfirmRestoreIdx(null); }}>
      <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[720px] overflow-hidden flex flex-col" onMouseDown={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Icons.History />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">Version History & Snapshots</h2>
              <p className="text-[11px] text-slate-400">Capture exact point-in-time timeline archives and restore anytime</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {!actualIsReadOnly && (
              <>
                <input type="file" accept=".json" style={{display: 'none'}} ref={importFileRef} onChange={handleImportJSON} />
                <button onClick={() => importFileRef.current?.click()} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 hidden md:flex text-slate-200" title="Import from JSON File">
                  <Icons.CloudDownload /> <span className="hidden md:inline">Import</span>
                </button>
              </>
            )}
            <button onClick={exportToJSON} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 hidden md:flex text-slate-200" title="Export to JSON File">
              <Icons.Download /> <span className="hidden md:inline">Export</span>
            </button>
            <button onClick={() => { setShowHistoryModal(false); setConfirmRestoreIdx(null); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-1 text-slate-300 hover:text-white"><Icons.X /></button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50 space-y-5">
          {/* Active Snapshot Notice if viewing */}
          {viewingSnapshot && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Icons.Eye />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    Currently Viewing Read-Only Snapshot
                  </div>
                  <div className="text-[11px] text-amber-800">
                    <strong className="font-semibold">{viewingSnapshot.name}</strong> • Captured {formatSnapshotDateTime(viewingSnapshot.timestamp)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    applyLoadedData(viewingSnapshot.data, true);
                    handleExitSnapshotView();
                    setShowHistoryModal(false);
                  }}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <Icons.Check className="w-3.5 h-3.5" /> Restore This
                </button>
                <button
                  onClick={handleExitSnapshotView}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Icons.X className="w-3.5 h-3.5" /> Exit View
                </button>
              </div>
            </div>
          )}

          {/* Snapshot Controls */}
          {!actualIsReadOnly && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Camera /> Capture New Snapshot
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Captures entire timeline state with exact time</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Optional snapshot label (e.g. Pre-Client Review, Rev 3)..."
                    value={customSnapshotName}
                    onChange={(e) => setCustomSnapshotName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateSnapshot();
                    }}
                    className="w-full pl-3 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                  />
                </div>
                <button 
                  onClick={handleCreateSnapshot}
                  className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow flex justify-center items-center gap-2 text-xs whitespace-nowrap"
                >
                  <Icons.Camera /> Capture Snapshot Now
                </button>
              </div>

              {/* Automatic Backup Settings */}
              <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Icons.Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Automatic Interval Backups:</span>
                </div>
                <div className="flex p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                  {(['off', 'daily', 'weekly'] as const).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setAutoSnapshotSettings(mode)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${autoSnapshotSettings === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* List Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Saved Snapshots ({saveHistory.length})</span>
            </div>
            {saveHistory.length > 3 && (
              <div className="relative w-full sm:w-56">
                <Icons.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search snapshots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Snapshot List */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs italic">
              {saveHistory.length === 0 ? 'No snapshot history recorded yet. Click "Capture Snapshot Now" to create one.' : 'No snapshots match your search.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredHistory.map((hist, idx) => {
                const isCurrentlyViewing = viewingSnapshot?.id === hist.id;
                
                const collectionsList = Array.isArray(hist.data?.collections) 
                  ? hist.data.collections 
                  : (hist.data?.projects ? [{ projects: hist.data.projects, adHocTasks: hist.data.adHocTasks }] : []);
                
                const collectionCount = collectionsList.length || 1;
                const projectCount = collectionsList.reduce((sum: number, c: any) => sum + (c.projects?.length || 0), 0);
                
                let taskCount = 0;
                collectionsList.forEach((c: any) => {
                  taskCount += (c.adHocTasks?.length || 0);
                  (c.projects || []).forEach((p: any) => (p.phases || []).forEach((ph: any) => { taskCount += (ph.tasks?.length || 0); }));
                });

                const formattedExactTime = formatSnapshotDateTime(hist.timestamp);
                const relativeTime = getRelativeTime(hist.timestamp);

                return (
                  <div 
                    key={hist.id || idx} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border transition-all shadow-sm gap-3 relative group ${
                      isCurrentlyViewing 
                        ? 'border-amber-400 ring-2 ring-amber-300/50 bg-amber-50/20' 
                        : 'border-slate-200 hover:border-blue-300 hover:shadow'
                    }`}
                  >
                    {!actualIsReadOnly && (
                      <button 
                        onClick={(e) => deleteSnapshot(e, hist.id)} 
                        className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-600 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50" 
                        title="Delete Snapshot"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-slate-900">{hist.name}</span>
                        {isCurrentlyViewing && (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                            Viewing Active
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Icons.Clock className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="font-mono text-[11px] font-semibold">{formattedExactTime}</span>
                        </span>
                        {relativeTime && (
                          <span className="text-[11px] text-blue-600 font-medium font-mono">
                            ({relativeTime})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-medium text-slate-500 mt-1.5 flex items-center gap-2">
                        <span><strong className="text-slate-700">{collectionCount}</strong> {collectionCount === 1 ? 'Collection' : 'Collections'}</span>
                        <span>•</span>
                        <span><strong className="text-slate-700">{projectCount}</strong> Projects</span>
                        <span>•</span>
                        <span><strong className="text-slate-700">{taskCount}</strong> Tasks</span>
                      </div>
                    </div>

                    <div className="sm:pl-4 shrink-0">
                      {confirmRestoreIdx === idx && !actualIsReadOnly ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => setConfirmRestoreIdx(null)} 
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => { 
                              applyLoadedData(hist.data, true); 
                              setShowHistoryModal(false); 
                              setConfirmRestoreIdx(null); 
                              if (viewingSnapshot) handleExitSnapshotView(); 
                            }} 
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                          >
                            Confirm Restore
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <button 
                            onClick={() => {
                              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hist.data, null, 2));
                              const downloadAnchorNode = document.createElement('a');
                              downloadAnchorNode.setAttribute("href", dataStr);
                              downloadAnchorNode.setAttribute("download", `${hist.name.replace(/[^a-z0-9_-]/gi, '_') || 'snapshot'}_${hist.timestamp}.json`);
                              document.body.appendChild(downloadAnchorNode);
                              downloadAnchorNode.click();
                              downloadAnchorNode.remove();
                            }} 
                            className="px-2.5 py-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-xs font-bold transition-all shadow-xs"
                            title="Download JSON Snapshot File"
                          >
                            <Icons.Download />
                          </button>

                          {isCurrentlyViewing ? (
                            <button 
                              onClick={handleExitSnapshotView} 
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-xs"
                            >
                              Exit View
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleViewSnapshot(hist)} 
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                              title="Load and inspect this snapshot state in read-only mode"
                            >
                              <Icons.Eye /> <span>View</span>
                            </button>
                          )}

                          <button 
                            onClick={() => { if (!actualIsReadOnly) setConfirmRestoreIdx(idx); }} 
                            disabled={actualIsReadOnly} 
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                              actualIsReadOnly 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white'
                            }`}
                            title="Restore this snapshot to overwrite current live timeline"
                          >
                            Restore
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
