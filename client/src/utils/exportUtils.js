/**
 * Export table data to CSV
 */
export const exportToCSV = (data, filename = 'calculation', headers = null) => {
  if (!data || data.length === 0) return;

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [
    csvHeaders.join(','),
    ...data.map((row) =>
      csvHeaders
        .map((h) => {
          const val = row[h] !== undefined ? row[h] : '';
          // Escape commas and quotes
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Export report to PDF using browser print
 */
export const exportToPDF = (elementId, title = 'Financial Report') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - FinCalc India</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #333; line-height: 1.5; }
        h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; margin-top: 0; }
        h2 { color: #2d3748; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: right; }
        th { background: #edf2f7; font-weight: 600; text-align: center; }
        td:first-child { text-align: left; }
        .summary { display: flex; gap: 20px; margin: 15px 0; flex-wrap: wrap; }
        .summary-card { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; flex: 1; min-width: 150px; }
        .summary-label { color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-value { color: #1a365d; font-size: 20px; font-weight: bold; margin-top: 4px; }
        .disclaimer { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 4px; padding: 12px; margin-top: 20px; font-size: 11px; color: #744210; }
        .footer { margin-top: 30px; text-align: center; color: #a0aec0; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>FinCalc India - ${title}</h1>
      <p style="color: #718096;">Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
      ${element.innerHTML}
      <div class="disclaimer">
        <strong>Disclaimer:</strong> These calculations are estimates for informational purposes only. 
        Actual returns may vary. Investment in securities/markets is subject to market risks. 
        Please verify current rates and rules before making financial decisions.
      </div>
      <div class="footer">
        FinCalc India - Calculate. Compare. Plan Your Financial Future.
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

/**
 * Generate report data for a calculation
 */
export const generateReportData = (calculatorName, inputs, results) => {
  return {
    calculator: calculatorName,
    generatedAt: new Date().toISOString(),
    inputs,
    results,
  };
};

export default {
  exportToCSV,
  exportToPDF,
  generateReportData,
};
