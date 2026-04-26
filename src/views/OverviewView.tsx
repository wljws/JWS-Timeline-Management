import React from 'react';
import { Collection, Project } from '../types';
import { diffExactDays, formatDate } from '../utils';
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
  isLeftPanelCollapsed: boolean;
  setIsLeftPanelCollapsed: (collapsed: boolean) => void;
  setIsResizingCol: (resizing: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  phaseColors?: Record<string, string>;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  overviewData, currentLeftWidth, gridWidth, weeks, zoomLevel, timelineStart, today, totalDays,
  isLeftPanelCollapsed, setIsLeftPanelCollapsed, setIsResizingCol, scrollContainerRef, phaseColors
}) => {
  const diffDaysLocal = (date1: Date, date2: Date): number => {
    const d1 = new Date(date1); d1.setHours(0,0,0,0);
    const d2 = new Date(date2); d2.setHours(0,0,0,0);
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div id="timeline-scroll-container" className="flex-1 overflow-auto overscroll-none bg-white relative" ref={scrollContainerRef}>
      <div className="relative min-w-full w-max min-h-full">
        
        {/* Grid Background */}
        <div className="absolute top-[60px] bottom-0 flex pointer-events-none z-0" style={{ left: currentLeftWidth, width: gridWidth }}>
          {weeks.map((w, i) => (
            <div key={i} className="h-full border-r border-slate-300 relative" style={{ width: 7 * zoomLevel, minWidth: 7 * zoomLevel }}>
              <div className="absolute inset-0 flex">
                {[...Array(7)].map((_, dayIdx) => (
                  <div key={dayIdx} className="h-full border-r border-slate-100 border-dashed" style={{ width: zoomLevel }}></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Red Line */}
        {diffDaysLocal(timelineStart, today) >= 0 && diffDaysLocal(timelineStart, today) <= totalDays && (
          <div className="absolute top-[60px] bottom-0 w-[2px] bg-red-500 z-10 opacity-70 pointer-events-none transition-[left] duration-300 ease-in-out" style={{ left: currentLeftWidth + diffDaysLocal(timelineStart, today) * zoomLevel }}>
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
                let currentMonth = -1;
                let weeksInMonth = 0;
                for (let i = 0; i < totalDays; i += 7) {
                  const weekStart = new Date(timelineStart.getTime() + i * 24 * 60 * 60 * 1000);
                  const month = weekStart.getMonth();
                  if (month !== currentMonth) {
                    if (currentMonth !== -1) months[months.length - 1].colSpan = weeksInMonth * 7;
                    months.push({ name: weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), colSpan: 7 });
                    currentMonth = month;
                    weeksInMonth = 1;
                  } else {
                    weeksInMonth++;
                    months[months.length - 1].colSpan = weeksInMonth * 7;
                  }
                }
                if (months.length > 0) months[months.length - 1].colSpan = weeksInMonth * 7;
                return months.map((m, i) => (
                  <div key={i} className="flex items-center pl-2 border-r border-slate-300 truncate" style={{ width: m.colSpan * zoomLevel }}>
                    {m.name}
                  </div>
                ));
              })()}
            </div>
            <div className="flex h-[28px] bg-white text-[10px] text-slate-500 font-medium">
              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col justify-center items-center border-r border-slate-300 bg-slate-50 overflow-hidden px-1 py-[2px]" style={{ width: 7 * zoomLevel }}>
                  <span className="truncate leading-none">{w.label}</span>
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
                <div className="flex-shrink-0 sticky left-0 z-30 bg-slate-100 border-r border-slate-300 flex items-center h-[36px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] px-4" style={{ width: currentLeftWidth }}>
                  {!isLeftPanelCollapsed && <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">{collection.collectionTitle}</span>}
                </div>
                <div className="flex-shrink-0 relative h-[36px]" style={{ width: gridWidth }}></div>
              </div>
              
              {collection.projects.map(project => (
                <div key={project.id} className="flex flex-col relative border-b border-slate-100 bg-transparent hover:bg-slate-50 transition-colors z-10 h-[48px]">
                  <div className="flex w-full relative z-20 h-full">
                    <div className="flex-shrink-0 sticky left-0 z-30 bg-white border-r border-slate-300 flex items-center h-[48px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] px-2 md:px-6" style={{ width: currentLeftWidth }}>
                      {!isLeftPanelCollapsed && (
                        <div className="flex w-full items-center pr-1 min-w-0">
                          <div className="w-3 h-3 rounded-full mr-2 shrink-0" style={{backgroundColor: getIndicatorColor(project.color)}}></div>
                          <span className="text-sm font-semibold text-slate-800 truncate">{project.title}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 relative h-[48px]" style={{ width: gridWidth }}>
                        {project.phases.map((phase, pIdx) => {
                          if (!phase.start || !phase.end) return null;
                          const left = diffExactDays(timelineStart, phase.start) * zoomLevel;
                          const durationDays = diffExactDays(phase.start, phase.end) + 1;
                          const width = durationDays * zoomLevel;
                          const isVisible = left + width >= 0 && left <= gridWidth;
                          const durationWeeks = (durationDays / 7).toFixed(1).replace(/\.0$/, '');

                          return (
                            <React.Fragment key={phase.id}>
                              {isVisible && (
                                <div 
                                  className={`absolute top-[8px] h-[32px] rounded-md shadow-sm text-[10px] font-semibold text-white px-2 flex flex-col justify-center overflow-hidden z-10 timeline-block cursor-default`}
                                  style={{ 
                                    left: `${left}px`, 
                                    width: `${Math.max(width, zoomLevel/2)}px`, 
                                    backgroundColor: (phaseColors && phaseColors[phase.title]) || getPhaseColor(project.color, pIdx % 6) 
                                  }}
                                  title={`${project.title} - ${phase.title} (${formatDate(phase.start)} - ${formatDate(phase.end)})`}
                                >
                                  <div className="truncate drop-shadow-md">
                                    {phase.title} ({durationWeeks}w)
                                  </div>
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
