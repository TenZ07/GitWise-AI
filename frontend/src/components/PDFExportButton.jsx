import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';

const PDFExportButton = ({ displayData, elementId = 'pdf-content' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const loadingToast = toast.loading('Generating PDF...', { duration: 0 });

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Content not found');
      }

      // Clone element to avoid modifying the original
      const clone = element.cloneNode(true);
      
      // Add PDF-specific styling
      clone.classList.add('pdf-export-mode');
      
      // Remove interactive elements for PDF
      const interactiveElements = clone.querySelectorAll(
        'button, .no-print, [data-no-print]'
      );
      interactiveElements.forEach(el => el.remove());

      // Format filename
      const repoName = displayData?.repoName || 'repository';
      const owner = displayData?.owner || 'unknown';
      const date = new Date().toISOString().split('T')[0];
      const filename = `GitWise-Report-${owner}-${repoName}-${date}.pdf`;

      // PDF configuration
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#000000',
          logging: false,
          letterRendering: true,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['.no-page-break']
        }
      };

      // Generate PDF
      await html2pdf().set(opt).from(clone).save();
      
      toast.success('PDF exported successfully!', { 
        id: loadingToast,
        duration: 3000 
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error(`Failed to export PDF: ${error.message}`, { 
        id: loadingToast,
        duration: 4000 
      });
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
      title="Export analysis as PDF"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Export PDF</span>
        </>
      )}
    </button>
  );
};

export default PDFExportButton;