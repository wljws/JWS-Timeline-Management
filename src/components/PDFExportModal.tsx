import React, { useState } from 'react';
import { Icons } from '../icons';
import { Project } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportModalProps {
  projects: Project[];
  onClose: () => void;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({ projects, onClose }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [pageSize, setPageSize] = useState<'a4' | 'a3' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'p' | 'l'>('l');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Logic for PDF generation
      // We'll use a hidden element or a specific ref for high-quality capture
      const element = document.getElementById('timeline-grid-container');
      if (!element) {
        alert("Timeline container not found");
        setIsExporting(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`timeline-export-${selectedProjectId}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      onClose();
    } catch (error) {
      console.error("PDF Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Icons.Download className="text-blue-600" /> Export to PDF
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
              <option value="all">All Projects (Active View)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page Size</label>
              <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                {(['a4', 'a3', 'letter'] as const).map(size => (
                  <button 
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded capitalize transition-all ${pageSize === size ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orientation</label>
              <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button 
                  onClick={() => setOrientation('p')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${orientation === 'p' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Portrait
                </button>
                <button 
                  onClick={() => setOrientation('l')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${orientation === 'l' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Landscape
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          <button 
            disabled={isExporting}
            onClick={handleExport}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-200 flex justify-center items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <Icons.Download /> Generate PDF Report
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            PDF will include the selected project and timeline range as seen in the current view.
          </p>
        </div>
      </div>
    </div>
  );
};
