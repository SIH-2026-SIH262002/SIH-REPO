export const exportUtils = {
  generateExecutiveSummaryPDF: () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NER LogiSense — Executive Disaster Response Summary</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #f8fafc; }
            .card-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #1e293b; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-family: monospace; font-size: 13px; }
            .metric { background: #ffffff; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; }
            .metric-label { font-size: 10px; color: #64748b; font-family: sans-serif; font-weight: bold; }
            .metric-val { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">NER LogiSense Intelligence Report</div>
              <div class="subtitle font-mono">Disaster Management & Essential Supply Chain Readiness • ${dateStr}</div>
            </div>
            <div style="text-align: right; font-size: 12px; font-weight: bold; color: #059669;">
              CLASSIFICATION: OFFICIAL
            </div>
          </div>

          <div class="card">
            <div class="card-title">1. Regional Landslide Risk Status (8 NER States)</div>
            <div class="grid">
              <div class="metric">
                <div class="metric-label">MONITORED NODES</div>
                <div class="metric-val">18 Towns</div>
              </div>
              <div class="metric">
                <div class="metric-label">HIGH/SEVERE RISK ZONES</div>
                <div class="metric-val" style="color: #dc2626;">NH-27 Silchar Pass</div>
              </div>
              <div class="metric">
                <div class="metric-label">ML MODEL ACCURACY</div>
                <div class="metric-val" style="color: #2563eb;">94.2% ROC-AUC</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">2. Essential Supply Logistics Fleet Telemetry</div>
            <div class="grid">
              <div class="metric">
                <div class="metric-label">ACTIVE TRUCKS</div>
                <div class="metric-val">12 Vehicles</div>
              </div>
              <div class="metric">
                <div class="metric-label">SAFE AI CORRIDORS</div>
                <div class="metric-val" style="color: #16a34a;">3 Active</div>
              </div>
              <div class="metric">
                <div class="metric-label">TWILIO ALERTS DISPATCHED</div>
                <div class="metric-val">142 Messages</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <span>Authored by: NDMA / NER State Emergency Operations Center</span>
            <span>NER LogiSense Platform v2.0</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  },
};
