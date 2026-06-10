import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import { generatePDFReport } from '../utils/pdfReportTemplate';

const PDFExportButton = ({ displayData }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const loadingToast = toast.loading('Generating professional report...', { duration: 0 });

    try {
      // 1. Generate HTML content (Now just a div, not a full document)
      const htmlContent = generatePDFReport(displayData);

      // 2. Create temporary container
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // 3. Style it to be off-screen but fully rendered (opacity:1 so html2canvas can capture it)
      tempDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: -9999px;
        width: 794px;
        background: white;
        z-index: -9999;
        opacity: 1;
        pointer-events: none;
        overflow: visible;
      `;
      
      document.body.appendChild(tempDiv);

      // 4. Wait for the DOM to fully paint (important for html2canvas)
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Format filename
      const repoName = displayData?.repoName || 'repository';
      const owner = displayData?.owner || 'unknown';
      const date = new Date().toISOString().split('T')[0];
      const filename = `GitWise-Report-${owner}-${repoName}-${date}.pdf`;

      // 6. PDF configuration
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      // 7. Generate PDF
      await html2pdf().set(opt).from(tempDiv).save();

      // 8. Cleanup
      document.body.removeChild(tempDiv);

      toast.success('Professional report exported!', { id: loadingToast, duration: 3000 });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error(`Failed to export: ${error.message}`, { id: loadingToast, duration: 4000 });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
        isExporting
          ? 'bg-gray-800 text-gray-400 border-gray-700 cursor-not-allowed'
          : 'bg-accent/10 text-accent border-accent/30 hover:bg-accent hover:text-black'
      }`}
      title="Export professional PDF report"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Generating...</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Export Report</span>
        </>
      )}
    </button>
  );
};

export default PDFExportButton;