import React from 'react';
import { Collection, Project } from '../types';
import { Icons } from '../icons';
import { diffDays, formatDate, addDays, getDayOffset, countVisibleDays } from '../utils';
import { getIndicatorColor, getPhaseColor } from '../constants';

interface OverviewViewProps {
  overviewData: { collectionId: string; collectionTitle: string; projects: (Project & { calculatedStart: Date; calculatedEnd: Date; collectionName: string })[] }[];
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
  setIsResizingCol: (resizing: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  phaseColors?: Record<string, string>;
  handleBlockMouseDown?: (e: any, projectId: string, phaseId: string, type: string, origStart: Date | null, origEnd: Date | null) => void;
  isAdmin?: boolean;
  isReadOnly?: boolean;
  globalLocked?: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  overviewData, currentLeftWidth, gridWidth, weeks, zoomLevel, timelineStart, today, totalDays,
  hideWeekends, isLeftPanelCollapsed, setIsLeftPanelCollapsed, setIsResizingCol, scrollContainerRef, phaseColors,
  handleBlockMouseDown, isAdmin, isReadOnly, globalLocked
}) => {
  const [tappedBlock, setTappedBlock] = React.useState<{ project: any; phase: any; durationWeeks: string } | null>(null);
  const dragStartPos = React.useRef({ x: 0, y: 0 });

  return (
    <div id="timeline-scroll-container" className="flex-1 overflow-auto overscroll-none bg-white relative touch-pan-x touch-pan-y" ref={scrollContainerRef}>
      {/* Mobile Block Details Card */}
      {tappedBlock && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 z-50 animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: getIndicatorColor(tappedBlock.project.color) }}></div>
              <h4 className="text-sm font-extrabold text-white truncate">{tappedBlock.project.title}</h4>
            </div>
            <button onClick={() => setTappedBlock(null)} className="text-slate-400 hover:text-white p-0.5 rounded touch-manipulation">
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-xs flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-slate-400">Phase:</span>
              <span className="font-bold text-white">{tappedBlock.phase.title}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-slate-400">Duration:</span>
              <span className="font-bold text-blue-400">{tappedBlock.durationWeeks} weeks</span>
            </div>
            {tappedBlock.phase.start && tappedBlock.phase.end && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold text-slate-400">Dates:</span>
                <span className="text-[11px] font-mono text-slate-300">{formatDate(tappedBlock.phase.start)} - {formatDate(tappedBlock.phase.end)}</span>
              </div>
            )}
          </div>
        </div>
      )}

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
              <button onClick={() => setIsLeftPanelCollapsed(false)} className="w-full flex justify-center text-slate-400 hover:text-slate-700" title="Expand Panel"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg></button>
            ) : (
              <>
                <span className="text-xs font-bold text-slate-500 uppercase w-full truncate pr-2">All Collections Overview</span>
                <button onClick={() => setIsLeftPanelCollapsed(true)} className="text-slate-400 hover:text-slate-700 flex-shrink-0" title="Collapse Panel"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg></button>
              </>
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
                  
                  // Ensure we calculate full days accurately
                  const segmentWidth = countVisibleDays(currDate, endOfSegment, !!hideWeekends) * zoomLevel;
                  
                  months.push({ 
                    name: currDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), 
                    width: segmentWidth 
                  });
                  
                  currDate = new Date(y, m + 1, 1); // Move to 1st of next month
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
          {overviewData.map(collection => (
            <React.Fragment key={collection.collectionId}>
              <div className="flex w-full group relative z-20 bg-slate-100 border-b border-slate-200">
                <div className="flex-shrink-0 sticky left-0 z-30 bg-slate-100 border-r border-slate-300 flex items-center h-[36px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] px-3 md:px-4" style={{ width: currentLeftWidth }}>
                  {!isLeftPanelCollapsed ? (
                    <span className="text-[10px] md:text-xs font-extrabold text-slate-700 uppercase tracking-wider truncate">{collection.collectionTitle}</span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 uppercase truncate text-center w-full">{collection.collectionTitle.substring(0, 2)}</span>
                  )}
                </div>
                <div className="flex-shrink-0 relative h-[36px] flex items-center" style={{ width: gridWidth }}>
                  {/* Sticky Collection Header Tag for Horizontal Scrolling */}
                  <div 
                    className="sticky z-10 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-200/90 px-2 py-0.5 rounded shadow-xs"
                    style={{ left: `calc(${currentLeftWidth}px + 8px)` }}
                  >
                    <span>{collection.collectionTitle}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({collection.projects.length} projects)</span>
                  </div>
                </div>
              </div>
              
              {collection.projects.map(project => (
                <div key={project.id} className="flex flex-col relative border-b border-slate-100 bg-transparent hover:bg-slate-50 transition-colors z-10 h-[48px]">
                  <div className="flex w-full relative z-20 h-full">
                    <div className="flex-shrink-0 sticky left-0 z-30 bg-white border-r border-slate-300 flex items-center h-[48px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] px-2 md:px-4" style={{ width: currentLeftWidth }}>
                      {!isLeftPanelCollapsed ? (
                        <div className="flex w-full items-center pr-1 min-w-0">
                          <div className="w-3.5 h-3.5 md:w-3 md:h-3 rounded-full mr-1.5 md:mr-2 shrink-0 shadow-sm" style={{backgroundColor: getIndicatorColor(project.color)}}></div>
                          <span className="text-xs md:text-sm font-extrabold md:font-bold text-slate-900 md:text-slate-800 truncate tracking-tight" title={project.title}>{project.title}</span>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-center cursor-pointer h-full relative group/tip" onClick={() => setIsLeftPanelCollapsed(false)} title={`Expand - ${project.title}`}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0" style={{ backgroundColor: getIndicatorColor(project.color) }}>
                            {project.title.substring(0, 1).toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 relative h-[48px]" style={{ width: gridWidth }}>
                      {project.phases.map((phase, pIdx) => {
                        if (!phase.start || !phase.end) return null;
                        const left = getDayOffset(timelineStart, phase.start, !!hideWeekends) * zoomLevel;
                        const durationDays = diffDays(phase.start, phase.end) + 1;
                        const width = countVisibleDays(phase.start, phase.end, !!hideWeekends) * zoomLevel;
                        const isVisible = left + width >= 0 && left <= gridWidth;
                        const durationWeeks = (durationDays / 7).toFixed(1).replace(/\.0$/, '');

                        return (
                          <React.Fragment key={phase.id}>
                            {isVisible && (
                              <div 
                                onMouseDown={(e) => {
                                  dragStartPos.current = { x: e.clientX, y: e.clientY };
                                  if (!isReadOnly && !globalLocked && !project.isLocked && handleBlockMouseDown) {
                                    handleBlockMouseDown(e, project.id, phase.id, 'move', phase.start, phase.end);
                                  }
                                }}
                                onTouchStart={(e) => {
                                  if (e.touches && e.touches[0]) {
                                    dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                                  }
                                  if (!isReadOnly && !globalLocked && !project.isLocked && handleBlockMouseDown) {
                                    handleBlockMouseDown(e, project.id, phase.id, 'move', phase.start, phase.end);
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentPos = (e.clientX && e.clientY) ? { x: e.clientX, y: e.clientY } : dragStartPos.current;
                                  if (Math.hypot(currentPos.x - dragStartPos.current.x, currentPos.y - dragStartPos.current.y) > 10) return;
                                  setTappedBlock({ project, phase, durationWeeks });
                                }}
                                className={`absolute top-[8px] h-[32px] rounded-md shadow-sm text-xs font-semibold text-white px-2 flex flex-col justify-center overflow-hidden z-10 timeline-block touch-none select-none ${(globalLocked || project.isLocked) ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                                style={{ 
                                  left: `${left}px`, 
                                  width: `${Math.max(width, zoomLevel/2)}px`, 
                                  backgroundColor: (phaseColors && phaseColors[phase.title]) || getPhaseColor(project.color, pIdx % 6) 
                                }}
                                title={`${project.title} - ${phase.title} (${formatDate(phase.start)} - ${formatDate(phase.end)}) - Drag to move or shrink/expand`}
                              >
                                <div className="truncate drop-shadow-md flex items-center gap-1.5 min-w-0">
                                  {(globalLocked || project.isLocked) && <Icons.Lock className="w-2.5 h-2.5 shrink-0 text-amber-300" />}
                                  <span className="truncate font-semibold tracking-tight">
                                    <span className="font-extrabold text-white mr-1 opacity-95">{project.title}:</span>
                                    <span className="opacity-90">{phase.title} ({durationWeeks}w)</span>
                                  </span>
                                </div>
                                {!isReadOnly && isAdmin && !globalLocked && !project.isLocked && handleBlockMouseDown && (
                                  <>
                                    <div 
                                      className="resize-handle resize-handle-left touch-none drag-handle" 
                                      onMouseDown={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-left', phase.start, phase.end)} 
                                      onTouchStart={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-left', phase.start, phase.end)}
                                      title="Drag to shrink/expand start"
                                    />
                                    <div 
                                      className="resize-handle resize-handle-right touch-none drag-handle" 
                                      onMouseDown={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-right', phase.start, phase.end)} 
                                      onTouchStart={(e) => handleBlockMouseDown(e, project.id, phase.id, 'resize-right', phase.start, phase.end)}
                                      title="Drag to shrink/expand end"
                                    />
                                  </>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none opacity-80" style={{ backgroundColor: getIndicatorColor(project.color) }}></div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        </div>
      </div>
    );
};
