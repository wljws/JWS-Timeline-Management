import React, { useState, useRef, useMemo } from 'react';
import { Icons } from '../icons';
import { Project, Phase, Milestone, Task } from '../types';
import { getPhaseColor, COLOR_PALETTES } from '../constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportModalProps {
  projects: Project[];
  phaseColors: Record<string, string>;
  onClose: () => void;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({ projects, phaseColors, onClose }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'all');
  const [pageSize, setPageSize] = useState<'a4' | 'a3' | 'letter'>('a3');
  const [orientation, setOrientation] = useState<'p' | 'l'>('l');
  const [isExporting, setIsExporting] = useState(false);
  
  // Date selection states
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDateStr, setEndDateStr] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 11);
    d.setDate(28); // Roughly 1 year total
    return d.toISOString().split('T')[0];
  });

  const exportRef = useRef<HTMLDivElement>(null);

  const timelineStart = useMemo(() => new Date(startDateStr), [startDateStr]);
  const timelineEnd = useMemo(() => new Date(endDateStr), [endDateStr]);

  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  const zoomLevel = 30; // Fixed zoom for export consistency
  const gridWidth = totalDays * zoomLevel;

  const handleExport = async () => {
    if (totalDays <= 0) {
      alert("End date must be after start date");
      return;
    }
    setIsExporting(true);
    try {
      if (!exportRef.current) return;

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      
      let finalWidth = pdfWidth - 20; // 10mm margins
      let finalHeight = finalWidth / ratio;
      
      if (finalHeight > pdfHeight - 20) {
        finalHeight = pdfHeight - 20;
        finalWidth = finalHeight * ratio;
      }
      
      pdf.addImage(imgData, 'PNG', 10, 10, finalWidth, finalHeight);
      pdf.save(`timeline-${selectedProjectId}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      onClose();
    } catch (error) {
      console.error("PDF Export failed", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedProjects = useMemo(() => {
    if (selectedProjectId === 'all') return projects;
    return projects.filter(p => p.id === selectedProjectId);
  }, [selectedProjectId, projects]);

  // Helper for grid rendering
  const months = useMemo(() => {
    const list = [];
    let curr = new Date(timelineStart);
    curr.setDate(1); // Start at beginning of month
    while (curr < timelineEnd) {
      list.push(new Date(curr));
      curr.setMonth(curr.getMonth() + 1);
    }
    return list;
  }, [timelineStart, timelineEnd]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Icons.Download className="text-blue-600" /> Export Project PDF
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <Icons.X />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Project</label>
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="all">All Active Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline Start</label>
              <input 
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline End</label>
              <input 
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page Size</label>
              <select 
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="a4">A4</option>
                <option value="a3">A3 (Recommended)</option>
                <option value="letter">Letter</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orientation</label>
              <select 
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="l">Landscape</option>
                <option value="p">Portrait</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          <button 
            disabled={isExporting}
            onClick={handleExport}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
          >
            {isExporting ? <><Icons.Spinner className="animate-spin" /> Generating...</> : <><Icons.Download /> Generate PDF</>}
          </button>
        </div>

        {/* Hidden Export Render Area - Fixed very far off-screen to avoid bleeding */}
        <div style={{ position: 'fixed', left: '-50000px', top: '-50000px', pointerEvents: 'none', opacity: 0, zIndex: -1000 }}>
          <div ref={exportRef} style={{ width: `${gridWidth + 300}px`, backgroundColor: 'white', padding: '40px', fontFamily: '"Inter", sans-serif' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Project Timeline Report</h1>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Generated on {new Date().toLocaleDateString()}</div>
            </div>

            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Sidebar Header */}
              <div style={{ width: '300px', flexShrink: 0, borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '10px' }}>
                 <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects & Phases</div>
              </div>
              
              {/* Timeline Header */}
              <div style={{ flex: 1, backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', justifyContent: 'center', backgroundColor: '#ffffff' }}>
                  <div style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{timelineStart.getFullYear()}</div>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                  {months.map((m, i) => {
                    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
                    return (
                      <div key={i} style={{ width: `${days * zoomLevel}px`, borderRight: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <div style={{ padding: '6px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                          {m.toLocaleDateString('en-US', { month: 'long' })}
                        </div>
                        <div style={{ display: 'flex' }}>
                          {[...Array(Math.ceil(days/7))].map((_, wi) => (
                             <div key={wi} style={{ flex: 1, fontSize: '8px', textAlign: 'center', color: '#94a3b8', padding: '3px', borderRight: '1px solid #f8fafc' }}>
                               W{wi+1}
                             </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Project Rows */}
            {selectedProjects.map(project => (
              <div key={project.id} style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                {/* Project Title Row */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fdfdfe' }}>
                  <div style={{ width: '300px', borderRight: '1px solid #e2e8f0', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: COLOR_PALETTES[project.color]?.[1] || project.color }} />
                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>{project.title}</span>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '44px' }}>
                     {/* Horizontal alignment lines */}
                     <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                        {months.map((m, i) => {
                          const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
                          return (
                            <div key={i} style={{ width: `${days * zoomLevel}px`, height: '100%', borderRight: '1px solid #f1f5f9', flexShrink: 0 }} />
                          );
                        })}
                     </div>
                  </div>
                </div>

                {/* Phases */}
                {project.phases.map((phase, pIdx) => {
                  if (!phase.start || !phase.end) return null;
                  
                  const startOffset = Math.floor((phase.start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                  const duration = Math.ceil((phase.end.getTime() - phase.start.getTime()) / (1000 * 60 * 60 * 24));
                  const bgColor = phaseColors[phase.title] || getPhaseColor(project.color, pIdx);

                  return (
                    <div key={phase.id} style={{ display: 'flex', borderBottom: pIdx === project.phases.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                      <div style={{ width: '300px', borderRight: '1px solid #e2e8f0', padding: '8px 12px 8px 40px', display: 'flex', alignItems: 'center', backgroundColor: '#ffffff' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1', marginRight: '10px' }} />
                        <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{phase.title}</span>
                      </div>
                      <div style={{ flex: 1, position: 'relative', height: '36px', backgroundColor: '#ffffff' }}>
                        {/* Vertical Grid Lines */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                          {months.map((m, i) => {
                            const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
                            return (
                              <div key={i} style={{ width: `${days * zoomLevel}px`, height: '100%', borderRight: '1px solid #f8fafc', flexShrink: 0 }} />
                            );
                          })}
                        </div>
                        
                        {(startOffset + duration > 0 && startOffset < totalDays) && (
                          <div style={{
                            position: 'absolute',
                            left: `${Math.max(0, startOffset) * zoomLevel}px`,
                            width: `${Math.min(duration, totalDays - startOffset) * zoomLevel}px`,
                            top: '6px',
                            height: '24px',
                            backgroundColor: bgColor,
                            border: `1px solid rgba(0,0,0,0.1)`,
                            borderRadius: '6px',
                            padding: '0 10px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}>
                             <span style={{ marginRight: '4px' }}>{phase.title}</span>
                             <span style={{ fontSize: '9px', fontWeight: 'normal', opacity: 0.9 }}>({Math.round(duration/7 * 10)/10}w)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{ height: '4px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
