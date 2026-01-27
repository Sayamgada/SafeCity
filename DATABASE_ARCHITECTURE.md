# Database Architecture

## Single Collection Design

The dashboard now uses a **single MongoDB collection** called `incidents` to store all crime data. All metrics, risk zones, and trends are calculated dynamically at runtime from this single source of truth.

### Collection: `incidents`

Each incident document contains:
```json
{
  "_id": ObjectId,
  "lat": 19.0760,
  "lng": 72.8777,
  "type": "theft|assault|vandalism|burglary|robbery|drug-related",
  "severity": "high|medium|low",
  "timeAgo": "15 mins ago",
  "zone": "Downtown District",
  "timestamp": ISODate (optional)
}
```

### Calculated Data

All dashboard components receive data calculated from incidents:

#### 1. **Metrics** (Real-time calculation)
- **Total Incidents**: Count of all incidents
- **Crime Rate Change**: Comparison with historical data
- **High-Risk Zones**: Count of unique zones with high severity incidents
- **Patrol Efficiency**: Calculated metric

#### 2. **Risk Zones** (Dynamic aggregation)
- Aggregates incidents by zone
- Calculates risk score based on:
  - Number of incidents
  - Ratio of high-severity incidents
- Identifies top crime types per zone
- Ranks zones by risk score

#### 3. **Crime Trends** (Time-based analysis)
- Groups incidents by crime type
- Distributes across days of the week
- Calculates totals for theft, assault, vandalism, and burglary

#### 4. **Map Incidents** (Direct query)
- Returns all incidents for visualization
- No pre-processing required

## Benefits

✅ **Single source of truth** - No data duplication or sync issues
✅ **Real-time analysis** - Metrics always reflect current data
✅ **Simplified maintenance** - Only one collection to manage
✅ **Flexible querying** - Easy to add new metrics or filters
✅ **Scalable** - Can add indexes for performance as data grows

## Seeding the Database

Run the seed script to populate incidents:

```bash
node scripts/seed.js
```

This will:
- Clear the `incidents` collection
- Generate and insert ~174 sample incidents across 5 zones
- All dashboard data will be calculated automatically when the app loads

## Future Enhancements

To improve performance with large datasets:
1. Add MongoDB indexes on frequently queried fields (`zone`, `type`, `severity`, `timestamp`)
2. Implement date range filtering
3. Use MongoDB aggregation pipeline for complex calculations
4. Consider caching calculated metrics with a TTL
