import React from 'react';
import { Icons } from '../icons';
import { diffDays, addDays, toYMD, formatDate } from '../utils';
import { getPhaseColor, getIndicatorColor } from '../constants';

interface TeamViewProps {
  teamViewData: any[];
  currentLeftWidth: number;
  isLeftPanelCollapsed: boolean;
  setIsLeftPanelCollapsed: (collapsed: boolean) => void;
  isReadOnly: boolean;
  currentTeamWeekStart: Date;
  jumpToEarliestTask: () => void;
  prevWeek: () => void;
  nextWeek: () => void;
  today: Date;
  draggedTeamMemberName: string | null;
  onDragStartTeamMember: (e: any, name: string) => void;
  onDragOverTeamMember: (e: any, name: string) => void;
  onDragEndTeamMember: (e: any) => void;
  teamMembers: any[];
  editingMember: { oldName: string | null; newName: string };
  setEditingMember: (data: any) => void;
  updateTeamMemberName: (old: string, next: string) => void;
  toggleTeamMemberLock: (name: string) => void;
  handleRemoveTeamMember: (name: string) => void;
  isAddingTeamMember: boolean;
  setIsAddingTeamMember: (adding: boolean) => void;
  newTeamMemberName: string;
  setNewTeamMemberName: (name: string) => void;
  handleAddTeamMember: () => void;
  addAdHocTask: (name: string) => void;
  onDragStartTeamItem: (e: any, pId: string, phId: string, task: any, allocId: string | null, start: Date | null, end: Date | null, isAdHoc: boolean) => void;
  setDraggedTeamItem: (item: any) => void;
  onDropTeamGrid: (e: any, name: string, idx: number) => void;
  onDropTeamPool: (e: any, name: string) => void;
  handleTeamBlockClick: (e: any, pId: string, phId: string, tId: string, aId: string, ad?: boolean) => void;
  handleBlockMouseDown: (e: any, pId: string, phId: string, type: string, start: Date | null, end: Date | null, tId?: string, aId?: string, ad?: boolean) => void;
  handleDeleteFromPool: (item: any) => void;
  setCurrentTeamWeekStart: (date: Date) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  teamViewData, currentLeftWidth, isLeftPanelCollapsed, setIsLeftPanelCollapsed, isReadOnly,
  currentTeamWeekStart, jumpToEarliestTask, prevWeek, nextWeek, today,
  draggedTeamMemberName, onDragStartTeamMember, onDragOverTeamMember, onDragEndTeamMember,
  teamMembers, editingMember, setEditingMember, updateTeamMemberName, toggleTeamMemberLock,
  handleRemoveTeamMember, isAddingTeamMember, setIsAddingTeamMember, newTeamMemberName,
  setNewTeamMemberName, handleAddTeamMember, addAdHocTask, onDragStartTeamItem,
  setDraggedTeamItem, onDropTeamGrid, onDropTeamPool, handleTeamBlockClick, handleBlockMouseDown,
  handleDeleteFromPool, setCurrentTeamWeekStart
}) => {
  const dragStartPos = React.useRef({ x: 0, y: 0 });
  const handleToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentTeamWeekStart(monday);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/50">
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center bg-white border-b border-slate-200 p-1.5 md:p-2 shadow-sm z-10 gap-1.5">
        <div className="text-xs md:text-sm font-bold text-slate-700 w-full md:w-64 text-center md:text-left">Team Weekly Task Planner</div>
        <div className="flex items-center justify-center gap-1 md:gap-3 bg-slate-50 border border-slate-200 rounded px-1 md:px-2 py-0.5 md:py-1 shadow-sm w-full md:w-auto">
          <button onClick={handleToday} className="flex items-center gap-1 px-2 py-1 text-[10px] md:text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors border border-blue-100 mr-1" title="Go to This Week">
            <Icons.Calendar className="w-3 h-3" /> TODAY
          </button>
          <button onClick={jumpToEarliestTask} className="p-1 md:p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors" title="Jump to Tasks"><Icons.Target /></button>
          <div className="w-px h-3 md:h-4 bg-slate-300 mx-0.5 md:mx-1"></div>
          <button onClick={prevWeek} className="p-1 md:p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"><Icons.ChevronLeft /></button>
          <div className="font-semibold text-[11px] md:text-sm text-slate-800 w-32 md:w-48 text-center uppercase tracking-wide">
            {formatDate(currentTeamWeekStart)} - {formatDate(addDays(currentTeamWeekStart, 4))}
          </div>
          <button onClick={nextWeek} className="p-1 md:p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"><Icons.ChevronRight /></button>
        </div>
        <div className="w-full md:w-auto text-center md:text-right text-[9px] md:text-[10px] text-slate-400">
          {isReadOnly ? 'Viewing mode active.' : 'Hold 0.3s to drag. Alt+Drag to duplicate. Click block for sub-tasks.'}
        </div>
      </div>

      <div id="timeline-scroll-container" className="flex-1 overflow-auto overscroll-none bg-white relative">
        <div className="relative min-w-full w-max min-h-full flex flex-col">
          <div className="flex sticky top-0 z-40 h-[60px] w-full min-w-full bg-white border-b border-slate-300 shadow-sm">
            <div className="flex-shrink-0 sticky left-0 z-50 bg-slate-50 border-r border-slate-300 flex flex-row shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-[width] duration-300 ease-in-out" style={{ width: currentLeftWidth }}>
              {!isLeftPanelCollapsed && (
                <div className="flex-1 border-r border-slate-200 flex flex-row justify-between items-end p-2">
                  <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase truncate">Project Assigned</div>
                  <button onClick={() => setIsLeftPanelCollapsed(true)} className="text-slate-400 hover:text-slate-700" title="Collapse Project List"><Icons.ChevronLeft /></button>
                </div>
              )}
              <div className={`${isLeftPanelCollapsed ? 'w-full' : 'w-[40%] min-w-[100px]'} flex flex-col justify-end p-2 relative transition-all duration-300 ease-in-out`}>
                {isLeftPanelCollapsed && <button onClick={() => setIsLeftPanelCollapsed(false)} className="absolute top-2 left-2 text-slate-400 hover:text-slate-700" title="Expand Project List"><Icons.ChevronRight /></button>}
                <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.1em] text-center w-full">Personnel</div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-w-[400px] lg:min-w-0">
              <div className="flex h-[32px] border-b border-slate-200 bg-slate-50">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => {
                  const date = addDays(currentTeamWeekStart, i);
                  const isTodayStr = toYMD(date) === toYMD(today);
                  return (
                    <div key={day} className={`flex-1 flex items-center justify-center border-r border-slate-200 last:border-r-0 ${isTodayStr ? 'bg-blue-50/50 text-blue-600' : 'text-slate-700'}`}>
                      <div className="text-xs font-bold mr-1">{day}</div>
                      <div className={`text-[10px] ${isTodayStr ? 'font-bold' : 'text-slate-500 font-medium'}`}>{date.getDate()}</div>
                    </div>
                  )
                })}
              </div>
              <div className="flex h-[28px] bg-slate-50/50">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 flex items-center justify-center text-[9px] text-slate-400 border-r border-slate-200 last:border-r-0 font-medium">{i % 2 === 0 ? 'AM' : 'PM'}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 pb-32">
            {teamViewData.map((assignee) => {
              const memberObj = teamMembers.find(m => (m.name || m) === assignee.name);
              const isLocked = memberObj ? memberObj.isLocked : false;

              return (
              <div 
                key={assignee.name} 
                className={`flex w-full border-b border-slate-200 group/teamrow items-stretch min-h-[80px] h-auto ${draggedTeamMemberName === assignee.name ? 'opacity-50 bg-slate-100' : ''}`}
                draggable={!isReadOnly && assignee.name !== 'Unassigned' && !isLocked}
                onDragStart={(e) => !isReadOnly && onDragStartTeamMember(e, assignee.name)}
                onDragOver={(e) => !isReadOnly && onDragOverTeamMember(e, assignee.name)}
                onDragEnd={onDragEndTeamMember}
              >
                <div 
                  className="flex-shrink-0 sticky left-0 z-30 bg-white group-hover/teamrow:bg-slate-50/50 transition-[width,background-color] duration-300 ease-in-out border-r border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)] overflow-hidden" 
                  style={{ width: currentLeftWidth }}
                  onDragOver={(e) => { 
                    if (isReadOnly) return;
                    e.preventDefault(); 
                    e.currentTarget.classList.add('bg-blue-50/30'); 
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-blue-50/30')}
                  onDrop={(e) => {
                    if (isReadOnly) return;
                    e.preventDefault(); e.stopPropagation();
                    e.currentTarget.classList.remove('bg-blue-50/30');
                    if(!isLeftPanelCollapsed) onDropTeamPool(e, assignee.name);
                  }}
                >
                  <div className="absolute inset-0 flex">
                    {!isLeftPanelCollapsed && (
                      <div className="flex-1 flex flex-col p-1.5 md:p-2 min-w-0 border-r border-slate-200">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center shrink-0 mb-1.5">
                          <span>{assignee.pool.length} Assigned</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1 overflow-y-auto flex-1 pr-1 pb-1 custom-scrollbar content-start">
                          {assignee.name === 'PROJECT_POOL' ? (
                            <div className="text-[10px] text-slate-400 py-1 text-center col-span-6">See grid area</div>
                          ) : assignee.pool.length === 0 ? (
                            <div className="text-[10px] text-slate-400 italic py-1 text-center col-span-6">Drop tasks here</div>
                          ) : (
                            assignee.pool.map((item: any, idx: number) => {
                              const poolBgColor = getPhaseColor(item.project.color, 0); 
                              return (
                                <div 
                                  key={`${item.project.id}_${item.phase.id}_${item.task.id}_${idx}`}
                                  className={`text-white rounded p-1 ${isReadOnly ? 'cursor-default' : 'cursor-grab'} hover:shadow-md transition-all shadow-sm flex flex-col justify-center overflow-hidden h-[28px] border border-transparent group/poolitem relative ${item.hasAllocation ? 'opacity-40 hover:opacity-100 border-white/40' : ''}`}
                                  style={{ backgroundColor: poolBgColor }}
                                  draggable={!isReadOnly}
                                  onDragStart={(e) => !isReadOnly && onDragStartTeamItem(e, item.project.id, item.phase.id, item.task, null, null, null, item.isAdHoc)}
                                  onDragEnd={() => setDraggedTeamItem(null)}
                                >
                                  <div className="font-bold truncate text-[8px] drop-shadow-sm w-full leading-tight mb-[1px] flex justify-between pr-4 items-center gap-1" title={item.project.title}>
                                    {item.project.syncId && <Icons.Link className="w-2.5 h-2.5 shrink-0" />}
                                    <span className="truncate">{item.project.title}</span>
                                  </div>
                                  {!isReadOnly && assignee.name !== 'PROJECT_POOL' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteFromPool(item); }} 
                                      className="absolute right-0.5 top-0.5 opacity-0 group-hover/poolitem:opacity-100 text-white hover:text-red-300 z-10 bg-black/20 rounded p-0.5 transition-opacity"
                                      title="Remove project from assigned"
                                    >
                                      <Icons.Trash className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                  {item.isAdHoc && (
                                    <div className="truncate opacity-95 text-[7px] drop-shadow-sm w-full leading-tight" title={item.task.text}>{item.task.text}</div>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}

                    <div className={`${isLeftPanelCollapsed ? 'w-full' : 'w-[40%] min-w-[100px]'} p-2 flex flex-col gap-1 shrink-0 overflow-hidden items-center justify-center relative transition-all duration-300 ease-in-out`}>
                      {assignee.name === 'PROJECT_POOL' ? (
                        <>
                          <div className="w-8 h-8 rounded border border-slate-300 bg-slate-100 text-slate-500 flex items-center justify-center font-bold shadow-inner shrink-0 mb-0.5" title="All Projects in Collection">
                            <Icons.Target className="w-[18px] h-[18px]" />
                          </div>
                          <h3 className="font-bold text-[10px] md:text-sm text-center leading-tight w-full truncate text-slate-600">All Projects</h3>
                          {!isReadOnly && <button onClick={() => addAdHocTask('PROJECT_POOL')} className="mt-1 p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Add Unassigned Task"><Icons.Plus className="w-4 h-4" /></button>}
                        </>
                      ) : (
                        <>
                          {!isReadOnly && <div className={`absolute top-1 left-1 w-4 flex justify-center items-center opacity-100 md:opacity-0 group-hover/teamrow:opacity-100 cursor-grab text-slate-400 hover:text-slate-600 shrink-0 ${assignee.name === 'Unassigned' || isLocked ? 'hidden' : ''}`}><Icons.Grip /></div>}
                          {!isReadOnly && (
                            <div className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover/teamrow:opacity-100 transition-opacity z-40">
                              <button onClick={() => addAdHocTask(assignee.name)} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Add Manual Task"><Icons.Plus /></button>
                            </div>
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-inner text-sm shrink-0 mb-0.5 tracking-tighter ${assignee.name === 'Unassigned' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                            {assignee.name === 'Unassigned' ? '?' : assignee.name.split(/\s+/).filter(Boolean).map((n: string) => n[0]).join('').toUpperCase()}
                          </div>
                          {editingMember.oldName === assignee.name ? (
                            <input 
                              autoFocus
                              value={editingMember.newName}
                              onChange={e => setEditingMember((prev: any) => ({...prev, newName: e.target.value}))}
                              onBlur={() => {
                                updateTeamMemberName(editingMember.oldName!, editingMember.newName);
                                setEditingMember({ oldName: null, newName: '' });
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  updateTeamMemberName(editingMember.oldName!, editingMember.newName);
                                  setEditingMember({ oldName: null, newName: '' });
                                } else if (e.key === 'Escape') {
                                  setEditingMember({ oldName: null, newName: '' });
                                }
                              }}
                              className="font-bold text-[10px] md:text-sm text-center leading-tight w-full truncate border-b border-blue-400 bg-transparent focus:outline-none text-slate-800"
                            />
                          ) : (
                            <h3 
                              className={`font-bold text-[10px] md:text-sm text-center leading-tight w-full truncate ${assignee.name === 'Unassigned' || isLocked ? 'text-slate-500 italic' : (isReadOnly ? 'text-slate-800' : 'text-slate-800 cursor-text hover:text-blue-600')}`} 
                              title={assignee.name === 'Unassigned' || isLocked || isReadOnly ? assignee.name : "Click to edit name"}
                              onClick={() => {
                                if (!isReadOnly && assignee.name !== 'Unassigned' && !isLocked) {
                                  setEditingMember({ oldName: assignee.name, newName: assignee.name });
                                }
                              }}
                            >
                              {assignee.name}
                            </h3>
                          )}
                          {!isReadOnly && assignee.name !== 'Unassigned' && (
                            <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 group-hover/teamrow:opacity-100 transition-opacity shrink-0 mt-0.5">
                              <button onClick={() => toggleTeamMemberLock(assignee.name)} className={`p-1 transition-colors ${isLocked ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`} title={isLocked ? "Unlock Position" : "Lock Position"}>{isLocked ? <Icons.Lock /> : <Icons.Unlock />}</button>
                              <button onClick={() => handleRemoveTeamMember(assignee.name)} className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0" title="Remove Team Member & Unassign Tasks"><Icons.Trash /></button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div 
                  className={`flex-1 relative team-row-container group-hover/teamrow:bg-slate-50/30 transition-colors sm:min-w-0 min-w-[400px] ${assignee.name === 'PROJECT_POOL' ? 'flex items-center p-2' : ''}`}
                  onDragOver={(e) => { 
                    if(isReadOnly) return;
                    e.preventDefault(); 
                    e.currentTarget.classList.add('bg-blue-50/20'); 
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-blue-50/20')}
                  onDrop={(e) => {
                    if(isReadOnly) return;
                    e.preventDefault(); e.stopPropagation();
                    e.currentTarget.classList.remove('bg-blue-50/20');
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const colWidth = rect.width / 10;
                    let colIndex = Math.floor(x / colWidth);
                    colIndex = Math.max(0, Math.min(9, colIndex)); 
                    onDropTeamGrid(e, assignee.name, colIndex);
                  }}
                >
                  {assignee.name === 'PROJECT_POOL' ? (
                    <div className="flex flex-row flex-wrap gap-y-2 gap-x-0 w-full h-full overflow-y-auto custom-scrollbar content-start p-1.5">
                      {assignee.pool.length === 0 ? (
                        <div className="text-sm text-slate-400 italic py-4 text-center w-full mt-2">No projects available</div>
                      ) : (
                        assignee.pool.map((item: any, idx: number) => {
                          const poolBgColor = getPhaseColor(item.project.color, 0); 
                          return (
                            <div key={`poolcol_${idx}`} className="w-[20%] p-0.5">
                              <div 
                                className={`text-white rounded px-2 py-1 w-full h-full shrink-0 ${isReadOnly ? 'cursor-default' : 'cursor-grab'} hover:shadow-md transition-all shadow-sm flex flex-col justify-center min-h-[32px] border border-transparent group/poolitem relative ${item.hasAllocation ? 'opacity-40 hover:opacity-100 border-white/40' : ''}`}
                                style={{ backgroundColor: poolBgColor }}
                                draggable={!isReadOnly}
                                onDragStart={(e) => !isReadOnly && onDragStartTeamItem(e, item.project.id, item.phase.id, item.task, null, null, null, item.isAdHoc)}
                                onDragEnd={() => setDraggedTeamItem(null)}
                              >
                                <div className="font-bold truncate text-[11px] drop-shadow-sm w-full leading-tight flex justify-between items-center gap-2" title={item.project.title}>
                                  {item.project.syncId && <Icons.Link className="w-3 h-3 shrink-0" />}
                                  <span className="truncate">{item.project.title}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 flex pointer-events-none">
                        {[...Array(10)].map((_, colIndex) => (
                          <div key={colIndex} className={`flex-1 border-r border-slate-200 transition-colors ${colIndex % 2 === 0 ? 'border-dashed border-r-slate-100' : ''}`}></div>
                        ))}
                      </div>

                      {(() => {
                        const rh = 40; // Fixed row height
                        const containerMinHeight = 84; // Fixed container height                        
                        const packedItems = [...assignee.scheduled].sort((a: any, b: any) => a.startCol - b.startCol).map((item: any) => ({...item, rowIndex: 0}));

                        return (
                          <div key={`container_${assignee.name}`} className="absolute inset-0 pointer-events-none" style={{ minHeight: `${containerMinHeight}px` }}>
                          {packedItems.map((item: any) => {
                      const bgColor = getPhaseColor(item.project.color, 1);
                      const totalSub = item.allocation.subTasks?.length || 0;
                      const doneSub = item.allocation.subTasks?.filter((s: any) => s.done).length || 0;
                      
                      return (
                        <div 
                          key={`${item.project.id}_${item.phase.id}_${item.task.id}_${item.allocation.id}`}
                          className={`absolute rounded shadow-sm text-white px-2 py-1 flex flex-col justify-center overflow-visible z-10 pointer-events-auto ${isReadOnly ? 'cursor-pointer' : 'cursor-grab'} border border-white/20 hover:scale-[1.01] transition-transform group/scheduledblock ${item.task.done ? 'completed-block' : ''}`}
                          style={{ left: `calc(${(item.startCol / 10) * 100}% + 2px)`, width: `calc(${(item.span / 10) * 100}% - 4px)`, top: `4px`, height: `calc(100% - 8px)`, backgroundColor: bgColor }}
                          onMouseDown={(e) => {
                            dragStartPos.current = { x: e.clientX, y: e.clientY };
                            if (!isReadOnly) handleBlockMouseDown(e, item.project.id, item.phase.id, 'move', item.allocation.start, item.allocation.end, item.task.id, item.allocation.id, item.isAdHoc);
                          }}
                          onTouchStart={(e) => {
                             dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                             if (!isReadOnly) handleBlockMouseDown(e, item.project.id, item.phase.id, 'move', item.allocation.start, item.allocation.end, item.task.id, item.allocation.id, item.isAdHoc);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y) > 10) return;
                            handleTeamBlockClick(e, item.project.id, item.phase.id, item.task.id, item.allocation.id, item.isAdHoc);
                          }}
                        >
                          <div className="flex flex-col h-full justify-center relative">
                            <div className="flex justify-between items-center gap-1 h-full pr-4">
                              <div className="truncate drop-shadow-md text-xs font-bold flex items-center gap-1 w-full">
                                {item.project.syncId && <Icons.Link className="w-3 h-3 shrink-0" />}
                                <span className="truncate">{item.project.title}</span>
                              </div>
                              {totalSub > 0 && <div className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-sm font-semibold shrink-0">{doneSub}/{totalSub}</div>}
                            </div>
                            {item.isAdHoc && <div className="truncate drop-shadow-md font-medium text-[9px] opacity-95">{item.task.text}</div>}
                            
                            {!isReadOnly && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteFromPool(item); }} 
                                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/scheduledblock:opacity-100 text-white hover:text-red-300 z-50 bg-black/20 rounded p-0.5 transition-opacity pointer-events-auto"
                                  title="Remove assigned project"
                                >
                                  <Icons.Trash className="w-2.5 h-2.5" />
                                </button>
                            )}
                          </div>
                          
                          {!isReadOnly && (
                            <>
                              <div className="resize-handle resize-handle-left touch-none drag-handle" onMouseDown={(e) => handleBlockMouseDown(e, item.project.id, item.phase.id, 'resize-alloc-left', item.allocation.start, item.allocation.end, item.task.id, item.allocation.id, item.isAdHoc)} onTouchStart={(e) => handleBlockMouseDown(e, item.project.id, item.phase.id, 'resize-alloc-left', item.allocation.start, item.allocation.end, item.task.id, item.allocation.id, item.isAdHoc)}></div>
                              <div className="resize-handle resize-handle-right touch-none drag-handle" onMouseDown={(e) => handleBlockMouseDown(e, item.project.id, item.phase.id, 'resize-alloc-right', item.allocation.start, item.allocation.end, item.task.id, item.allocation.id, item.isAdHoc)} onTouchStart={(e) => handleBlockMouseDown(e, item.project.id, item.phase.id, 'resize-alloc-right', item.allocation.start, item.allocation.end, item.task.id, item.allocation.id, item.isAdHoc)}></div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  );
                  })()}
                  </>
                  )}
                </div>
              </div>
            )})}

            <div className="flex w-full mt-4 mb-8">
              <div className="flex-shrink-0 sticky left-0 z-30 flex transition-[width] duration-300 ease-in-out overflow-hidden" style={{ width: currentLeftWidth }}>
                {!isLeftPanelCollapsed && <div className="flex-1 border-r border-slate-200/50"></div>}
                <div className={`${isLeftPanelCollapsed ? 'w-full' : 'w-[35%] min-w-[90px]'} p-2 transition-all duration-300 ease-in-out`}>
                  {!isReadOnly && (
                    isLeftPanelCollapsed ? (
                      <button onClick={() => setIsLeftPanelCollapsed(false)} className="flex items-center justify-center w-full h-full border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-500 rounded transition-colors text-xs" title="Expand to add team members"><Icons.Plus /></button>
                    ) : isAddingTeamMember ? (
                      <div className="bg-white border border-blue-300 rounded p-2 shadow-sm flex flex-col gap-2">
                        <input 
                          autoFocus
                          type="text"
                          value={newTeamMemberName}
                          onChange={e => setNewTeamMemberName(e.target.value)}
                          onKeyDown={e => { if(e.key === 'Enter') handleAddTeamMember() }}
                          placeholder="Name..."
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                        />
                        <div className="flex flex-col gap-1 mt-1">
                          <button onClick={handleAddTeamMember} className="text-[10px] bg-blue-600 text-white rounded px-2 py-1.5 font-bold shadow-sm w-full">Save</button>
                          <button onClick={() => { setIsAddingTeamMember(false); setNewTeamMemberName(''); }} className="text-[10px] text-slate-500 font-medium px-2 py-1.5 w-full border border-slate-200 rounded hover:bg-slate-50">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setIsAddingTeamMember(true)} className="flex items-center justify-center gap-1 w-full border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded p-2 text-xs font-medium transition-colors">
                        <Icons.Plus /> <span className="hidden md:inline">Add</span> Member
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
