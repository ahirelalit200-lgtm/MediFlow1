# Quick MongoDB Database Check Guide

## 🚀 Quick Commands

### 1. Basic Connection Check (30 seconds)
```bash
node backend/check-mongodb.js
```
**What it checks:**
- MongoDB connection
- Database name
- All collections
- Document counts
- Collection status

---

### 2. Detailed Data Verification (1 minute)
```bash
node backend/verify-database.js
```
**What it checks:**
- Latest prescription details
- X-ray storage
- AI analysis data
- Database statistics
- Treatment types distribution

---

### 3. Comprehensive Test Suite (2 minutes)
```bash
node backend/test-database-operations.js
```
**What it checks:**
- All 21 database operations
- CRUD operations
- Search functionality
- Aggregation pipelines
- Data integrity
- Index configuration

---

## 📊 Current Database Status

### ✅ HEALTHY - All Systems Operational

**Last Check:** October 26, 2025

| Metric | Status | Value |
|--------|--------|-------|
| Connection | ✅ | Connected |
| Collections | ✅ | 8 collections |
| Total Documents | ✅ | 14 documents |
| Test Success Rate | ✅ | 100% (21/21) |
| Data Integrity | ✅ | Verified |

---

## 🔍 What to Check

### Daily Checks
- [ ] MongoDB service is running
- [ ] Database connection is active
- [ ] No error logs

### Weekly Checks
- [ ] Run comprehensive test suite
- [ ] Check document counts
- [ ] Verify data integrity
- [ ] Review performance metrics

### Monthly Checks
- [ ] Database backup verification
- [ ] Storage space review
- [ ] Index optimization
- [ ] Security audit

---

## 🚨 Troubleshooting

### MongoDB Not Connecting?

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # Or check services
   services.msc
   ```

2. **Verify connection string:**
   - Check `.env` file
   - Default: `mongodb://127.0.0.1:27017/prescriptionDB`

3. **Test connection manually:**
   ```bash
   mongosh
   ```

### Collections Missing?

Run setup script:
```bash
node backend/setup-xray-collections.js
```

### Data Not Saving?

1. Check model validation
2. Verify required fields
3. Check error logs in console
4. Run test suite to identify issue

---

## 📈 Database Metrics

### Current Data
- **Users:** 4
- **Doctor Profiles:** 4
- **Prescriptions:** 3
- **Appointments:** 2
- **Patients:** 1

### Storage
- **Database Size:** ~1 MB
- **Average Document:** ~50 KB
- **X-ray Storage:** Base64 in database

### Performance
- **Read Speed:** Fast ⚡
- **Write Speed:** Fast ⚡
- **Query Speed:** Fast ⚡

---

## 🔧 Maintenance Commands

### Backup Database
```bash
mongodump --db prescriptionDB --out ./backup
```

### Restore Database
```bash
mongorestore --db prescriptionDB ./backup/prescriptionDB
```

### Check Database Size
```bash
mongosh
> use prescriptionDB
> db.stats()
```

### View Collections
```bash
mongosh
> use prescriptionDB
> show collections
```

---

## 📝 Quick Reference

### Environment Variables
```env
MONGO_URI=mongodb://127.0.0.1:27017/prescriptionDB
PORT=5000
```

### Important Files
- `backend/models/` - Database schemas
- `backend/check-mongodb.js` - Quick check
- `backend/verify-database.js` - Detailed verification
- `backend/test-database-operations.js` - Full test suite
- `backend/DATABASE_HEALTH_REPORT.md` - Full health report

---

## ✅ All Clear Checklist

Before deploying or after major changes, verify:

- [ ] MongoDB connection successful
- [ ] All collections exist
- [ ] Test suite passes (21/21)
- [ ] No error logs
- [ ] Data integrity verified
- [ ] Indexes configured
- [ ] Backup completed

---

**Need Help?** Run the comprehensive test suite for detailed diagnostics:
```bash
node backend/test-database-operations.js
```
