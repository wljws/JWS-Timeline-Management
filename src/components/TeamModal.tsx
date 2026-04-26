import React from 'react';
import { Icons } from '../icons';
import { Project, AdHocTask, Task, Allocation } from '../types';
import { getPhaseColor } from '../constants';
import { formatDate, generateId } from '../utils';

interface TeamModalProps {
  teamModalData: { projectId: string; phaseId: string; taskId: string; allocationId: string; isAdHoc?: boolean };
  isReadOnly: boolean;
  projects: Project[];
  adHocTasks: AdHocTask[];
  setTeamModalData: (data: any) => void;
  updateAdHocTaskProjectTitle: (id: string, title: string) => void;
  updateAdHocTaskText: (id: string, text: string) => void;
  updateAdHocTaskColor: (id: string, color: string) => void;
  updateAdHocTaskDone: (id: string, done: boolean) => void;
  toggleSubTask: (allocId: string, subId: string) => void;
  addSubTask: (allocId: string) => void;
  updateSubTaskText: (allocId: string, subId: string, text: string) => void;
  deleteSubTask: (allocId: string, subId: string) => void;
  deleteAdHocTask: (id: string) => void;
  usedColors: string[];
}

export const TeamModal: React.FC<TeamModalProps> = ({
  teamModalData, isReadOnly, projects, adHocTasks, setTeamModalData,
  updateAdHocTaskProjectTitle, updateAdHocTaskText, updateAdHocTaskColor, updateAdHocTaskDone,
  toggleSubTask, addSubTask, updateSubTaskText, deleteSubTask, deleteAdHocTask, usedColors
}) => {
  if (teamModalData.isAdHoc) {
    const task = adHocTasks.find(t => t.id === teamModalData.taskId);
    if (!task) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex justify-center items-end md:items-center p-0 md:p-2" onMouseDown={() => setTeamModalData(null)}>
        <div className="bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full max-w-[450px] overflow-hidden flex flex-col max-h-[90vh]" onMouseDown={e => e.stopPropagation()}>
          <div className="p-5 text-white flex justify-between items-start" style={{ backgroundColor: getPhaseColor(task.color || 'slate', 1) }}>
            <div className="w-full mr-4">
              <input 
                value={task.projectTitle || 'Manual Task'} 
                readOnly={isReadOnly}
                onChange={(e) => updateAdHocTaskProjectTitle(task.id, e.target.value)} 
                className="text-xs opacity-80 font-medium uppercase mb-1 tracking-wider bg-transparent focus:outline-none border-b border-transparent hover:border-white/30 focus:border-white/50 w-full transition-colors"
                placeholder="Project / Category"
              />
              <input value={task.text} readOnly={isReadOnly} onChange={(e) => updateAdHocTaskText(task.id, e.target.value)} className="bg-transparent text-xl font-bold leading-tight w-full focus:outline-none border-b border-transparent hover:border-white/30 focus:border-white/50 transition-colors" placeholder="Task description..." autoFocus={!isReadOnly} />
              
              {!isReadOnly && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {usedColors.map(c => (
                    <div 
                      key={c} 
                      onClick={() => updateAdHocTaskColor(task.id, c)} 
                      className={`w-4 h-4 rounded-full cursor-pointer hover:scale-110 shadow-sm border ${(task.color === c) || (!task.color && c === 'slate') ? 'border-white ring-2 ring-white/50' : 'border-white/30'} transition-all`} 
                      style={{backgroundColor: c.startsWith('#') ? c : ''}} 
                      title="Change Task Color"
                    ></div>
                  ))}
                  <div className="w-px h-4 bg-white/30 mx-0.5"></div>
                  <label className={`w-4 h-4 rounded-full cursor-pointer hover:scale-110 overflow-hidden relative shadow-inner flex-shrink-0 border ${(task.color?.startsWith('#')) ? 'border-white ring-2 ring-white/50' : 'border-white/30'}`} title="Custom Color">
                    <input type="color" value={task.color && task.color.startsWith('#') ? task.color : '#000000'} onChange={(e) => updateAdHocTaskColor(task.id, e.target.value)} className="absolute -top-2 -left-2 w-8 h-8 opacity-0 cursor-pointer" />
                    <div className="w-full h-full bg-[conic-gradient(red,yellow,lime,aqua,blue,fuchsia,red)]"></div>
                  </label>
                </div>
              )}
            </div>
            <button onClick={() => setTeamModalData(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors bg-black/5 shrink-0"><Icons.X /></button>
          </div>
          
          <div className="p-5 overflow-y-auto">
            <div className="text-xs text-slate-600 mb-6 bg-slate-50 border border-slate-200 p-4 rounded shadow-sm flex items-center justify-between">
              <div>
                <strong>Scheduled Block: </strong><br/>
                <span className="text-sm mt-1 inline-block">
                  {formatDate(task.start)} ({task.start?.getHours()! < 12 ? 'AM' : 'PM'}) {" - "} {formatDate(task.end)} ({task.end?.getHours()! < 12 ? 'AM' : 'PM'})
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer ml-4 bg-white px-3 py-1.5 rounded border border-slate-200 hover:bg-blue-50 transition-colors">
                <input type="checkbox" disabled={isReadOnly} checked={task.done || false} onChange={(e) => updateAdHocTaskDone(task.id, e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-500 disabled:opacity-50" />
                <span className="font-bold text-xs text-slate-700">Mark Completed</span>
              </label>
            </div>

            <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-800">Daily Sub-Tasks</h3>
            </div>
            
            <div className="space-y-3">
              {(!task.subTasks || task.subTasks.length === 0) ? (
                <p className="text-sm text-slate-400 italic py-4 text-center">No sub-tasks added.</p>
              ) : (
                task.subTasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-3 group border border-slate-100 rounded p-2 hover:bg-slate-50">
                    <input type="checkbox" checked={sub.done} disabled={isReadOnly} onChange={() => toggleSubTask(task.id, sub.id)} className="w-5 h-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500 cursor-pointer accent-slate-500 flex-shrink-0 disabled:opacity-50" />
                    <input value={sub.text} readOnly={isReadOnly} onChange={(e) => updateSubTaskText(task.id, sub.id, e.target.value)} className={`flex-1 text-base bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none py-1 ${sub.done ? 'text-slate-400 line-through' : 'text-slate-700'}`} placeholder="Sub-task details..." />
                    {!isReadOnly && <button onClick={() => deleteSubTask(task.id, sub.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-2"><Icons.Trash /></button>}
                  </div>
                ))
              )}
            </div>
            {!isReadOnly && (
              <>
                <button onClick={() => addSubTask(task.id)} className="text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center justify-center border border-dashed border-slate-300 rounded p-3 gap-2 mt-4 w-full transition-colors hover:bg-slate-50"><Icons.Plus /> Add Sub-Task</button>
                <button onClick={() => deleteAdHocTask(task.id)} className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center justify-center border border-dashed border-red-200 hover:bg-red-50 rounded p-3 gap-2 mt-4 w-full transition-colors"><Icons.Trash /> Delete Manual Task</button>
              </>
            )}
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-200 pb-8 md:pb-4">
            <button onClick={() => setTeamModalData(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-base font-bold py-3 rounded-lg shadow-md">Done</button>
          </div>
        </div>
      </div>
    );
  }

  const project = projects.find(p => p.id === teamModalData.projectId);
  const phase = project?.phases.find(ph => ph.id === teamModalData.phaseId);
  const task = phase?.tasks.find(t => t.id === teamModalData.taskId);
  const allocation = task?.allocations?.find(a => a.id === teamModalData.allocationId);
  
  if (!project || !phase || !task || !allocation) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex justify-center items-end md:items-center p-0 md:p-2" onMouseDown={() => setTeamModalData(null)}>
      <div className="bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full max-w-[450px] overflow-hidden flex flex-col max-h-[90vh]" onMouseDown={e => e.stopPropagation()}>
        <div className="p-5 text-white flex justify-between items-start" style={{ backgroundColor: getPhaseColor(project.color, 1) }}>
          <div>
            <p className="text-xs opacity-80 font-medium uppercase mb-1 tracking-wider">{project.title} / {phase.title}</p>
            <h2 className="text-xl font-bold leading-tight">{task.text}</h2>
          </div>
          <button onClick={() => setTeamModalData(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors bg-black/5"><Icons.X /></button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          <div className="text-xs text-slate-600 mb-6 bg-blue-50 border border-blue-100 p-4 rounded shadow-sm flex items-center justify-between">
            <div>
              <strong>Scheduled Block: </strong><br/>
              <span className="text-sm mt-1 inline-block">{formatDate(allocation.start)} ({allocation.start.getHours() < 12 ? 'AM' : 'PM'}) {" - "} {formatDate(allocation.end)} ({allocation.end.getHours() < 12 ? 'AM' : 'PM'})</span>
            </div>
          </div>

          <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-800">Daily Sub-Tasks</h3>
            <span className="text-[10px] text-slate-400">Hidden from main project view</span>
          </div>
          
          <div className="space-y-3">
            {(!allocation.subTasks || allocation.subTasks.length === 0) ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">No sub-tasks added.</p>
            ) : (
              allocation.subTasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 group border border-slate-100 rounded p-2 hover:bg-slate-50">
                  <input type="checkbox" checked={sub.done} disabled={isReadOnly} onChange={() => toggleSubTask(allocation.id, sub.id)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-500 flex-shrink-0 disabled:opacity-50" />
                  <input value={sub.text} readOnly={isReadOnly} onChange={(e) => updateSubTaskText(allocation.id, sub.id, e.target.value)} className={`flex-1 text-base bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none py-1 ${sub.done ? 'text-slate-400 line-through' : 'text-slate-700'}`} placeholder="Sub-task details..." />
                  {!isReadOnly && <button onClick={() => deleteSubTask(allocation.id, sub.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-2"><Icons.Trash /></button>}
                </div>
              ))
            )}
          </div>
          {!isReadOnly && <button onClick={() => addSubTask(allocation.id)} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center border border-dashed border-blue-200 rounded p-3 gap-2 mt-4 w-full"><Icons.Plus /> Add Sub-Task</button>}
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 pb-8 md:pb-4">
          <button onClick={() => setTeamModalData(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-base font-bold py-3 rounded-lg shadow-md">Done</button>
        </div>
      </div>
    </div>
  );
};
