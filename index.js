const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let leaderboard = [];

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

app.post('/api/submit', (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) return res.status(400).json({ error: 'Missing fields' });

  const entry = {
    id: Date.now(),
    name: String(name).slice(0, 40),
    score: Math.max(0, Math.min(10, parseInt(score))),
    time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  };

  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  broadcast({ type: 'update', leaderboard });
  res.json({ ok: true, rank: leaderboard.findIndex(e => e.id === entry.id) + 1 });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

app.post('/api/clear', (req, res) => {
  leaderboard = [];
  broadcast({ type: 'update', leaderboard });
  res.json({ ok: true });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'update', leaderboard }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🇳🇱 KOLAS Quiz запущено!`);
});
