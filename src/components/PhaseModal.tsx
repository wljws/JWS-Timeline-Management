import React from 'react';
import { Icons } from '../icons';
import { Project, Phase, Task, Milestone } from '../types';
import { getPhaseColor, THEME_COLORS, COLOR_PALETTES, getIndicatorColor } from '../constants';
import { toYMD, fromYMD, diffDays, formatDate, generateId } from '../utils';

interface PhaseModalProps {
  modalData: { projectId: string; phase: Phase; colorIndex: number };
  activeProject: Project;
  isReadOnly: boolean;
  selectedTaskIdsToCopy: Set<string>;
  setSelectedTaskIdsToCopy: (ids: Set<string>) => void;
  copiedScope: Task[] | null;
  setCopiedScope: (tasks: Task[] | null) => void;
  setModalData: (data: any) => void;
  editPhaseTitle: (pId: string, phId: string, title: string) => void;
  updatePhaseDates: (pId: string, phId: string, start: string, end: string) => void;
  addPhaseMilestone: (pId: string, phId: string) => void;
  updatePhaseMilestoneLabel: (pId: string, phId: string, mId: string, label: string) => void;
  updatePhaseMilestoneDate: (pId: string, phId: string, mId: string, date: string) => void;
  removePhaseMilestone: (pId: string, phId: string, mId: string) => void;
  toggleTask: (taskId: string) => void;
  addTask: () => void;
  updateTaskText: (taskId: string, text: string) => void;
  updateTaskAssignees: (taskId: string, assignees: string[]) => void;
  updateTaskDates: (taskId: string, start: string, end: string) => void;
  deleteTask: (taskId: string) => void;
  removePhase: (pId: string, phId: string) => void;
  recordHistory: () => void;
  updateTasksInState: (tasks: Task[]) => void;
  teamMembers: any[];
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  onDragStartTask: (e: any, idx: number) => void;
  onDragOverTask: (e: any, idx: number) => void;
  onDragEndTask: (e: any) => void;
  onDragStartMilestone: (e: any, idx: number) => void;
  onDragOverMilestone: (e: any, idx: number) => void;
  onDragEndMilestone: (e: any) => void;
  draggedTaskIndex: number | null;
  draggedMilestoneIndex: number | null;
  interactionTimeRef: React.MutableRefObject<number>;
  updatePhaseAssignees: (pId: string, phId: string, assignees: string[]) => void;
}

export const PhaseModal: React.FC<PhaseModalProps> = ({
  modalData, activeProject, isReadOnly, selectedTaskIdsToCopy, setSelectedTaskIdsToCopy,
  copiedScope, setCopiedScope, setModalData, editPhaseTitle, updatePhaseDates,
  addPhaseMilestone, updatePhaseMilestoneLabel, updatePhaseMilestoneDate, removePhaseMilestone,
  toggleTask, addTask, updateTaskText, updateTaskAssignees, updateTaskDates, deleteTask,
  removePhase, recordHistory, updateTasksInState, teamMembers, openDropdownId, setOpenDropdownId,
  onDragStartTask, onDragOverTask, onDragEndTask, onDragStartMilestone, onDragOverMilestone, onDragEndMilestone,
  draggedTaskIndex, draggedMilestoneIndex, interactionTimeRef, updatePhaseAssignees
}) => {
  const phaseAssignees = modalData.phase.assignees || [];
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex justify-center items-center md:p-4" onMouseDown={() => { setModalData(null); setSelectedTaskIdsToCopy(new Set()); }}>
      <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[750px] overflow-hidden flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: getPhaseColor(activeProject.color, modalData.colorIndex) }}>
          <div className="flex-1 mr-4 flex items-center">
            <div className="flex-1">
              <p className="text-xs opacity-80 font-medium tracking-wide uppercase mb-1 flex items-center gap-1">
                {activeProject.title} {(activeProject.isLocked || modalData.phase.isLocked) && <span className="bg-black/20 px-1.5 rounded-sm flex items-center gap-1 text-[9px]"><Icons.Lock className="w-2.5 h-2.5" /> Locked</span>}
                {isReadOnly && <span className="bg-black/20 px-1.5 rounded-sm flex items-center gap-1 ml-1 text-[9px]"><Icons.Lock className="w-2.5 h-2.5" /> View Only</span>}
              </p>
              <input value={modalData.phase.title} readOnly={isReadOnly} onChange={e => editPhaseTitle(activeProject.id, modalData.phase.id, e.target.value)} className="bg-transparent text-xl font-bold w-full focus:outline-none border-b border-transparent focus:border-white/50" />
            </div>
          </div>
          <button onClick={() => { setModalData(null); setSelectedTaskIdsToCopy(new Set()); }} className="p-2 md:p-1 hover:bg-black/10 rounded-full transition-colors"><Icons.X /></button>
        </div>

        <div className="p-4 md:p-5 flex-1 overflow-y-auto">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <div className="flex flex-col md:flex-row md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1"><Icons.Users className="w-4 h-4 text-blue-500" /> Assigned Personnel</h3>
                </div>
                <div className="relative group" onMouseLeave={() => setOpenDropdownId(null)}>
                  <div 
                    onClick={() => { if (!activeProject.isLocked && !modalData.phase.isLocked && !isReadOnly) setOpenDropdownId(openDropdownId === 'phase-assignees' ? null : 'phase-assignees') }}
                    className={`min-h-[42px] p-2 border border-slate-200 rounded-lg bg-slate-50 flex flex-wrap gap-1.5 cursor-pointer hover:border-blue-300 transition-colors ${(activeProject.isLocked || modalData.phase.isLocked || isReadOnly) ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {phaseAssignees.length === 0 ? (
                      <span className="text-xs text-slate-400 italic py-1">No personnel assigned to this phase</span>
                    ) : (
                      phaseAssignees.map(name => (
                        <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                          {name}
                          {!activeProject.isLocked && !modalData.phase.isLocked && !isReadOnly && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); updatePhaseAssignees(modalData.projectId, modalData.phase.id, phaseAssignees.filter(n => n !== name)); }}
                              className="hover:text-blue-900"
                            >
                              <Icons.X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))
                    )}
                  </div>
                  {openDropdownId === 'phase-assignees' && !isReadOnly && (
                    <div className="absolute top-full left-0 z-[70] mt-1 w-full bg-white border border-slate-200 shadow-2xl rounded-lg py-2 max-h-60 overflow-y-auto">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Select Personnel</div>
                      {teamMembers.map(mObj => {
                        const mName = mObj.name || mObj;
                        const isSelected = phaseAssignees.includes(mName);
                        return (
                          <label key={mName} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors group/item">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover/item:border-blue-400'}`}>
                              {isSelected && <Icons.Check className="w-3 h-3 text-white" />}
                            </div>
                            <input 
                              type="checkbox" 
                              className="hidden"
                              checked={isSelected} 
                              onChange={() => { 
                                const next = isSelected ? phaseAssignees.filter(m => m !== mName) : [...phaseAssignees, mName]; 
                                updatePhaseAssignees(modalData.projectId, modalData.phase.id, next); 
                              }} 
                            />
                            <span className={`text-xs ${isSelected ? 'text-blue-700 font-semibold' : 'text-slate-600'}`}>{mName}</span>
                          </label>
                        );
                      })}
                      {teamMembers.length === 0 && <div className="text-xs text-slate-400 italic px-4 py-3 text-center">No team members found. Go to Team View to add them.</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1"><Icons.Calendar className="w-4 h-4 text-slate-500" /> Phase Timeline</h3>
                </div>
                <div className="flex items-center gap-2">
                  <input type="date" value={toYMD(modalData.phase.start)} disabled={activeProject.isLocked || modalData.phase.isLocked || isReadOnly} onChange={(e) => updatePhaseDates(modalData.projectId, modalData.phase.id, e.target.value, toYMD(modalData.phase.end))} className={`text-xs border border-slate-200 rounded p-1.5 text-slate-700 outline-none focus:border-blue-400 flex-1 ${(activeProject.isLocked || modalData.phase.isLocked || isReadOnly) ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} />
                  <span className="text-slate-400">-</span>
                  <input type="date" value={toYMD(modalData.phase.end)} disabled={activeProject.isLocked || modalData.phase.isLocked || isReadOnly} onChange={(e) => updatePhaseDates(modalData.projectId, modalData.phase.id, toYMD(modalData.phase.start), e.target.value)} className={`text-xs border border-slate-200 rounded p-1.5 text-slate-700 outline-none focus:border-blue-400 flex-1 ${(activeProject.isLocked || modalData.phase.isLocked || isReadOnly) ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Icons.Flag className="text-amber-400 w-3 h-3" /> Milestones</span>
                  {!isReadOnly && <button onClick={() => addPhaseMilestone(modalData.projectId, modalData.phase.id)} disabled={activeProject.isLocked || modalData.phase.isLocked} className={`text-[10px] font-bold flex items-center gap-1 ${(activeProject.isLocked || modalData.phase.isLocked) ? 'text-slate-400 cursor-not-allowed' : 'text-amber-600 hover:text-amber-800'}`}><Icons.Plus className="w-3 h-3" /> Add Milestone</button>}
                </div>
                
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                  {(!modalData.phase.milestones || modalData.phase.milestones.length === 0) ? (
                    <p className="text-[10px] text-slate-400 italic mt-2">No milestones added.</p>
                  ) : (
                    modalData.phase.milestones.map((m, mIdx) => (
                      <div key={m.id} draggable={!activeProject.isLocked && !modalData.phase.isLocked && !isReadOnly} onDragStart={(e) => onDragStartMilestone(e, mIdx)} onDragOver={(e) => onDragOverMilestone(e, mIdx)} onDragEnd={onDragEndMilestone} className={`flex items-center gap-2 group py-1 ${draggedMilestoneIndex === mIdx ? 'opacity-50' : ''}`}>
                        <input type="text" value={m.label || ''} readOnly={activeProject.isLocked || modalData.phase.isLocked || isReadOnly} onChange={(e) => updatePhaseMilestoneLabel(modalData.projectId, modalData.phase.id, m.id, e.target.value)} placeholder="Label" className={`flex-1 text-[11px] border border-slate-200 rounded p-1.5 text-slate-700 outline-none focus:border-amber-400 ${(activeProject.isLocked || modalData.phase.isLocked || isReadOnly) ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} />
                        <input type="date" value={toYMD(m.date)} disabled={activeProject.isLocked || modalData.phase.isLocked || isReadOnly} onChange={(e) => updatePhaseMilestoneDate(modalData.projectId, modalData.phase.id, m.id, e.target.value)} className={`w-32 text-[10px] border border-slate-200 rounded p-1 text-slate-700 outline-none focus:border-amber-400 ${(activeProject.isLocked || modalData.phase.isLocked || isReadOnly) ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`} />
                        {!isReadOnly && <button onClick={() => removePhaseMilestone(modalData.projectId, modalData.phase.id, m.id)} disabled={activeProject.isLocked || modalData.phase.isLocked} className={`p-1 ${(activeProject.isLocked || modalData.phase.isLocked) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 transition-colors'}`}><Icons.Trash className="w-3.5 h-3.5" /></button>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end mb-3 border-b border-slate-100 pb-1">
            <div className="flex gap-2 w-full pr-7 items-center">
              {!isReadOnly && (
                <input 
                  type="checkbox" 
                  checked={modalData.phase.tasks.length > 0 && selectedTaskIdsToCopy.size === modalData.phase.tasks.length} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTaskIdsToCopy(new Set(modalData.phase.tasks.map(t => t.id)));
                    } else {
                      setSelectedTaskIdsToCopy(new Set());
                    }
                  }} 
                  className="w-4 h-4 ml-1 rounded border-slate-300 text-slate-600 focus:ring-slate-500 cursor-pointer accent-slate-500 flex-shrink-0"
                  title="Select all tasks for copy"
                />
              )}
              <span className="w-6 md:w-4"></span>
              <span className="w-5 md:w-4"></span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-1">Description</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[180px] pl-2 text-center" title="Overall task span. Schedule specifics in Team View.">Overall Span</span>
            </div>
          </div>

          <div className="space-y-3 md:space-y-1 pb-8">
            {modalData.phase.tasks.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-4 italic">No tasks added yet.</p>
            ) : (
              modalData.phase.tasks.map((task, tIdx) => {
                const taskAssignees = task.assignees || (task.assignee ? [task.assignee] : []);
                return (
                <div key={task.id} draggable={!modalData.phase.isLocked && !isReadOnly} onDragStart={(e) => onDragStartTask(e, tIdx)} onDragOver={(e) => onDragOverTask(e, tIdx)} onDragEnd={onDragEndTask} className={`flex flex-col md:flex-row md:items-center gap-2 group py-2 md:py-1 hover:bg-slate-50 border border-slate-100 md:border-transparent rounded md:rounded-none p-2 md:p-0 ${draggedTaskIndex === tIdx ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                    {!isReadOnly && (
                      <input 
                        type="checkbox" 
                        checked={selectedTaskIdsToCopy.has(task.id)}
                        onChange={() => {
                          setSelectedTaskIdsToCopy(new Set((prev => {
                            const next = new Set(prev);
                            if (next.has(task.id)) next.delete(task.id);
                            else next.add(task.id);
                            return next;
                          })(selectedTaskIdsToCopy)));
                        }}
                        className="w-4 h-4 ml-1 rounded border-slate-300 text-slate-600 focus:ring-slate-500 cursor-pointer accent-slate-500 flex-shrink-0"
                        title="Select task for copy"
                      />
                    )}
                    {!isReadOnly && <div className={`w-6 flex justify-center text-slate-400 ${modalData.phase.isLocked ? 'opacity-0' : 'cursor-grab opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-slate-600'}`}><Icons.Grip /></div>}
                    <input type="checkbox" checked={task.done} disabled={modalData.phase.isLocked || isReadOnly} onChange={() => toggleTask(task.id)} className="w-5 h-5 md:w-4 md:h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-50 cursor-pointer accent-blue-500 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" />
                    <input value={task.text} readOnly={modalData.phase.isLocked || isReadOnly} onChange={(e) => updateTaskText(task.id, e.target.value)} placeholder="Task Description" className={`flex-1 text-base md:text-sm bg-transparent border-b border-slate-200 md:border-transparent focus:border-slate-300 focus:outline-none py-1.5 md:py-1 ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'} ${(modalData.phase.isLocked || isReadOnly) ? 'opacity-70 cursor-not-allowed' : ''}`} />
                  </div>
                  
                  <div className="flex items-center justify-between w-full md:w-auto pl-12 md:pl-0 mt-2 md:mt-0 gap-2">
                    <div className="flex-1 md:w-[180px] flex flex-col md:flex-row items-center md:justify-between md:pl-2 md:border-l border-slate-100 gap-1 md:gap-0" title="Auto-synced from Team View Allocations. Edit to overwrite all.">
                      <div className="flex items-center w-full justify-between">
                        <input 
                          type="date" 
                          value={toYMD(task.start)} 
                          disabled={modalData.phase.isLocked || isReadOnly} 
                          onKeyDown={() => { interactionTimeRef.current = Date.now(); }}
                          onMouseDown={() => { interactionTimeRef.current = Date.now(); }}
                          onChange={(e) => { 
                            updateTaskDates(task.id, e.target.value, toYMD(task.end)); 
                            if (e.target.value && (Date.now() - interactionTimeRef.current > 200)) { 
                              const endInput = document.getElementById(`task-end-${task.id}`) as HTMLInputElement; 
                              if (endInput) { endInput.focus(); try { endInput.showPicker(); } catch(err) {} } 
                            }
                          }} 
                          className={`w-[110px] md:w-[80px] text-xs md:text-[10px] bg-slate-50 md:bg-transparent border border-slate-200 md:border-b md:border-t-0 md:border-x-0 md:border-transparent rounded md:rounded-none px-1 py-1 focus:border-slate-300 focus:outline-none text-slate-500 ${(modalData.phase.isLocked || isReadOnly) ? 'opacity-70 cursor-not-allowed' : ''}`} 
                        />
                        <span className="text-[10px] text-slate-300 mx-1 md:mx-0.5">-</span>
                        <input id={`task-end-${task.id}`} type="date" value={toYMD(task.end)} disabled={modalData.phase.isLocked || isReadOnly} onChange={(e) => updateTaskDates(task.id, toYMD(task.start), e.target.value)} className={`w-[110px] md:w-[80px] text-xs md:text-[10px] bg-slate-50 md:bg-transparent border border-slate-200 md:border-b md:border-t-0 md:border-x-0 md:border-transparent rounded md:rounded-none px-1 py-1 focus:border-slate-300 focus:outline-none text-slate-500 ${(modalData.phase.isLocked || isReadOnly) ? 'opacity-70 cursor-not-allowed' : ''}`} />
                      </div>
                    </div>
                    {!isReadOnly && <button onClick={() => deleteTask(task.id)} disabled={modalData.phase.isLocked} className={`p-2 md:p-0 w-8 md:w-5 ${modalData.phase.isLocked ? 'text-slate-300 cursor-not-allowed' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity'}`}><Icons.Trash /></button>}
                  </div>
                </div>
                )
              })
            )}
          </div>
          {!isReadOnly && (
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={addTask} disabled={modalData.phase.isLocked} className={`flex-1 text-sm md:text-xs font-medium flex items-center justify-center border border-dashed border-blue-200 p-3 rounded gap-2 ${modalData.phase.isLocked ? 'text-slate-400 cursor-not-allowed border-slate-200' : 'text-blue-600 hover:bg-blue-50'}`}>
                <Icons.Plus /> Add New Task
              </button>
              <button onClick={() => {
                if (selectedTaskIdsToCopy.size === 0) {
                  alert("Please select at least one task to copy using the checkboxes on the left.");
                  return;
                }
                const tasksToCopy = modalData.phase.tasks.filter((t: any) => selectedTaskIdsToCopy.has(t.id));
                setCopiedScope(tasksToCopy);
                setSelectedTaskIdsToCopy(new Set());
              }} className="px-4 text-sm md:text-xs font-medium flex items-center justify-center border border-slate-200 rounded gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap" title="Copy selected tasks to clipboard">
                <Icons.Copy /> Copy Selected ({selectedTaskIdsToCopy.size})
              </button>
              {copiedScope && copiedScope.length > 0 && (
                <button onClick={() => {
                  recordHistory();
                  const newTasks = copiedScope.map(ct => ({
                    id: generateId(),
                    text: ct.text,
                    done: false,
                    assignees: [],
                    assignee: '',
                    start: null,
                    end: null,
                    allocations: []
                  }));
                  updateTasksInState([...modalData.phase.tasks, ...newTasks]);
                }} disabled={modalData.phase.isLocked} className={`px-4 text-sm md:text-xs font-medium flex items-center justify-center border border-blue-200 rounded gap-1.5 whitespace-nowrap ${modalData.phase.isLocked ? 'text-slate-400 cursor-not-allowed border-slate-200' : 'text-blue-600 hover:bg-blue-50'} transition-colors`} title="Paste copied tasks">
                  <Icons.Clipboard /> Paste Scope ({copiedScope.length})
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          {!isReadOnly ? (
            <button onClick={() => removePhase(activeProject.id, modalData.phase.id)} className="text-sm md:text-xs text-red-500 hover:text-red-700 font-medium p-2">Delete Phase</button>
          ) : <div></div>}
          <button onClick={() => { setModalData(null); setSelectedTaskIdsToCopy(new Set()); }} className="bg-slate-800 hover:bg-slate-700 text-white text-base md:text-sm font-medium px-8 py-3 md:py-2 rounded-lg md:rounded shadow-sm">Done</button>
        </div>
      </div>
    </div>
  );
};
