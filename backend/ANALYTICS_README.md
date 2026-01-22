# Analytics Backend Documentation

## Overview
The analytics backend is separated into dedicated files for better organization and maintainability.

## File Structure

```
backend/
├── controllers/
│   └── analyticsController.js    # Analytics business logic
├── routes/
│   └── analyticsRoutes.js        # Analytics API endpoints
└── server.js                     # Main server (includes analytics routes)
```

## API Endpoints

All analytics endpoints are prefixed with `/api/analytics`

### 1. Get All Prescriptions
**Endpoint:** `GET /api/analytics/prescriptions`

**Query Parameters:**
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `limit` (optional): Maximum number of records (default: 1000)

**Response:**
```json
{
  "success": true,
  "prescriptions": [...],
  "count": 150
}
```

**Note:** X-ray data URLs are excluded for performance

---

### 2. Get Analytics Summary
**Endpoint:** `GET /api/analytics/summary`

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalPrescriptions": 150,
    "totalPatients": 120,
    "monthlyCount": 45,
    "avgPerDay": "5.0"
  }
}
```

---

### 3. Get Gender Distribution
**Endpoint:** `GET /api/analytics/gender-distribution`

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "success": true,
  "genderDistribution": [
    { "_id": "Male", "count": 80 },
    { "_id": "Female", "count": 65 },
    { "_id": "Other", "count": 5 }
  ]
}
```

---

### 4. Get Age Distribution
**Endpoint:** `GET /api/analytics/age-distribution`

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "success": true,
  "ageDistribution": [
    { "count": 20, "ageGroup": ["0-18", "19-35", "36-50", "51-65", "65+"] }
  ]
}
```

**Age Groups:**
- 0-18: Children and teens
- 19-35: Young adults
- 36-50: Middle-aged
- 51-65: Seniors
- 65+: Elderly

---

### 5. Get Top Medicines
**Endpoint:** `GET /api/analytics/top-medicines`

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)
- `limit` (optional): Number of top medicines (default: 10)

**Response:**
```json
{
  "success": true,
  "topMedicines": [
    { "_id": "Paracetamol", "count": 45 },
    { "_id": "Amoxicillin", "count": 32 },
    { "_id": "Ibuprofen", "count": 28 }
  ]
}
```

---

### 6. Get Prescriptions Over Time
**Endpoint:** `GET /api/analytics/prescriptions-over-time`

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)
- `groupBy` (optional): `daily`, `weekly`, or `monthly` (default: daily)

**Response:**
```json
{
  "success": true,
  "timeSeriesData": [
    { "_id": { "year": 2025, "month": 10, "day": 1 }, "count": 5 },
    { "_id": { "year": 2025, "month": 10, "day": 2 }, "count": 8 }
  ]
}
```

---

### 7. Get Recent Patients
**Endpoint:** `GET /api/analytics/recent-patients`

**Query Parameters:**
- `limit` (optional): Number of recent patients (default: 10)

**Response:**
```json
{
  "success": true,
  "recentPatients": [
    {
      "patientName": "John Doe",
      "age": 35,
      "sex": "Male",
      "date": "2025-10-01T14:30:00.000Z",
      "medicines": [...],
      "mobile": "1234567890"
    }
  ]
}
```

---

## Controller Functions

### `analyticsController.js`

All controller functions follow this pattern:
- Accept query parameters for filtering
- Use MongoDB aggregation for complex queries
- Return consistent response format with `success` flag
- Handle errors gracefully with error messages

**Functions:**
1. `getAllPrescriptions` - Fetch all prescriptions with optional filters
2. `getAnalyticsSummary` - Calculate summary statistics
3. `getGenderDistribution` - Aggregate by gender
4. `getAgeDistribution` - Aggregate by age groups
5. `getTopMedicines` - Find most prescribed medicines
6. `getPrescriptionsOverTime` - Time-series data
7. `getRecentPatients` - Latest patient records

---

## Authentication

Currently, analytics endpoints are **not protected** by authentication middleware.

To enable authentication, uncomment the middleware in `analyticsRoutes.js`:

```javascript
// Add authMiddleware to protect all routes
router.use(authMiddleware);
```

Or protect individual routes:

```javascript
router.get("/prescriptions", authMiddleware, analyticsController.getAllPrescriptions);
```

---

## Performance Considerations

1. **X-ray Data Exclusion**: Large X-ray data URLs are excluded from analytics queries using `.select('-xray.dataUrl')`

2. **Limit Parameter**: Default limit of 1000 records prevents overwhelming the client

3. **Lean Queries**: Uses `.lean()` for better performance when Mongoose documents aren't needed

4. **Aggregation Pipeline**: Uses MongoDB aggregation for efficient grouping and counting

---

## Frontend Integration

The `analytics.html` page uses the dedicated analytics API:

```javascript
// Fetch prescriptions
fetch("http://localhost:5000/api/analytics/prescriptions?limit=1000", {
  headers: { "Authorization": `Bearer ${token}` }
})
```

**Fallback:** If the API is unavailable, the frontend falls back to localStorage data.

---

## Future Enhancements

1. **Caching**: Add Redis caching for frequently accessed analytics
2. **Real-time Updates**: Implement WebSocket for live analytics
3. **Export Features**: Add CSV/PDF export endpoints
4. **Advanced Filters**: Add doctor-specific, diagnosis-based filters
5. **Predictive Analytics**: ML-based patient trend predictions

---

## Testing

Test the analytics endpoints using curl or Postman:

```bash
# Get all prescriptions
curl http://localhost:5000/api/analytics/prescriptions

# Get summary with date filter
curl "http://localhost:5000/api/analytics/summary?startDate=2025-09-01&endDate=2025-10-01"

# Get top 5 medicines
curl "http://localhost:5000/api/analytics/top-medicines?limit=5"
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200`: Success
- `500`: Server error
- `401`: Unauthorized (if auth is enabled)
