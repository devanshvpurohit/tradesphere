import nodemailer from 'nodemailer';

export interface EmailReportData {
  recipientEmail: string;
  userName?: string;
  accountBalance: number;
  totalPortfolioValue: number;
  totalInvested: number;
  unrealizedPnl: number;
  holdings: Array<{
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
  }>;
  recentOrders: Array<{
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    productType?: string;
    timestamp: string;
    status: string;
    agentName?: string;
  }>;
  brokerNotes?: Array<{
    symbol: string;
    agentName: string;
    action: string;
    rule: string;
    confidence: number;
    reasoning: string;
  }>;
}

export function generateContractNoteHtml(data: EmailReportData): string {
  const isPnlPositive = data.unrealizedPnl >= 0;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TradeSphere Daily Contract Note & Trading Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 680px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 32px 24px; text-align: left; border-bottom: 1px solid #1e293b; }
    .header h1 { margin: 0; font-size: 24px; color: #ffffff; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; color: #94a3b8; font-size: 13px; }
    .badge { display: inline-block; background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); font-size: 11px; font-weight: bold; padding: 2px 8px; rounded: 4px; border-radius: 4px; margin-bottom: 12px; }
    .content { padding: 24px; }
    .stats-grid { display: table; width: 100%; margin-bottom: 24px; }
    .stat-cell { display: table-cell; width: 33.3%; background: #0f172a; padding: 14px; border: 1px solid #1e293b; border-radius: 8px; text-align: left; }
    .stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
    .stat-val { font-size: 18px; font-weight: 800; margin-top: 4px; font-family: monospace; color: #ffffff; }
    .val-green { color: #34d399; }
    .val-red { color: #f87171; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #cbd5e1; margin: 24px 0 12px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; font-family: monospace; }
    th { background: #0f172a; color: #94a3b8; text-align: left; padding: 10px 12px; border: 1px solid #1e293b; font-size: 11px; }
    td { padding: 10px 12px; border: 1px solid #1e293b; }
    .buy-tag { background: rgba(52, 211, 153, 0.15); color: #34d399; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    .sell-tag { background: rgba(248, 113, 113, 0.15); color: #f87171; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    .broker-box { background: #0f172a; border-left: 3px solid #3b82f6; padding: 12px 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0; font-size: 12px; }
    .broker-title { font-weight: bold; color: #60a5fa; margin-bottom: 4px; }
    .footer { background-color: #0b0f19; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">DIGITAL CONTRACT NOTE & PORTFOLIO DIGEST</div>
      <h1>TradeSphere Institutional Paper Trading</h1>
      <p>Report for: <strong>${data.recipientEmail}</strong> • Date: ${dateStr} at ${timeStr} IST</p>
    </div>

    <div class="content">
      <!-- KPI Scorecard -->
      <div class="stats-grid">
        <div class="stat-cell" style="margin-right: 8px;">
          <div class="stat-label">Available Virtual Cash</div>
          <div class="stat-val">₹${data.accountBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-cell" style="margin-right: 8px;">
          <div class="stat-label">Total Portfolio Value</div>
          <div class="stat-val">₹${data.totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-label">Unrealized P&L</div>
          <div class="stat-val ${isPnlPositive ? 'val-green' : 'val-red'}">
            ${isPnlPositive ? '+' : ''}₹${data.unrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <!-- Autonomous Broker Activities -->
      ${data.brokerNotes && data.brokerNotes.length > 0 ? `
        <h2>🤖 Autonomous Broker Agent Executions</h2>
        ${data.brokerNotes.map(bn => `
          <div class="broker-box">
            <div class="broker-title">${bn.agentName} — ${bn.action} Recommendation (${bn.confidence}% Confidence)</div>
            <div style="color: #cbd5e1; margin-bottom: 4px;"><strong>Decision Rule:</strong> ${bn.rule}</div>
            <div style="color: #94a3b8; font-style: italic;">"${bn.reasoning}"</div>
          </div>
        `).join('')}
      ` : ''}

      <!-- Current Equity Holdings -->
      <h2>📦 Active Portfolio Positions (${data.holdings.length})</h2>
      ${data.holdings.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty</th>
              <th>Avg Buy Price</th>
              <th>Current LTP</th>
              <th>P&L (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${data.holdings.map(h => `
              <tr>
                <td><strong>${h.symbol}</strong></td>
                <td>${h.quantity}</td>
                <td>₹${h.avgPrice.toFixed(2)}</td>
                <td>₹${h.currentPrice.toFixed(2)}</td>
                <td style="color: ${h.pnl >= 0 ? '#34d399' : '#f87171'}; font-weight: bold;">
                  ${h.pnl >= 0 ? '+' : ''}₹${h.pnl.toFixed(2)} (${h.pnlPercent >= 0 ? '+' : ''}${h.pnlPercent.toFixed(2)}%)
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #94a3b8; font-size: 12px;">No open positions currently held in your portfolio.</p>'}

      <!-- Executed Trade Orders -->
      <h2>⚡ Executed Orders Ledger</h2>
      ${data.recentOrders.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Side</th>
              <th>Instrument</th>
              <th>Qty</th>
              <th>Fill Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.recentOrders.slice(0, 10).map(o => `
              <tr>
                <td style="color: #94a3b8;">${new Date(o.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                <td><span class="${o.side === 'BUY' ? 'buy-tag' : 'sell-tag'}">${o.side}</span></td>
                <td><strong>${o.symbol}</strong></td>
                <td>${o.quantity}</td>
                <td>₹${Number(o.price).toFixed(2)}</td>
                <td style="color: #34d399; font-weight: bold;">${o.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #94a3b8; font-size: 12px;">No orders executed today.</p>'}
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px;">This is a computer-generated contract note issued by TradeSphere Simulated Trading Terminal.</p>
      <p style="margin: 0; color: #475569;">Zero real-money risk • Powered by Google Firebase & Multi-LLM AI Agent Studio</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmailReport(data: EmailReportData): Promise<{ success: boolean; message: string; previewHtml?: string }> {
  const htmlContent = generateContractNoteHtml(data);

  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;

  if (!gmailUser || !gmailPass) {
    // Return the generated HTML so the frontend can preview it or dispatch mailto
    return {
      success: true,
      message: 'Email compiled successfully (Preview mode). Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local to send live via Gmail SMTP.',
      previewHtml: htmlContent,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"TradeSphere Broker Desk" <${gmailUser}>`,
      to: data.recipientEmail,
      subject: `TradeSphere Daily Contract Note & Trading Report - ${new Date().toLocaleDateString('en-IN')}`,
      html: htmlContent,
    });

    return {
      success: true,
      message: `Report successfully dispatched to ${data.recipientEmail} via Gmail.`,
      previewHtml: htmlContent,
    };
  } catch (error: any) {
    console.warn('Nodemailer Gmail dispatch error:', error);
    return {
      success: false,
      message: error.message || 'Failed to dispatch email via Gmail SMTP',
      previewHtml: htmlContent,
    };
  }
}
