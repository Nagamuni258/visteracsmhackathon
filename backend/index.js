const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
let mongoClient = null;
let hazardsCollection = null;

async function connectToMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    mongoClient = client;
    const db = client.db('roadbump');
    hazardsCollection = db.collection('hazards');
    // Ensure indexes for faster queries
    await hazardsCollection.createIndex({ latitude: 1, longitude: 1 });
    await hazardsCollection.createIndex({ status: 1 });
    await hazardsCollection.createIndex({ createdAt: -1 });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    throw err;
  }
}

// --- In-Memory Fallback Store (Syncs / works seamlessly without MongoDB setup) ---
let pins = [
  {
    id: 'sample-pin-1',
    type: 'pothole', // pothole, speed-breaker, metal-plate, flat-road
    severity: 'Severe', // Minor, Moderate, Severe, Critical
    severityLevel: 3,
    latitude: 12.971598,
    longitude: 77.594566,
    speed: 34.5,
    source: 'vehicle', // vehicle | pedestrian
    status: 'approved', // provisional | approved | verified | flagged
    confirmations: 3,
    rejections: 0,
    reportCount: 1,
    photoUrl: null,
    reporterId: 'user-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// --- Firebase Admin Initialization (Graceful Fallback for FCM only) ---
let messaging = null;

try {
  const admin = require('firebase-admin');
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    messaging = admin.messaging();
    console.log('✅ Firebase Admin SDK initialized for FCM');
  } else {
    console.log('ℹ️ No serviceAccountKey.json found. FCM notifications disabled.');
  }
} catch (err) {
  console.warn('⚠️ Firebase Admin init skipped or failed:', err.message);
}

// Connect to MongoDB on startup
connectToMongo().catch(() => {
  console.log('⚠️ Continuing with in-memory store only.');
});

// ==========================================
// 1. HEALTH & ROOT CHECK
// ==========================================
app.get('/', (req, res) => {
  res.json({
    name: 'RoadBump Telemetry & Hazard API',
    status: 'online',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/health',
      listPins: 'GET /api/pins',
      createPin: 'POST /api/pins',
      approvePin: 'PATCH /api/pins/:id/approve',
      feedback: 'POST /api/pins/:id/feedback',
      pdfReport: 'GET /api/pins/:id/report',
      exportCsv: 'GET /api/export/csv'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RoadBump API is running',
    mongoConnected: !!hazardsCollection,
    totalPins: pins.length
  });
});

// ==========================================
// 2. PINS / HAZARD ENDPOINTS
// ==========================================

// Helper: convert MongoDB doc to plain object
function toPinDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

// GET /api/pins - Get all hazard pins (optional filter by status or location)
app.get('/api/pins', async (req, res) => {
  try {
    const { status, type, lat, lng, radius } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (lat && lng && radius) {
      // Simple bounding box approximation (for demo)
      const rad = parseFloat(radius) / 111.32; // approx degrees per km
      const latF = parseFloat(lat);
      const lngF = parseFloat(lng);
      filter.$and = [
        { latitude: { $gte: latF - rad, $lte: latF + rad } },
        { longitude: { $gte: lngF - rad, $lte: lngF + rad } }
      ];
    }

    let cursor;
    if (hazardsCollection) {
      cursor = hazardsCollection.find(filter).sort({ createdAt: -1 });
    } else {
      // in-memory filter
      let filtered = pins;
      if (status) filtered = filtered.filter(p => p.status === status);
      if (type) filtered = filtered.filter(p => p.type === type);
      if (lat && lng && radius) {
        const rad = parseFloat(radius) / 111.32;
        const latF = parseFloat(lat);
        const lngF = parseFloat(lng);
        filtered = filtered.filter(p =>
          Math.abs(p.latitude - latF) <= rad &&
          Math.abs(p.longitude - lngF) <= rad
        );
      }
      // sort by createdAt descending
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      cursor = filtered;
    }

    const results = await cursor.toArray();
    const pinsOut = results.map(toPinDoc);
    res.json({ success: true, count: pinsOut.length, data: pinsOut });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/pins - Report / Create new hazard pin
app.post('/api/pins', async (req, res) => {
  try {
    const {
      type = 'pothole',
      severity = 'Moderate',
      severityLevel = 2,
      latitude,
      longitude,
      speed = 0,
      source = 'pedestrian',
      photoUrl = null,
      reporterId = 'anonymous'
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
    }

    const newPin = {
      type,
      severity,
      severityLevel,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: parseFloat(speed),
      source,
      photoUrl,
      reporterId,
      status: 'provisional', // New reports start as provisional
      confirmations: 0,
      rejections: 0,
      reportCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let savedPin;
    if (hazardsCollection) {
      const result = await hazardsCollection.insertOne(newPin);
      newPin._id = result.insertedId;
      savedPin = toPinDoc(newPin);
    } else {
      newPin.id = `pin-${Date.now()}`;
      pins.unshift(newPin);
      savedPin = newPin;
    }

    // Trigger FCM Notification for admin if available
    if (messaging) {
      try {
        await messaging.send({
          topic: process.env.ADMIN_FCM_TOPIC || 'admin_alerts',
          notification: {
            title: `⚠️ New Hazard Reported: ${type.toUpperCase()}`,
            body: `Severity: ${severity} at [${latitude}, ${longitude}]`
          },
          data: {
            pinId: String(savedPin.id),
            severity: String(severity),
            type: String(type)
          }
        });
      } catch (fcmErr) {
        console.warn('FCM send failed:', fcmErr.message);
      }
    }

    res.status(201).json({ success: true, message: 'Hazard registered', data: savedPin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. ADMIN APPROVAL LOOP
// ==========================================

// PATCH /api/pins/:id/approve - Admin approves provisional pin
app.patch('/api/pins/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    let updateResult;
    let updatedPin;

    if (hazardsCollection) {
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: 'approved',
          updatedAt: new Date().toISOString()
        }
      };
      updateResult = await hazardsCollection.updateOne(filter, update);
      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ success: false, message: 'Pin not found' });
      }
      const doc = await hazardsCollection.findOne(filter);
      updatedPin = toPinDoc(doc);
    } else {
      const index = pins.findIndex(p => p.id === id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Pin not found' });
      pins[index].status = 'approved';
      pins[index].updatedAt = new Date().toISOString();
      updatedPin = pins[index];
    }

    // Push broadcast alert to nearby crossing users
    if (messaging) {
      try {
        await messaging.send({
          topic: process.env.NEARBY_USERS_FCM_TOPIC || 'hazard_alerts',
          notification: {
            title: `🚨 Road Hazard Alert: ${updatedPin.type.toUpperCase()}`,
            body: `Verified ${updatedPin.severity} hazard near your route!`
          },
          data: {
            pinId: String(updatedPin.id),
            latitude: String(updatedPin.latitude),
            longitude: String(updatedPin.longitude),
            severity: String(updatedPin.severity)
          }
        });
      } catch (fcmErr) {
        console.warn('FCM Broadcast error:', fcmErr.message);
      }
    }

    res.json({ success: true, message: 'Pin approved and broadcasted', data: updatedPin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. COMMUNITY FEEDBACK / VERIFICATION
// ==========================================

// POST /api/pins/:id/feedback - Cast positive or negative confirmation vote
app.post('/api/pins/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'confirm' (thumbs up) or 'reject' (thumbs down)

    if (!['confirm', 'reject'].includes(vote)) {
      return res.status(400).json({ success: false, message: 'Vote must be "confirm" or "reject"' });
    }

    let updateObj = {};
    if (vote === 'confirm') {
      updateObj.$inc = { confirmations: 1 };
    } else {
      updateObj.$inc = { rejections: 1 };
    }
    updateObj.$set = { updatedAt: new Date().toISOString() };

    let updatedPin;
    if (hazardsCollection) {
      const filter = { _id: new ObjectId(id) };
      const pinDoc = await hazardsCollection.findOne(filter);
      if (!pinDoc) return res.status(404).json({ success: false, message: 'Pin not found' });

      const confirmations = (pinDoc.confirmations || 0) + (vote === 'confirm' ? 1 : 0);
      const rejections = (pinDoc.rejections || 0) + (vote === 'reject' ? 1 : 0);
      let status = pinDoc.status;

      // Master plan rules:
      // 3 positive votes -> Verified
      // 2 negative votes -> Flagged / Unverified
      if (confirmations >= 3) status = 'verified';
      if (rejections >= 2) status = 'flagged';

      updateObj.$set.confirmations = confirmations;
      updateObj.$set.rejections = rejections;
      updateObj.$set.status = status;

      const result = await hazardsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { confirmations, rejections, status, updatedAt: new Date().toISOString() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: 'Pin not found' });
      }

      const doc = await hazardsCollection.findOne({ _id: new ObjectId(id) });
      updatedPin = toPinDoc(doc);
    } else {
      const index = pins.findIndex(p => p.id === id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Pin not found' });

      if (vote === 'confirm') pins[index].confirmations += 1;
      if (vote === 'reject') pins[index].rejections += 1;

      if (pins[index].confirmations >= 3) pins[index].status = 'verified';
      if (pins[index].rejections >= 2) pins[index].status = 'flagged';

      pins[index].updatedAt = new Date().toISOString();
      updatedPin = pins[index];
    }

    res.json({
      success: true,
      message: `Vote recorded (${vote})`,
      data: updatedPin
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. NOTIFICATION DISPATCH (TEST / MANUAL)
// ==========================================

// POST /api/notify - Send direct FCM notification test
app.post('/api/notify', async (req, res) => {
  try {
    const { title, body, topic, data } = req.body;
    if (!messaging) {
      return res.json({
        success: true,
        mocked: true,
        message: 'Firebase Messaging not initialized. Notification logged locally.',
        payload: { title, body, topic, data }
      });
    }

    const response = await messaging.send({
      topic: topic || 'hazard_alerts',
      notification: { title, body },
      data: data || {}
    });

    res.json({ success: true, messageId: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. MUNICIPAL REPORT GENERATION (PDF & CSV)
// ==========================================

// GET /api/pins/:id/report - Generate formatted municipal PDF report
app.get('/api/pins/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    let pin = null;

    if (hazardsCollection) {
      const doc = await hazardsCollection.findOne({ _id: new ObjectId(id) });
      if (doc) pin = toPinDoc(doc);
    } else {
      pin = pins.find(p => p.id === id);
    }

    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=RoadBump-Report-${pin.id}.pdf`);
    doc.pipe(res);

    // PDF Content Layout
    doc.fontSize(22).fillColor('#D97706').text('ROADBUMP HAZARD REPORT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#4B5563').text('Official Municipal Grievance & Hazard Log', { align: 'center' });
    doc.moveDown(1.5);

    doc.rect(50, 110, 510, 2).fill('#E5E7EB');
    doc.moveDown(2);

    doc.fillColor('#111827').fontSize(14).text(`Hazard ID: ${pin.id}`);
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Timestamp: ${pin.createdAt}`);
    doc.text(`Location (GPS): Latitude ${pin.latitude}, Longitude ${pin.longitude}`);
    doc.text(`Hazard Type: ${pin.type.toUpperCase()}`);
    doc.text(`Severity: ${pin.severity} (Level ${pin.severityLevel || 1})`);
    doc.text(`Status: ${pin.status.toUpperCase()}`);
    doc.text(`Community Confirmations: ${pin.confirmations} | Rejections: ${pin.rejections}`);
    doc.text(`Speed at Detection: ${pin.speed ? pin.speed + ' km/h' : 'N/A'}`);
    doc.text(`Detection Mode: ${pin.source.toUpperCase()}`);
    doc.text(`Reporter ID: ${pin.reporterId || 'Anonymous'}`);
    if (pin.photoUrl) {
      doc.text(`Photo Evidence URL: ${pin.photoUrl}`);
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor('#6B7280').text('This report was automatically synthesized by the RoadBump Telemetry & Citizen Safety System for immediate public-works triage and road repair intervention.', {
      align: 'justify'
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/pins/export/csv - Export CSV of all hazards
app.get('/api/export/csv', async (req, res) => {
  try {
    let list = pins;
    if (hazardsCollection) {
      const snap = await hazardsCollection.find().toArray();
      list = snap.map(toPinDoc);
    }

    const header = ['id', 'type', 'severity', 'latitude', 'longitude', 'status', 'confirmations', 'createdAt'].join(',');
    const rows = list.map(p => [
      `"${p.id}"`,
      `"${p.type}"`,
      `"${p.severity}"`,
      p.latitude,
      p.longitude,
      `"${p.status}"`,
      p.confirmations,
      `"${p.createdAt}"`
    ].join(','));

    const csvContent = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="roadbump-hazards.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. NETWORK INFO (for debugging / adb reverse)
// ==========================================

// GET /api/network-info - Returns host IP addresses and USB tethering connection info
app.get('/api/network-info', (req, res) => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          ip: iface.address
        });
      }
    }
  }

  res.json({
    success: true,
    port: PORT,
    clientIp: req.ip,
    hostAddresses: addresses,
    adbCommands: {
      reverseFrontend: 'adb reverse tcp:3000 tcp:3000',
      reverseBackend: 'adb reverse tcp:5000 tcp:5000',
      oneLiner: 'adb reverse tcp:3000 tcp:3000 && adb reverse tcp:5000 tcp:5000'
    }
  });
});

// Start Server listening on all network interfaces (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RoadBump Server is running on all interfaces: http://0.0.0.0:${PORT}`);
});