const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Firebase Admin
const serviceAccount = require('./firebase_credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

console.log('Firebase Admin initialized with database URL:', process.env.FIREBASE_DATABASE_URL);

app.use(cors());
app.use(express.json());

// Initialize Firebase Database
const db = admin.database();

// Test Firebase connection
db.ref('.info/connected').on('value', (snapshot) => {
  console.log('Firebase connection state:', snapshot.val() ? 'connected' : 'disconnected');
});

const homeRef = db.ref('home');

// WebSocket setup
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Listen for real-time updates from Firebase
  const listener = homeRef.on('value', (snapshot) => {
    ws.send(JSON.stringify(snapshot.val()));
  });

  // Handle incoming sensor data from Python
  ws.on('message', async (data) => {
    try {
      const sensorData = JSON.parse(data);
      if (sensorData.type === 'sensor') {
        await homeRef.child('sensors').set({
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          timestamp: admin.database.ServerValue.TIMESTAMP
        });
      }
    } catch (error) {
      console.error('Error processing sensor data:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    homeRef.off('value', listener);
  });
});

// API endpoints
app.get('/api/status', async (req, res) => {
  try {
    const snapshot = await db.ref('home').once('value');
    res.json(snapshot.val() || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/control', async (req, res) => {
  try {
    const { type, index, state } = req.body;
    await db.ref(`home/${type}`).child(index).set(state);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});
