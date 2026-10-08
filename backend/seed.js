const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function runSeed() {
  try {
    await client.connect();
    console.log('Connected to MongoDB for seeding');

    const db = client.db('roadbump');
    const collection = db.collection('hazards');

    // Clean existing records to re-seed fresh Hyderabad data
    await collection.deleteMany({});
    console.log('Cleared existing records for fresh Hyderabad telemetry seeding.');

    const samplePins = [
      {
        type: 'pothole',
        severity: 'Severe',
        severityLevel: 4,
        latitude: 17.440081,
        longitude: 78.348915,
        speed: 34.5,
        source: 'vehicle',
        status: 'approved',
        confirmations: 5,
        rejections: 0,
        reportCount: 1,
        address: 'HITEC City Main Rd, Near Mindspace Junction, Hyderabad',
        photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX',
        reporterId: 'hyd-rover-01',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'speed-breaker',
        severity: 'Moderate',
        severityLevel: 2,
        latitude: 17.450412,
        longitude: 78.381120,
        speed: 22.0,
        source: 'vehicle',
        status: 'verified',
        confirmations: 4,
        rejections: 1,
        reportCount: 1,
        address: 'Madhapur 100ft Rd, Opposite Cyber Gateway, Hyderabad',
        photoUrl: null,
        reporterId: 'hyd-auto-02',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'metal-plate',
        severity: 'Minor',
        severityLevel: 1,
        latitude: 17.443520,
        longitude: 78.357040,
        speed: 15.0,
        source: 'pedestrian',
        status: 'provisional',
        confirmations: 1,
        rejections: 0,
        reportCount: 1,
        address: 'Gachibowli ORR Junction, Near Metro Pillar #C14, Hyderabad',
        photoUrl: null,
        reporterId: 'hyd-pwalker-03',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        type: 'pothole',
        severity: 'Critical',
        severityLevel: 5,
        latitude: 17.415620,
        longitude: 78.434710,
        speed: 48.0,
        source: 'vehicle',
        status: 'flagged',
        confirmations: 2,
        rejections: 2,
        reportCount: 1,
        address: 'Banjara Hills Road #12, Near MLA Colony Flyover, Hyderabad',
        photoUrl: null,
        reporterId: 'hyd-bike-04',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'pothole',
        severity: 'Severe',
        severityLevel: 4,
        latitude: 17.431940,
        longitude: 78.407320,
        speed: 38.0,
        source: 'vehicle',
        status: 'provisional',
        confirmations: 0,
        rejections: 0,
        reportCount: 1,
        address: 'Jubilee Hills Checkpost, Road #36 Incline, Hyderabad',
        photoUrl: null,
        reporterId: 'hyd-rover-05',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];

    const result = await collection.insertMany(samplePins);
    console.log(`✅ Seeded ${result.insertedCount} Hyderabad hazard telemetry records into MongoDB.`);
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.close();
  }
}

runSeed();