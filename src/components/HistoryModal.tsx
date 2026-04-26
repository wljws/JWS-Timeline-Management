import React from 'react';
import { Icons } from '../icons';
import { Snapshot } from '../types';
import { formatDate } from '../utils';

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
  createManualSnapshot: () => void;
  autoSnapshotSettings: 'off' | 'daily' | 'weekly';
  setAutoSnapshotSettings: (val: 'off' | 'daily' | 'weekly') => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  setShowHistoryModal, setConfirmRestoreIdx, confirmRestoreIdx, saveHistory,
  actualIsReadOnly, importFileRef, handleImportJSON, exportToJSON,
  handleViewSnapshot, handleExitSnapshotView, viewingSnapshot, applyLoadedData, deleteSnapshot,
  createManualSnapshot, autoSnapshotSettings, setAutoSnapshotSettings
}) => {
  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'Unknown Time';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex justify-center items-center md:p-4" onMouseDown={() => { setShowHistoryModal(false); setConfirmRestoreIdx(null); }}>
      <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[85vh] md:max-w-[650px] overflow-hidden flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2"><Icons.History /> Version History & Backups</h2>
          <div className="flex gap-2 items-center">
            {!actualIsReadOnly && (
              <>
                <input type="file" accept=".json" style={{display: 'none'}} ref={importFileRef} onChange={handleImportJSON} />
                <button onClick={() => importFileRef.current?.click()} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors flex items-center gap-1 hidden md:flex" title="Import from JSON File">
                  <Icons.CloudDownload /> <span className="hidden md:inline">Import</span>
                </button>
              </>
            )}
            <button onClick={exportToJSON} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors flex items-center gap-1 hidden md:flex" title="Export to JSON File">
              <Icons.Download /> <span className="hidden md:inline">Export</span>
            </button>
            <button onClick={() => { setShowHistoryModal(false); setConfirmRestoreIdx(null); }} className="p-1 hover:bg-white/20 rounded-full transition-colors ml-2"><Icons.X /></button>
          </div>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
          {!actualIsReadOnly && (
            <div className="mb-6 bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Icons.Target className="text-blue-600 w-4 h-4" /> Snapshot Controls
                </h3>
                <button 
                  onClick={() => { exportToJSON(); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all border border-slate-200 flex items-center gap-1.5"
                >
                  <Icons.Clipboard className="w-3.5 h-3.5" /> Export All (JSON)
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                <div className="flex-1">
                  <button 
                    onClick={() => { createManualSnapshot(); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 text-sm"
                  >
                    <Icons.Camera /> Create Custom Snapshot Now
                  </button>
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider flex items-center gap-1">
                    <Icons.History className="w-3 h-3" /> Automatic Backups
                  </div>
                  <div className="flex p-0.5 bg-slate-200 rounded-md">
                    {(['off', 'daily', 'weekly'] as const).map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setAutoSnapshotSettings(mode)}
                        className={`flex-1 py-1 text-xs font-bold rounded transition-all ${autoSnapshotSettings === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-2 mb-4 bg-blue-50 border border-blue-100 p-3 rounded shadow-sm text-xs text-slate-600">
            <p className="flex-1">
              Select a previous save to restore your timeline to that exact moment. <strong>Warning:</strong> Restoring overwrites your current unsaved progress.
            </p>
            <div className="flex gap-2 md:hidden">
              {!actualIsReadOnly && <button onClick={() => importFileRef.current?.click()} className="flex-1 py-1.5 bg-white border border-slate-300 rounded font-bold">Import</button>}
              <button onClick={exportToJSON} className="flex-1 py-1.5 bg-white border border-slate-300 rounded font-bold">Export</button>
            </div>
          </div>
          
          {saveHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic">No local backup history available yet. Click "Snap" to create a backup.</div>
          ) : (
            <div className="space-y-3">
              {saveHistory.map((hist, idx) => {
                const projectCount = Array.isArray(hist.data.collections) 
                  ? hist.data.collections.reduce((sum: number, c: any) => sum + (c.projects?.length || 0), 0)
                  : Array.isArray(hist.data.projects) ? hist.data.projects.length : 0;
                
                let taskCount = 0;
                if (Array.isArray(hist.data.collections)) {
                  hist.data.collections.forEach((c: any) => {
                    taskCount += (c.adHocTasks?.length || 0);
                    c.projects?.forEach((p: any) => p.phases?.forEach((ph: any) => { taskCount += (ph.tasks?.length || 0); }));
                  });
                } else if (Array.isArray(hist.data.projects)) {
                  hist.data.projects.forEach((p: any) => p.phases?.forEach((ph: any) => { taskCount += (ph.tasks?.length || 0); }));
                }

                return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 bg-white rounded-lg hover:border-blue-300 transition-colors shadow-sm gap-3 sm:gap-0 relative group">
                  {!actualIsReadOnly && (
                    <button onClick={(e) => deleteSnapshot(e, hist.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Snapshot">
                      <Icons.Trash />
                    </button>
                  )}
                  <div>
                    <div className="font-bold text-sm text-slate-800 mb-1">
                      {hist.name ? <span className="text-blue-600 mr-2">{hist.name}</span> : ''}
                      <span className="text-xs text-slate-500 font-normal">{formatDateTime(hist.timestamp)}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">
                      <span className="text-slate-700">{projectCount}</span> Projects • <span className="text-slate-700">{taskCount}</span> Tasks
                    </div>
                  </div>
                  <div className="pr-4 sm:pr-8">
                    {confirmRestoreIdx === idx && !actualIsReadOnly ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => setConfirmRestoreIdx(null)} className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-bold transition-colors">Cancel</button>
                        <button onClick={() => { applyLoadedData(hist.data, true); setShowHistoryModal(false); setConfirmRestoreIdx(null); if (viewingSnapshot) handleExitSnapshotView(); }} className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded text-xs font-bold transition-colors shadow-sm whitespace-nowrap">Confirm Restore</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hist.data));
                          const downloadAnchorNode = document.createElement('a');
                          downloadAnchorNode.setAttribute("href", dataStr);
                          downloadAnchorNode.setAttribute("download", `snapshot_${hist.name || hist.timestamp}.json`);
                          document.body.appendChild(downloadAnchorNode);
                          downloadAnchorNode.click();
                          downloadAnchorNode.remove();
                        }} className="w-full sm:w-auto px-4 py-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded text-xs font-bold transition-all shadow-sm">Download</button>
                        <button onClick={() => handleViewSnapshot(hist)} className="w-full sm:w-auto px-4 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 rounded text-xs font-bold transition-all shadow-sm">View</button>
                        <button onClick={() => { if (!actualIsReadOnly) setConfirmRestoreIdx(idx); }} disabled={actualIsReadOnly} className={`w-full sm:w-auto px-4 py-1.5 rounded text-xs font-bold transition-all shadow-sm ${actualIsReadOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white'}`}>
                          Restore
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
