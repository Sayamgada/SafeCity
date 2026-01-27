/* eslint-disable no-console */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.mongo_uri;

if (!uri) {
  throw new Error('Missing mongo_uri in .env');
}

const DB_NAME = 'crime_dashboard';

const metrics = [
  { title: 'Total Incidents', value: '586', subtext: '+8.2%', trend: 'up' },
  { title: 'Crime Rate Change', value: '-12.4%', subtext: 'vs last month', trend: 'down' },
  { title: 'High-Risk Zones', value: '5', subtext: 'in Mumbai', trend: 'up' },
  { title: 'Patrol Efficiency', value: '87.3%', subtext: '+5.1%', trend: 'up' },
];

const riskZones = [
  {
    rank: 1,
    name: 'Downtown District',
    score: 94,
    incidents: 127,
    trend: '+12%',
    trendDirection: 'up',
    timeAgo: '15 mins ago',
    crimeTypes: ['Theft', 'Assault', 'Vandalism'],
  },
  {
    rank: 2,
    name: 'Industrial Zone',
    score: 89,
    incidents: 156,
    trend: '+8%',
    trendDirection: 'up',
    timeAgo: '32 mins ago',
    crimeTypes: ['Burglary', 'Theft', 'Drug-related'],
  },
  {
    rank: 3,
    name: 'Commercial Center',
    score: 76,
    incidents: 93,
    trend: '-5%',
    trendDirection: 'down',
    timeAgo: '1 hour ago',
    crimeTypes: ['Shoplifting', 'Fraud', 'Assault'],
  },
];

const trend = [
  { day: 'Mon', theft: 45, assault: 12, vandalism: 8, burglary: 15 },
  { day: 'Tue', theft: 52, assault: 15, vandalism: 11, burglary: 18 },
  { day: 'Wed', theft: 48, assault: 10, vandalism: 9, burglary: 14 },
  { day: 'Thu', theft: 61, assault: 18, vandalism: 13, burglary: 20 },
  { day: 'Fri', theft: 58, assault: 22, vandalism: 16, burglary: 23 },
  { day: 'Sat', theft: 67, assault: 28, vandalism: 19, burglary: 25 },
  { day: 'Sun', theft: 55, assault: 20, vandalism: 14, burglary: 19 },
];

const crimeTypes = ['theft', 'assault', 'vandalism', 'burglary', 'robbery', 'drug-related'];
const severities = ['high', 'medium', 'low'];

const timeLabels = [
  '5 mins ago',
  '12 mins ago',
  '24 mins ago',
  '35 mins ago',
  '48 mins ago',
  '1 hour ago',
  '1.5 hours ago',
  '2 hours ago',
];

const zones = {
  'Fort District': { baseLat: 18.9547, baseLng: 72.829, spread: 0.02, count: 45 },
  'Marine Drive': { baseLat: 18.9432, baseLng: 72.8236, spread: 0.02, count: 28 },
  'Eastern Suburbs': { baseLat: 19.0596, baseLng: 72.8295, spread: 0.025, count: 52 },
  'Northern Suburbs': { baseLat: 19.1136, baseLng: 72.8697, spread: 0.025, count: 18 },
  'Bandra-Worli': { baseLat: 19.0596, baseLng: 72.8295, spread: 0.02, count: 31 },
};

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateIncidents() {
  const incidents = [];
  Object.entries(zones).forEach(([zone, cfg]) => {
    for (let i = 0; i < cfg.count; i += 1) {
      incidents.push({
        lat: Number((cfg.baseLat + (Math.random() - 0.5) * cfg.spread).toFixed(6)),
        lng: Number((cfg.baseLng + (Math.random() - 0.5) * cfg.spread).toFixed(6)),
        type: pick(crimeTypes),
        severity: pick(severities),
        timeAgo: pick(timeLabels),
        zone,
      });
    }
  });
  return incidents;
}

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(DB_NAME);

  const incidents = generateIncidents();

  console.log('Seeding database', DB_NAME);
  console.log('Note: Only incidents collection is used. Metrics, zones, and trends are calculated dynamically.');

  // Clear all collections (in case old ones exist)
  await Promise.all([
    db.collection('metrics').deleteMany({}),
    db.collection('zones').deleteMany({}),
    db.collection('trends').deleteMany({}),
    db.collection('incidents').deleteMany({}),
  ]);

  // Only insert incidents - everything else will be calculated
  await db.collection('incidents').insertMany(incidents);

  console.log('Inserted:', {
    incidents: incidents.length,
  });
  console.log('All metrics, risk zones, and trends will be calculated from incidents at runtime.');

  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
