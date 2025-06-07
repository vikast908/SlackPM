const express = require('express');
const app = express();
const port = process.env.DASHBOARD_PORT || 3001;
const security = require('./security');

// Simulated admin list (replace with actual admin check later)
const admins = ['U12345678']; // Example Slack user ID

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  const userId = req.query.userId;
  if (!userId || !admins.includes(userId)) {
    return res.status(403).send('Access denied. Admins only.');
  }
  next();
}

// Dashboard route
app.get('/dashboard', isAdmin, (req, res) => {
  // Simulated metrics
  const metrics = {
    installationStatus: 'Active',
    tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    eventThroughput: 100, // events per minute
    errorRate: 0.5 // percent
  };

  // Simulated metadata-only mode toggle
  const metadataOnly = req.query.metadataOnly === 'true';

  // Fetch audit log
  const auditLog = security.getAuditLog();

  res.send(`
    <h1>SlackPM Admin Dashboard</h1>
    <h2>Installation Status: ${metrics.installationStatus}</h2>
    <h2>Token Expiry: ${metrics.tokenExpiry}</h2>
    <h2>Event Throughput: ${metrics.eventThroughput} events/min</h2>
    <h2>Error Rate: ${metrics.errorRate}%</h2>
    <h2>Metadata-Only Mode: ${metadataOnly ? 'Enabled' : 'Disabled'}</h2>
    <form action="/dashboard" method="get">
      <input type="hidden" name="userId" value="${req.query.userId}">
      <input type="checkbox" name="metadataOnly" value="true" ${metadataOnly ? 'checked' : ''} onchange="this.form.submit()">
      <label for="metadataOnly">Enable Metadata-Only Mode</label>
    </form>
    <h2>Audit Log</h2>
    <pre>${JSON.stringify(auditLog, null, 2)}</pre>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Dashboard running at http://localhost:${port}/dashboard`);
}); 
