const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/status', (req, res) => {
  res.json({
    office: 'WOO ORCHESTRA',
    agents: 7,
    status: 'online',
    uptime: process.uptime(),
    projects: ['DR.SLOT', 'JARVIS2', 'Community']
  });
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, () => console.log('[ORCHESTRA] Live on port ' + PORT));
