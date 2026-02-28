const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test endpoint
app.post('/api/survey', (req, res) => {
  console.log('🔥 Survey submission received:', req.body);
  res.json({ 
    success: true, 
    message: 'Test: Survey received',
    data: req.body 
  });
});

app.get('/api/health', (req, res) => {
  console.log('🟢 Health check accessed');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Survey endpoint: http://localhost:${PORT}/api/survey`);
});
