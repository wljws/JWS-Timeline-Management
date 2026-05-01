import React from 'react';
import { Project, Phase } from '../types';
import { Icons } from '../icons';
import { diffDays, abbreviatePhase, addDays, getDayOffset, countVisibleDays } from '../utils';
import { getIndicatorColor, getPhaseColor, THEME_COLORS, COLOR_PALETTES } from '../constants';

interface ProjectViewProps {
  visibleProjects: Project[];
  currentLeftWidth: number;
  gridWidth: number;
  weeks: any[];
  zoomLevel: number;
  timelineStart: Date;
  today: Date;
  totalDays: number;
  hideWeekends?: boolean;
  isLeftPanelCollapsed: boolean;
  setIsLeftPanelCollapsed: (collapsed: boolean) => void;
  isResizingCol: boolean;
  setIsResizingCol: (resizing: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  isReadOnly: boolean;
  isAdmin: boolean;
  globalLocked: boolean;
  draggedProjectId: string | null;
  onDragStartRow: (e: any, id: string) => void;
  onDragOverRow: (e: any, id: string) => void;
  onDragEndRow: () => void;
  toggleProjectExpand: (id: string) => void;
  updateProjectColor: (id: string, color: string) => void;
  updateProjectTitle: (id: string, title: string) => void;
  addPhase: (id: string) => void;
  copyProjectMenuId: string | null;
  setCopyProjectMenuId: (id: string | null) => void;
  copyAsSynced: boolean;
  setCopyAsSynced: (synced: boolean) => void;
  handleCopyProject: (pId: string, cId: string, synced: boolean) => void;
  collections: any[];
  activeCollectionId: string;
  deleteProject: (id: string) => void;
  toggleProjectVisibility: (id: string) => void;
  handleBlockMouseDown: (e: any, pId: string, phId: string, type: string, start: Date | null, end: Date | null) => void;
  handleBlockClick: (e: any, pId: string, phase: Phase, colorIdx: number) => void;
  selectedPhaseIds: Set<string>;
  toggleProjectSelection: (id: string) => void;
  togglePhaseSelection: (id: string) => void;
  editPhaseTitle: (pId: string, phId: string, title: string) => void;
  toggleLock: (pId: string, phId: string) => void;
  removePhase: (pId: string, phId: string) => void;
  draggedPhase: { projectId: string; phaseIndex: number } | null;
  onDragStartPhase: (e: any, pId: string, idx: number) => void;
  onDragOverPhase: (e: any, pId: string, idx: number) => void;
  onDragEndPhase: (e: any) => void;
  handleGridClick: (e: any, pId: string, phId: string) => void;
  addProject: () => void;
  showHiddenProjects: boolean;
  setShowHiddenProjects: (show: boolean) => void;
  hiddenCount: number;
  phaseColors?: Record<string, string>;
}

export const ProjectView: React.FC<ProjectViewProps> = ({
  visibleProjects, currentLeftWidth, gridWidth, weeks, zoomLevel, timelineStart, today, totalDays,
  hideWeekends, isLeftPanelCollapsed, setIsLeftPanelCollapsed, isResizingCol, setIsResizingCol, scrollContainerRef, 
  isReadOnly, isAdmin, globalLocked,
  draggedProjectId, onDragStartRow, onDragOverRow, onDragEndRow, toggleProjectExpand, updateProjectColor,
  updateProjectTitle, addPhase, copyProjectMenuId, setCopyProjectMenuId, copyAsSynced, setCopyAsSynced,
  handleCopyProject, collections, activeCollectionId, deleteProject, toggleProjectVisibility,
  handleBlockMouseDown, handleBlockClick, selectedPhaseIds, toggleProjectSelection, togglePhaseSelection,
  editPhaseTitle, toggleLock, removePhase, draggedPhase, onDragStartPhase, onDragOverPhase, onDragEndPhase,
  handleGridClick, addProject, showHiddenProjects, setShowHiddenProjects, hiddenCount, phaseColors
}) => {
  const dragStartPos = React.useRef({ x: 0, y: 0 });
  return (
    <div id="timeline-scroll-container" className="flex-1 overflow-auto overscroll-none bg-white relative touch-pan-x touch-pan-y" ref={scrollContainerRef}>
      <div className="relative min-w-full w-max min-h-full">
        
        {/* Grid Background */}
        <div className="absolute top-[60px] bottom-0 flex pointer-events-none z-0" style={{ left: currentLeftWidth, width: gridWidth }}>
          {weeks.map((w, i) => (
            <div key={i} className="h-full border-r border-slate-300 relative shrink-0" style={{ width: (hideWeekends ? 5 : 7) * zoomLevel, minWidth: (hideWeekends ? 5 : 7) * zoomLevel }}>
              <div className="absolute inset-0 flex">
                {[...Array(7)].map((_, dayIdx) => {
                  const day = addDays(w.start, dayIdx).getDay();
                  if (hideWeekends && (day === 0 || day === 6)) return null;
                  return (
                    <div key={dayIdx} className="h-full border-r border-slate-100 border-dashed shrink-0" style={{ width: zoomLevel, minWidth: zoomLevel }}></div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Red Line */}
        {diffDays(timelineStart, today) >= 0 && diffDays(timelineStart, today) <= totalDays && (
          <div className="absolute top-[60px] bottom-0 w-[2px] bg-red-500 z-10 opacity-70 pointer-events-none transition-[left] duration-300 ease-in-out" style={{ left: currentLeftWidth + getDayOffset(timelineStart, today, !!hideWeekends) * zoomLevel }}>
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></div>
          </div>
        )}

        {/* HEADER ROW */}
        <div className="flex sticky top-0 z-40 h-[60px] w-max min-w-full">
          <div className="flex-shrink-0 sticky left-0 z-50 bg-slate-50 border-r border-b border-slate-300 flex flex-row items-center justify-between p-2 shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-[width] duration-300 ease-in-out" style={{ width: currentLeftWidth }}>
            {!isLeftPanelCollapsed && <div className="col-resizer" onMouseDown={() => setIsResizingCol(true)} onTouchStart={() => setIsResizingCol(true)}></div>}
            {isLeftPanelCollapsed ? (
              <button onClick={() => setIsLeftPanelCollapsed(false)} className="w-full flex justify-center text-slate-400 hover:text-slate-700" title="Expand Panel"><Icons.ChevronRight /></button>
            ) : (
              <div className="flex items-center w-full justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase truncate pr-2">Projects & Phases</span>
                <button onClick={() => setIsLeftPanelCollapsed(true)} className="text-slate-400 hover:text-slate-700 flex-shrink-0" title="Collapse Panel"><Icons.ChevronLeft /></button>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 bg-white border-b border-slate-300 flex flex-col" style={{ width: gridWidth }}>
            <div className="flex border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold h-[32px]">
              {(() => {
                const months: any[] = [];
                let currDate = new Date(timelineStart);
                const endLimit = addDays(timelineStart, totalDays);
                
                while (currDate < endLimit) {
                  const m = currDate.getMonth();
                  const y = currDate.getFullYear();
                  const lastDayOfMonth = new Date(y, m + 1, 0); // Last day of current month
                  const endOfSegment = lastDayOfMonth >= endLimit ? addDays(endLimit, -1) : lastDayOfMonth;
                  
                  const segmentWidth = countVisibleDays(currDate, endOfSegment, !!hideWeekends) * zoomLevel;
                  
                  months.push({ 
                    name: currDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), 
                    width: segmentWidth 
                  });
                  
                  currDate = new Date(y, m + 1, 1);
                }

                return months.map((m, i) => (
                  <div key={i} className="flex items-center pl-2 border-r border-slate-300 truncate shrink-0" style={{ width: m.width }}>
                    {m.name}
                  </div>
                ));
              })()}
            </div>
            <div className="flex h-[28px] bg-white text-[10px] text-slate-500 font-medium">
              {weeks.map((w, i) => (
                <div key={i} className="shrink-0 flex flex-col justify-center items-center border-r border-slate-300 bg-slate-50 overflow-hidden px-1 py-[2px]" style={{ width: (hideWeekends ? 5 : 7) * zoomLevel, minWidth: (hideWeekends ? 5 : 7) * zoomLevel }}>
                  <span className="truncate leading-none text-center px-1" title={w.label}>{w.label}</span>
                  <span className="truncate text-[8.5px] leading-none text-slate-400 mt-[3px]">Week {w.weekOfMonth}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT ROWS */}
        <div className="relative z-20 pb-32 flex flex-col w-max min-w-full">
          {visibleProjects.map((project) => {
            const allPhasesSelected = project.phases.length > 0 && project.phases.every(ph => selectedPhaseIds.has(ph.id));
            const chronoIndices: Record<string, number> = {};
            project.phases.filter(p => p.start && p.end).sort((a,b) => a.start!.getTime() - b.start!.getTime()).forEach((p, idx) => { chronoIndices[p.id] = idx; });

            return (
            <div 
              key={project.id}
              draggable={!isReadOnly && isAdmin && !isResizingCol}
              onDragStart={(e) => !isReadOnly && isAdmin && !isResizingCol && onDragStartRow(e, project.id)}
              onDragOver={(e) => !isReadOnly && isAdmin && onDragOverRow(e, project.id)}
              onDragEnd={onDragEndRow}
              className={`flex flex-col relative border-b border-slate-200 bg-transparent hover:z-40 ${draggedProjectId === project.id ? 'opacity-50 bg-slate-100 z-50' : 'z-10'}`}
            >
              <div className={`flex w-full group relative z-20 ${project.isHidden ? 'opacity-60 bg-slate-100' : ''}`}>
                <div className="flex-shrink-0 sticky left-0 z-30 bg-white group-hover:bg-slate-50 transition-[width,background-color] duration-300 ease-in-out border-r border-slate-300 flex items-center h-[48px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] overflow-visible" style={{ width: currentLeftWidth, paddingLeft: isLeftPanelCollapsed ? '0' : '0.5rem' }}>
                  {isLeftPanelCollapsed ? (
                    <div className="w-full flex justify-center cursor-pointer hover:bg-slate-100 h-full items-center" onClick={() => toggleProjectExpand(project.id)} title={`Expand - ${project.title}`}>
                      <div className="w-4 h-4 rounded-full shadow-sm border border-slate-200" style={{backgroundColor: getIndicatorColor(project.color)}}></div>
                    </div>
                  ) : (
                    <div className="flex w-full items-center pr-1 min-w-0">
                      {!isReadOnly && isAdmin && (
                        <div className="w-6 md:w-8 flex justify-center items-center h-full opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-grab shrink-0">
                          <Icons.Grip />
                        </div>
                      )}
                      <button onClick={() => toggleProjectExpand(project.id)} className="p-1 mr-1 text-slate-400 hover:text-slate-700 shrink-0">
                        {project.isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                      </button>

                      <div className="relative group/color mr-2 flex items-center h-full shrink-0">
                        <div className="w-4 h-4 md:w-3 md:h-3 rounded-full cursor-pointer" style={{backgroundColor: getIndicatorColor(project.color)}}></div>
                        {!isReadOnly && isAdmin && (
                          <div className="absolute left-0 top-full hidden group-hover/color:block z-50 pt-2 pb-4 pl-0 pr-4 -ml-2 -mt-2">
                            <div className="flex gap-1.5 bg-white border border-slate-200 shadow-xl rounded-md p-1.5 items-center">
                              {THEME_COLORS.map(c => (
                                <div key={c} onClick={() => updateProjectColor(project.id, c)} className="w-5 h-5 md:w-4 md:h-4 rounded-full cursor-pointer hover:scale-110 shadow-sm border border-slate-200" style={{backgroundColor: COLOR_PALETTES[c][1]}}></div>
                              ))}
                              <div className="w-px h-5 md:h-4 bg-slate-200 mx-0.5"></div>
                              <label className="w-5 h-5 md:w-4 md:h-4 rounded-full cursor-pointer hover:scale-110 overflow-hidden relative border border-slate-300 shadow-inner flex-shrink-0" title="Custom Color">
                                <input type="color" value={project.color && project.color.startsWith('#') ? project.color : '#000000'} onChange={(e) => updateProjectColor(project.id, e.target.value)} className="absolute -top-2 -left-2 w-8 h-8 opacity-0 cursor-pointer" />
                                <div className="w-full h-full bg-[conic-gradient(red,yellow,lime,aqua,blue,fuchsia,red)]"></div>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {project.syncId && <Icons.Link className="text-blue-500 w-3.5 h-3.5 mr-1.5 shrink-0" title="Linked Project (Synced)" />}

                      <input type="checkbox" disabled={isReadOnly || !isAdmin} checked={allPhasesSelected} onChange={() => toggleProjectSelection(project.id)} className="mr-2 w-4 h-4 md:w-3.5 md:h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-500 shrink-0 disabled:opacity-50" title="Select All Phases to shift timeline" />
                      <input value={project.title} readOnly={isReadOnly || !isAdmin} onChange={(e) => updateProjectTitle(project.id, e.target.value)} className={`flex-1 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none focus:border-b border-blue-300 mr-2 min-w-0 ${(isReadOnly || !isAdmin) ? 'cursor-default' : ''}`} />
                      
                      {!isReadOnly && isAdmin && (
                        <div className="flex items-center shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10 md:absolute md:right-0 md:top-0 md:bottom-0 md:pl-10 md:pr-1 md:bg-gradient-to-r from-white/0 via-white to-white group-hover:from-slate-50/0 group-hover:via-slate-50 group-hover:to-slate-50 pointer-events-none *:pointer-events-auto transition-opacity">
                          <button onClick={() => addPhase(project.id)} className="p-2 md:p-1 text-slate-400 hover:text-blue-600 shrink-0" title="Add Phase"><Icons.Plus /></button>
                          
                          <div className="relative group/copy mr-1 shrink-0" onMouseLeave={() => { setCopyProjectMenuId(null); setCopyAsSynced(false); }}>
                            <button onClick={(e) => { e.stopPropagation(); setCopyProjectMenuId(copyProjectMenuId === project.id ? null : project.id); }} className="p-2 md:p-1 text-slate-400 hover:text-blue-600 flex items-center justify-center" title="Copy Project to Collection">
                              <Icons.Copy />
                            </button>
                            {copyProjectMenuId === project.id && (
                              <div className="absolute top-full right-0 pt-1.5 w-56 z-[100]" onMouseDown={e => e.stopPropagation()}>
                                <div className="bg-white border border-slate-200 shadow-xl rounded-md py-1 max-h-48 overflow-y-auto">
                                  <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                                    <input type="checkbox" id={`sync-toggle-${project.id}`} checked={copyAsSynced} onChange={(e) => setCopyAsSynced(e.target.checked)} className="cursor-pointer accent-blue-500 w-3.5 h-3.5 shrink-0" />
                                    <label htmlFor={`sync-toggle-${project.id}`} className="text-xs text-slate-700 font-bold cursor-pointer select-none leading-tight">Link Synced Copy<br/><span className="font-normal text-[9px] text-slate-400">Edits replicate across collections</span></label>
                                  </div>
                                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Select Target Collection</div>
                                  {collections.map(c => (
                                    <div key={c.id} onClick={(e) => { e.stopPropagation(); handleCopyProject(project.id, c.id, copyAsSynced); }} className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center justify-between text-slate-700 font-medium">
                                      <span className="truncate">{c.title}</span>
                                      {c.id === activeCollectionId && <span className="text-[9px] text-slate-400 font-normal ml-2 shrink-0">(Current)</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <button onClick={() => deleteProject(project.id)} className="p-2 md:p-1 text-slate-400 hover:text-red-500 mr-2 shrink-0" title="Delete Project"><Icons.Trash /></button>
                          
                          <button onClick={() => toggleLock(project.id)} className={`p-2 md:p-1 transition-colors mr-2 shrink-0 ${ (globalLocked || project.isLocked) ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500 opacity-100 md:opacity-0 md:group-hover:opacity-100'}`} title={ (globalLocked || project.isLocked) ? "Unlock Project Dates" : "Lock Project Dates"}>{ (globalLocked || project.isLocked) ? <Icons.Lock /> : <Icons.Unlock />}</button>

                          <button onClick={() => toggleProjectVisibility(project.id)} className="p-2 md:p-1 text-slate-400 hover:text-slate-600 shrink-0" title={project.isHidden ? "Unhide Project" : "Hide Project"}>
                            {project.isHidden ? <Icons.Eye /> : <Icons.EyeOff />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0 relative h-[48px] bg-slate-50/10 group-hover:bg-slate-50/30 transition-colors" style={{ width: gridWidth }}>
                  {!project.isExpanded && project.phases.map((phase, phaseIndex) => {
                    const colorIndex = chronoIndices[phase.id] !== undefined ? chronoIndices[phase.id] : phaseIndex;
                    const isCompleted = phase.tasks.length > 0 && phase.tasks.every(t => t.done);
                    const hasTimeline = phase.start && phase.end;
                    const isSelected = selectedPhaseIds.has(phase.id);
                    let left = 0, width = 0, isVisible = false, durationWeeks = "";
                    if (hasTimeline) {
                      left = getDayOffset(timelineStart, phase.start!, !!hideWeekends) * zoomLevel;
                      const durationDays = diffDays(phase.start!, phase.end!) + 1;
                      width = countVisibleDays(phase.start!, phase.end!, !!hideWeekends) * zoomLevel;
                      isVisible = left + width >= 0 && left <= gridWidth;
                      durationWeeks = (durationDays / 7).toFixed(1).replace(/\.0$/, '');
                    }

                    return (
                      <React.Fragment key={phase.id}>
                        {isVisible && (
                          <div 
                            onMouseDown={(e) => {
                              dragStartPos.current = { x: e.clientX, y: e.clientY };
                              !isReadOnly && handleBlockMouseDown(e, project.id, phase.id, 'move', phase.start, phase.end);
                            }}
                            onTouchStart={(e) => !isReadOnly && handleBlockMouseDown(e, project.id, phase.id, 'move', phase.start, phase.end)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y) > 10) return;
                              handleBlockClick(e, project.id, phase, colorIndex);
                            }}
                            className={`absolute top-[8px] h-[32px] rounded-md shadow-sm text-xs font-semibold text-white px-2 flex flex-col justify-center overflow-hidden z-10 timeline-block touch-none 
                              ${isCompleted ? 'completed-block' : ''} ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500 scale-[1.02]' : ''} ${(globalLocked || project.isLocked || phase.isLocked) ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                            `}
                            style={{ 
                              left: `${left}px`, 
                              width: `${Math.max(width, zoomLevel/2)}px`, 
                              backgroundColor: (phaseColors && phaseColors[phase.title]) || getPhaseColor(project.color, colorIndex) 
                            }}
                          >
                            <div className="truncate drop-shadow-md flex items-center gap-1">
                              {(globalLocked || project.isLocked || phase.isLocked) && <Icons.Lock />} {abbreviatePhase(phase.title)} ({durationWeeks}w)
                            </div>
                            {!isReadOnly && isAdmin && (
                              <>
                                <div className="resize-handle resize-handle-left touch-none drag-handle" onMouseDown={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-left', phase.start, phase.end)} onTouchStart={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-left', phase.start, phase.end)}></div>
                                <div className="resize-handle resize-handle-right touch-none drag-handle" onMouseDown={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-right', phase.start, phase.end)} onTouchStart={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-right', phase.start, phase.end)}></div>
                              </>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none opacity-80" style={{ backgroundColor: getIndicatorColor(project.color) }}></div>
                            <div className="absolute bottom-[2px] left-0 right-0 h-2 pointer-events-none">
                              {(phase.tasks || []).flatMap((task, tIdx) => {
                                return (task.allocations || []).map((alloc, aIdx) => {
                                  if (!alloc.start || !alloc.end) return null;
                                  const allocLeft = getDayOffset(phase.start!, alloc.start, !!hideWeekends) * zoomLevel;
                                  const durationDays = diffDays(alloc.start, alloc.end) + 1;
                                  const allocWidth = countVisibleDays(alloc.start, alloc.end, !!hideWeekends) * zoomLevel;
                                  return <div key={`${task.id}_${alloc.id}`} className="absolute h-[1.5px] bg-white/70 shadow-sm rounded-full" style={{ left: `${allocLeft}px`, width: `${Math.max(allocWidth, 4)}px`, bottom: `${1 + (tIdx % 3)*2}px` }} />
                                });
                              })}
                            </div>
                          </div>
                        )}
                        {(phase.milestones || []).map(milestone => {
                          if (!milestone.date) return null;
                          return (
                            <div key={milestone.id} className="absolute top-[8px] z-20 flex flex-col items-center pointer-events-none drop-shadow-md" style={{ left: `${getDayOffset(timelineStart, milestone.date, !!hideWeekends) * zoomLevel}px`, transform: 'translateX(-50%)' }} title={milestone.label}>
                              <Icons.Flag className="text-amber-400" />
                            </div>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {project.isExpanded && project.phases.map((phase, phaseIndex) => {
                const hasTimeline = phase.start && phase.end;
                const colorIndex = chronoIndices[phase.id] !== undefined ? chronoIndices[phase.id] : phaseIndex;
                let left = 0, width = 0, durationWeeks = "";
                if (hasTimeline) {
                  left = getDayOffset(timelineStart, phase.start!, !!hideWeekends) * zoomLevel;
                  const durationDays = diffDays(phase.start!, phase.end!) + 1;
                  width = countVisibleDays(phase.start!, phase.end!, !!hideWeekends) * zoomLevel;
                  durationWeeks = (durationDays / 7).toFixed(1).replace(/\.0$/, '');
                }
                const taskCount = phase.tasks.length;
                const doneCount = phase.tasks.filter(t => t.done).length;
                const isCompleted = taskCount > 0 && doneCount === taskCount;
                const isSelected = selectedPhaseIds.has(phase.id);
                
                return (
                  <div 
                    key={phase.id} 
                    draggable={!isReadOnly && isAdmin && !isResizingCol}
                    onDragStart={(e) => !isReadOnly && isAdmin && !isResizingCol && onDragStartPhase(e, project.id, phaseIndex)}
                    onDragOver={(e) => !isReadOnly && isAdmin && onDragOverPhase(e, project.id, phaseIndex)}
                    onDragEnd={onDragEndPhase}
                    className="flex w-full group/phase border-t border-slate-200/50 relative z-10"
                  >
                    <div className={`flex-shrink-0 sticky left-0 z-30 border-r border-slate-300 flex items-center h-[48px] md:h-[40px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-[width,background-color] duration-300 ease-in-out overflow-hidden
                      ${draggedPhase?.projectId === project.id && draggedPhase?.phaseIndex === phaseIndex ? 'opacity-40 bg-slate-200' : 'bg-slate-50/50 group-hover/phase:bg-slate-100/60'} 
                      ${isSelected ? '!bg-blue-50/50' : ''}`} 
                      style={{ width: currentLeftWidth }}
                    >
                      {isLeftPanelCollapsed ? (
                        <div className="w-full flex justify-center cursor-pointer h-full items-center" onClick={() => setIsLeftPanelCollapsed(false)} title={`Expand - ${phase.title}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        </div>
                      ) : (
                        <div className="flex w-full items-center pl-6 md:pl-8 pr-2 md:pr-3 overflow-hidden">
                          {!isReadOnly && isAdmin && <div className="w-6 flex justify-center items-center h-full opacity-100 md:opacity-0 md:group-hover/phase:opacity-100 cursor-grab text-slate-400 hover:text-slate-600 mr-1 shrink-0"><Icons.Grip /></div>}
                          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-300 mr-2 flex-shrink-0"></div>
                          <input type="checkbox" disabled={isReadOnly || !isAdmin} checked={selectedPhaseIds.has(phase.id)} onChange={() => togglePhaseSelection(phase.id)} className="mr-2 w-4 h-4 md:w-3.5 md:h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-500 shrink-0" />
                          <input list="standard-phases-list" readOnly={isReadOnly || !isAdmin} value={phase.title} onChange={(e) => editPhaseTitle(project.id, phase.id, e.target.value)} className={`flex-1 bg-transparent text-sm md:text-xs text-slate-600 focus:outline-none focus:border-b border-blue-300 truncate min-w-0 ${(isReadOnly || !isAdmin) ? 'cursor-default' : ''}`} placeholder="Phase Title" />
                          {!isReadOnly && isAdmin && (
                            <>
                              <button onClick={() => removePhase(project.id, phase.id)} className="opacity-100 md:opacity-0 md:group-hover/phase:opacity-100 p-2 md:p-1 text-slate-400 hover:text-red-500 transition-opacity ml-1 shrink-0" title="Delete Phase"><Icons.Trash /></button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`flex-shrink-0 relative h-[48px] md:h-[40px] cursor-crosshair transition-colors ${isSelected ? 'bg-blue-50/20' : 'bg-transparent group-hover/phase:bg-slate-50/40'}`} style={{ width: gridWidth }} onClick={(e) => handleGridClick(e, project.id, phase.id)}>
                      {hasTimeline && (
                        <div 
                          onMouseDown={(e) => {
                            dragStartPos.current = { x: e.clientX, y: e.clientY };
                            !isReadOnly && handleBlockMouseDown(e, project.id, phase.id, 'move', phase.start, phase.end);
                          }}
                          onTouchStart={(e) => !isReadOnly && handleBlockMouseDown(e, project.id, phase.id, 'move', phase.start, phase.end)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y) > 10) return;
                            handleBlockClick(e, project.id, phase, colorIndex);
                          }}
                          className={`absolute top-[8px] md:top-[6px] h-[32px] md:h-[28px] rounded shadow text-xs font-semibold text-white px-2 flex items-center justify-between overflow-hidden z-10 timeline-block touch-none 
                            ${isCompleted ? 'completed-block' : ''} ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500 scale-[1.02]' : ''} ${(globalLocked || project.isLocked || phase.isLocked) ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                          `}
                          style={{ 
                            left: `${left}px`, 
                            width: `${Math.max(width, zoomLevel/2)}px`, 
                            backgroundColor: (phaseColors && phaseColors[phase.title]) || getPhaseColor(project.color, colorIndex) 
                          }}
                        >
                        <span className="truncate drop-shadow-md flex items-center gap-1">{(globalLocked || project.isLocked || phase.isLocked) && <Icons.Lock className="w-3 h-3" />} {abbreviatePhase(phase.title)} ({durationWeeks}w)</span>
                        {taskCount > 0 && width > 100 && <span className="text-[9px] bg-black/20 px-1.5 rounded-full ml-2 flex-shrink-0">{doneCount}/{taskCount}</span>}

                        {!isReadOnly && isAdmin && (
                          <>
                            <div className="resize-handle resize-handle-left touch-none drag-handle" onMouseDown={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-left', phase.start, phase.end)} onTouchStart={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-left', phase.start, phase.end)}></div>
                            <div className="resize-handle resize-handle-right touch-none drag-handle" onMouseDown={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-right', phase.start, phase.end)} onTouchStart={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-right', phase.start, phase.end)}></div>
                          </>
                        )}
                          <div className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none opacity-80" style={{ backgroundColor: getIndicatorColor(project.color) }}></div>
                          <div className="absolute bottom-[2px] left-0 right-0 h-2 pointer-events-none">
                            {(phase.tasks || []).flatMap((task, tIdx) => {
                              return (task.allocations || []).map((alloc, aIdx) => {
                                if (!alloc.start || !alloc.end) return null;
                                const allocLeft = getDayOffset(phase.start!, alloc.start, !!hideWeekends) * zoomLevel;
                                const durationDays = diffDays(alloc.start, alloc.end) + 1;
                                const allocWidth = countVisibleDays(alloc.start, alloc.end, !!hideWeekends) * zoomLevel;
                                return <div key={`${task.id}_${alloc.id}`} className="absolute h-[1.5px] bg-white/70 shadow-sm rounded-full" style={{ left: `${allocLeft}px`, width: `${Math.max(allocWidth, 4)}px`, bottom: `${1 + (tIdx % 3)*2}px` }} />
                              });
                            })}
                          </div>
                        </div>
                      )}
                        {(phase.milestones || []).map(milestone => {
                          if (!milestone.date) return null;
                          return (
                            <div key={milestone.id} className="absolute top-[8px] md:top-[6px] z-20 flex flex-col items-center pointer-events-none drop-shadow-md" style={{ left: `${getDayOffset(timelineStart, milestone.date, !!hideWeekends) * zoomLevel}px`, transform: 'translateX(-50%)' }}>
                              <Icons.Flag className="text-amber-400" />
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
            </div>
            )
          })}

          <div className="flex w-full mt-2 mb-6">
            <div className="flex-shrink-0 sticky left-0 z-30 px-3 py-2 transition-[width] duration-300 ease-in-out overflow-hidden flex items-center gap-2" style={{ width: currentLeftWidth }}>
              {!isLeftPanelCollapsed && !isReadOnly && isAdmin && (
                <>
                  <button onClick={addProject} className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-lg p-2 text-sm font-medium transition-colors whitespace-nowrap">
                    <Icons.Plus /> New Project
                  </button>
                  {hiddenCount > 0 && (
                    <button onClick={() => setShowHiddenProjects(!showHiddenProjects)} className="flex items-center justify-center gap-1 border-2 border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg p-2 text-sm font-medium transition-colors whitespace-nowrap px-4" title="Toggle Hidden Projects">
                      {showHiddenProjects ? <Icons.EyeOff /> : <Icons.Eye />} {hiddenCount}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
