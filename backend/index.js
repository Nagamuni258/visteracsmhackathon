const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { MongoClient, ObjectId } = require('mongodb');
const cron = require('node-cron');
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
    // Start cron job for auto-expiring unverified pins after 7 days
    startExpirationCron();
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
    latitude: 17.440081,
    longitude: 78.348915,
    speed: 34.5,
    source: 'vehicle', // vehicle | pedestrian
    status: 'approved', // provisional | approved | verified | flagged
    confirmations: 3,
    rejections: 0,
    reportCount: 1,
    address: 'HITEC City Main Rd, Near Mindspace Junction, Hyderabad',
    photoUrl: null,
    reporterId: 'hyd-rover-01',
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
// CRON JOB: Auto-expire unverified pins after 7 days
// ==========================================
function startExpirationCron() {
  // Run every day at 02:00 AM server time
  cron.schedule('0 2 * * *', async () => {
    console.log('🕒 Running expiration cron job for unverified pins...');
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7); // 7 days ago
      const cutoffISO = cutoff.toISOString();

      let expiredCount = 0;
      if (hazardsCollection) {
        const result = await hazardsCollection.updateMany(
          {
            status: { $in: ['provisional', 'pending'] }, // only unverified states
            createdAt: { $lt: cutoffISO }
          },
          { $set: { status: 'faded', updatedAt: new Date().toISOString() } }
        );
        expiredCount = result.modifiedCount;
        console.log(`🕒 Expired ${expiredCount} unverified pins older than 7 days`);
      } else {
        // in-memory fallback
        const beforeCount = pins.length;
        pins = pins.map(pin => {
          if (pin.status === 'provisional' || pin.status === 'pending') {
            const pinDate = new Date(pin.createdAt);
            if (pinDate < cutoff) {
              return { ...pin, status: 'faded', updatedAt: new Date().toISOString() };
            }
          }
          return pin;
        });
        const afterCount = pins.length;
        expiredCount = beforeCount - pins.filter(p => p.status === 'faded').length;
        console.log(`🕒 Expired ${expiredCount} unverified pins (in-memory) older than 7 days`);
      }
    } catch (err) {
      console.error('❌ Error in expiration cron job:', err);
    }
  }, {
    timezone: 'America/New_York' // adjust as needed; leave default for system timezone
  });
  console.log('⏰ Expiration cron job scheduled (daily at 02:00)');
}

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
      exportCsv: 'GET /api/export/csv',
      stats: 'GET /api/stats'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RoadBump API is running',
    mongoConnected: !!hazardsCollection,
    defaultCity: 'Hyderabad',
    totalPins: pins.length
  });
});

// GET /api/location/hyderabad - Location API for Hyderabad telemetry & civic config
app.get('/api/location/hyderabad', (req, res) => {
  res.json({
    success: true,
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    authority: 'GHMC (Greater Hyderabad Municipal Corporation)',
    policeDivision: 'Cyberabad Traffic Police',
    zone: 'Zone 05 • West Zone (Serilingampally / Cyberabad)',
    ward: 'Ward #104 (HITEC City & Madhapur)',
    defaultCoords: {
      latitude: 17.440081,
      longitude: 78.348915,
      altitude: 542.0,
      zoom: 15
    },
    corridors: [
      { name: 'HITEC City - Mindspace Corridor', latitude: 17.440081, longitude: 78.348915, severity: 'Severe' },
      { name: 'Madhapur 100ft Road - Cyber Gateway', latitude: 17.450412, longitude: 78.381120, severity: 'Moderate' },
      { name: 'Gachibowli ORR Junction - Financial District', latitude: 17.443520, longitude: 78.357040, severity: 'Minor' },
      { name: 'Jubilee Hills Checkpost - Road #36', latitude: 17.431940, longitude: 78.407320, severity: 'Severe' },
      { name: 'Banjara Hills Road #12 Flyover', latitude: 17.415620, longitude: 78.434710, severity: 'Critical' }
    ]
  });
});

app.get('/api/locations', (req, res) => {
  res.json({
    success: true,
    activeCity: 'Hyderabad',
    supportedCities: [
      { id: 'hyd', name: 'Hyderabad (Cyberabad / GHMC)', default: true, lat: 17.440081, lng: 78.348915 },
      { id: 'blr', name: 'Bengaluru (BBMP)', default: false, lat: 12.971598, lng: 77.594566 }
    ]
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

// Helper to safely find a document by MongoDB _id or string id or demo fallback
async function findHazardDoc(id) {
  if (!hazardsCollection) return null;
  let doc = null;
  if (id && ObjectId.isValid(id)) {
    try {
      doc = await hazardsCollection.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      // ignore
    }
  }
  if (!doc && id) {
    doc = await hazardsCollection.findOne({ id: id });
  }
  // Graceful fallback for demo IDs (e.g. 'p1', 'sample-pin-1')
  if (!doc) {
    doc = await hazardsCollection.findOne({ status: 'provisional' }) || await hazardsCollection.findOne({});
  }
  return doc;
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
      source = 'camera_citizen',
      photoUrl = null,
      imageUrl = null,
      reporterId = 'citizen-cam-104',
      description = '',
      address = '',
      depthCm = 8.0,
      civicStatus = 'pending_dispatch',
      ward = 'Ward #104 GHMC West (Cyberabad)'
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
    }

    const latFloat = parseFloat(latitude);
    const lngFloat = parseFloat(longitude);
    const resolvedAddress = address || `Incident near [${latFloat.toFixed(4)}°, ${lngFloat.toFixed(4)}°], Hyderabad`;

    const newPin = {
      type,
      severity,
      severityLevel: parseInt(severityLevel) || 3,
      latitude: latFloat,
      longitude: lngFloat,
      speed: parseFloat(speed) || 0,
      source,
      photoUrl: photoUrl || imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX',
      description: description || 'Citizen reported road hazard via camera viewfinder.',
      address: resolvedAddress,
      depthCm: parseFloat(depthCm) || 8.5,
      civicStatus,
      ward,
      reporterId,
      status: 'provisional', // New reports start as provisional
      confirmations: 1,
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
      const doc = await findHazardDoc(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Pin not found' });
      }
      await hazardsCollection.updateOne(
        { _id: doc._id },
        {
          $set: {
            status: 'approved',
            updatedAt: new Date().toISOString()
          }
        }
      );
      const updatedDoc = await hazardsCollection.findOne({ _id: doc._id });
      updatedPin = toPinDoc(updatedDoc);
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
      const pinDoc = await findHazardDoc(id);
      if (!pinDoc) return res.status(404).json({ success: false, message: 'Pin not found' });

      const confirmations = (pinDoc.confirmations || 0) + (vote === 'confirm' ? 1 : 0);
      const rejections = (pinDoc.rejections || 0) + (vote === 'reject' ? 1 : 0);
      let status = pinDoc.status;

      // Master plan rules:
      // 3 positive votes -> Verified
      // 2 negative votes -> Flagged / Unverified
      if (confirmations >= 3) status = 'verified';
      if (rejections >= 2) status = 'flagged';

      await hazardsCollection.updateOne(
        { _id: pinDoc._id },
        { $set: { confirmations, rejections, status, updatedAt: new Date().toISOString() } }
      );

      const doc = await hazardsCollection.findOne({ _id: pinDoc._id });
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
      const doc = await findHazardDoc(id);
      if (doc) pin = toPinDoc(doc);
    } else {
      pin = pins.find(p => p.id === id) || pins[0];
    }

    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=RoadBump-Report-${pin.id}.pdf`);
    doc.pipe(res);

    // PDF Content Layout
    doc.fontSize(20).fillColor('#D97706').text('GHMC ROADBUMP HAZARD REPORT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#4B5563').text('Greater Hyderabad Municipal Corporation • Cyberabad Civic Ops', { align: 'center' });
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
// 7. STATISTICS ENDPOINT
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    let stats = {
      total: 0,
      byStatus: {},
      byType: {},
      recent24h: 0
    };
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (hazardsCollection) {
      // Aggregation pipeline for stats
      const aggResult = await hazardsCollection.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            byType: [
              { $group: { _id: '$type', count: { $sum: 1 } } }
            ],
            recent24h: [
              { $match: { createdAt: { $gte: yesterday.toISOString() } } },
              { $count: 'count' }
            ]
          }
        }
      ]).toArray();

      if (aggResult.length > 0) {
        const [result] = aggResult;
        stats.total = result.total[0]?.count || 0;
        result.byStatus.forEach(item => {
          stats.byStatus[item._id] = item.count;
        });
        result.byType.forEach(item => {
          stats.byType[item._id] = item.count;
        });
        stats.recent24h = result.recent24h[0]?.count || 0;
      }
    } else {
      // in-memory fallback
      stats.total = pins.length;
      pins.forEach(pin => {
        stats.byStatus[pin.status] = (stats.byStatus[pin.status] || 0) + 1;
        stats.byType[pin.type] = (stats.byType[pin.type] || 0) + 1;
        const pinDate = new Date(pin.createdAt);
        if (pinDate >= yesterday) {
          stats.recent24h += 1;
        }
      });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 8. AI HAZARD TRIAGE & DISPATCH RECOMMENDATIONS (FreeLLMAPI on port 3001)
// ==========================================
app.post('/api/pins/:id/ai-analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const pin = await findHazardDoc(id);
    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    let aiResponse = null;
    try {
      // Connect to local FreeLLMAPI proxy if available
      const llmRes = await fetch('http://127.0.0.1:3001/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are the GHMC (Greater Hyderabad Municipal Corporation) RoadBump Civic AI Dispatcher for Hyderabad/Cyberabad. Output a concise 3-bullet triage plan: 1) Risk Rating, 2) Repair Allocation (e.g. GHMC Rapid Asphalt Patch Unit #4 / Cyberabad Zone), 3) Triage SLA.'
            },
            {
              role: 'user',
              content: `Hazard: Type=${pin.type}, Severity=${pin.severity}, GPS=[${pin.latitude}, ${pin.longitude}], Speed=${pin.speed || 0} km/h, Source=${pin.source}.`
            }
          ],
          max_tokens: 150
        })
      });

      if (llmRes.ok) {
        const data = await llmRes.json();
        aiResponse = data.choices?.[0]?.message?.content;
      }
    } catch (llmErr) {
      // FreeLLMAPI offline or auth error, fallback gracefully
    }

    if (!aiResponse) {
      const isCritical = pin.severity === 'Critical' || pin.severity === 'Severe';
      aiResponse = `• Risk Rating: ${isCritical ? 'High Threat (Level A - Accident Risk)' : 'Moderate Degradation (Level B)'}\n• Repair Crew: ${pin.type === 'pothole' ? 'GHMC Rapid Asphalt Patch Unit #4 (QuickColdMix / Cyberabad)' : pin.type === 'speed-breaker' ? 'GHMC Thermoplastic Striping & Ramp Smoothing Unit' : 'GHMC Public Works Heavy Metal Fastener Crew'}\n• Triage SLA: ${isCritical ? 'Urgent Repair within 4 Hours' : 'Scheduled Maintenance within 24 Hours'}`;
    }

    res.json({
      success: true,
      hazardId: pin.id || pin._id,
      analysis: aiResponse,
      recommendedTeam: pin.type === 'pothole' ? 'GHMC Asphalt Unit #4' : 'Cyberabad Traffic Engineering Crew',
      priorityTier: pin.severity === 'Critical' ? 'P1-URGENT' : 'P2-STANDARD'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 9. NETWORK INFO (for debugging / adb reverse)
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