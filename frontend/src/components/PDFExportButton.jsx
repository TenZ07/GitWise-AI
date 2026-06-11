import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import { generatePDFReport } from '../utils/pdfReportTemplate';

const PDFExportButton = ({ displayData }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    console.log('[PDF EXPORT] Initializing PDF generation...');
    const loadingToast = toast.loading('Generating professional report...', { duration: 0 });

    let tempDiv = null;

    try {
      // 1. Generate HTML content
      const htmlContent = generatePDFReport(displayData);
      console.log(`[PDF EXPORT] HTML report template generated. Length: ${htmlContent?.length || 0} characters.`);

      // 2. Create temporary container
      tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // 3. Style the temp div to be in-viewport (at 0,0) but hidden behind everything
      // (left: 0, top: 0 allows html2canvas to capture it within windowWidth bounds)
      tempDiv.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 794px;
        background: white;
        z-index: -99999;
        opacity: 1;
        visibility: visible;
        pointer-events: none;
        overflow: visible;
        display: block;
      `;
      
      document.body.appendChild(tempDiv);
      console.log('[PDF EXPORT] Temporary div appended to body at origin (0, 0) under z-index -99999.');

      // 4. Wait for the DOM to fully paint (important for html2canvas to render completely)
      console.log('[PDF EXPORT] Waiting 500ms for DOM repaint...');
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[PDF EXPORT] tempDiv dimensions:', tempDiv.offsetWidth, 'x', tempDiv.offsetHeight);
      console.log('[PDF EXPORT] tempDiv bounding rect:', tempDiv.getBoundingClientRect());
      const container = tempDiv.querySelector('#pdf-report-container');
      if (container) {
        console.log('[PDF EXPORT] container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
        console.log('[PDF EXPORT] container children count:', container.children.length);
        Array.from(container.children).forEach((child, i) => {
          console.log(`[PDF EXPORT] child ${i} (${child.tagName}.${child.className.replace(/\s+/g, '.')}):`, child.offsetWidth, 'x', child.offsetHeight);
        });
      } else {
        console.error('[PDF EXPORT] #pdf-report-container not found in tempDiv!');
      }

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
          logging: true, // Enabled logging to aid troubleshooting in browser console
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

      console.log('[PDF EXPORT] Launching html2pdf.js render and save targeting #pdf-report-container...');
      // 7. Generate PDF
      if (container) {
        await html2pdf().set(opt).from(container).save();
      } else {
        await html2pdf().set(opt).from(tempDiv).save();
      }
      console.log('[PDF EXPORT] PDF saved successfully.');

      toast.success('Professional report exported!', { id: loadingToast, duration: 3000 });
    } catch (error) {
      console.error('[PDF EXPORT] Error during PDF generation:', error);
      toast.error(`Failed to export: ${error.message}`, { id: loadingToast, duration: 4000 });
    } finally {
      // 8. Cleanup
      console.log('[PDF EXPORT] Cleaning up temporary DOM elements...');
      if (tempDiv && tempDiv.parentNode) {
        document.body.removeChild(tempDiv);
        console.log('[PDF EXPORT] Temporary div removed from body.');
      }
      setIsExporting(false);
      console.log('[PDF EXPORT] PDF export flow complete.');
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