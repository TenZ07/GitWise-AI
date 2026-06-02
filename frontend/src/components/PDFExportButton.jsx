import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const PDFExportButton = ({ displayData, elementId }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const loadingToast = toast.loading('Generating professional report...', { duration: 0 });

    try {
      if (!elementId) {
        throw new Error('Element ID not provided');
      }

      // Get the DOM element to capture
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      // Configure html2canvas options for better rendering
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY, // Capture the element as-is on the page
        windowHeight: element.scrollHeight, // Use element's full height
        windowWidth: element.scrollWidth // Use element's full width
      });

      // Format filename
      const repoName = displayData?.repoName || 'repository';
      const owner = displayData?.owner || 'unknown';
      const date = new Date().toISOString().split('T')[0];
      const filename = `GitWise-Report-${owner}-${repoName}-${date}.pdf`;

      // PDF configuration
      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };

      // Generate PDF from canvas
      await html2pdf().set(opt).from(canvas, 'canvas').save();

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