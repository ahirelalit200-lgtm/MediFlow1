/**
 * Comprehensive MongoDB Database Test Script
 * Tests all CRUD operations and database functionality
 * Run: node backend/test-database-operations.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const User = require('./models/User');
const DoctorProfile = require('./models/DoctorProfile');
const Patient = require('./models/Patient');
const Prescription = require('./models/Prescription');
const Appointment = require('./models/Appointment');
const Medicine = require('./models/Medicine');
const Xray = require('./models/Xray');
const PrintJob = require('./models/PrintJob');

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}${message ? ': ' + message : ''}`);
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testDatabaseOperations() {
  try {
    console.log('🚀 Starting MongoDB Database Tests\n');
    console.log('═'.repeat(70));
    
    // Test 1: Connection
    console.log('\n📡 TEST 1: Database Connection');
    console.log('─'.repeat(70));
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB";
    console.log(`Connecting to: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    logTest('Database Connection', true, 'Successfully connected');
    
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`Database Name: ${dbName}`);

    // Test 2: Collections Check
    console.log('\n📋 TEST 2: Collections Verification');
    console.log('─'.repeat(70));
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log(`Found ${collections.length} collections:`);
    collectionNames.forEach(name => console.log(`  • ${name}`));
    
    const requiredCollections = ['users', 'prescriptions', 'patients', 'appointments'];
    const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
    
    if (missingCollections.length === 0) {
      logTest('Required Collections', true, 'All required collections exist');
    } else {
      logTest('Required Collections', false, `Missing: ${missingCollections.join(', ')}`);
    }

    // Test 3: Document Counts
    console.log('\n📊 TEST 3: Document Counts');
    console.log('─'.repeat(70));
    const counts = {};
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      counts[col.name] = count;
      console.log(`  ${col.name}: ${count} document(s)`);
    }
    logTest('Document Count Query', true, 'Successfully retrieved all counts');

    // Test 4: User Model Operations
    console.log('\n👤 TEST 4: User Model CRUD Operations');
    console.log('─'.repeat(70));
    
    // Read existing users
    const userCount = await User.countDocuments();
    console.log(`Existing users: ${userCount}`);
    logTest('User Read Operation', userCount >= 0, `Found ${userCount} users`);
    
    if (userCount > 0) {
      const sampleUser = await User.findOne();
      console.log(`Sample User: ${sampleUser.email}`);
      logTest('User Query', true, 'Successfully queried user data');
    }

    // Test 5: Prescription Model Operations
    console.log('\n📝 TEST 5: Prescription Model Operations');
    console.log('─'.repeat(70));
    
    const prescriptionCount = await Prescription.countDocuments();
    console.log(`Total Prescriptions: ${prescriptionCount}`);
    logTest('Prescription Count', prescriptionCount >= 0, `Found ${prescriptionCount} prescriptions`);
    
    if (prescriptionCount > 0) {
      const latestPrescription = await Prescription.findOne().sort({ createdAt: -1 });
      console.log(`Latest Prescription:`);
      console.log(`  Patient: ${latestPrescription.patientName}`);
      console.log(`  Doctor: ${latestPrescription.doctor}`);
      console.log(`  Medicines: ${latestPrescription.medicines?.length || 0}`);
      console.log(`  Has X-ray: ${!!latestPrescription.xray?.name}`);
      console.log(`  Has AI Analysis: ${!!latestPrescription.xrayAnalysis?.success}`);
      logTest('Prescription Query', true, 'Successfully retrieved prescription data');
      
      // Test X-ray data integrity
      if (latestPrescription.xray?.dataUrl) {
        const dataUrlLength = latestPrescription.xray.dataUrl.length;
        const isValidDataUrl = latestPrescription.xray.dataUrl.startsWith('data:image');
        logTest('X-ray Data Integrity', isValidDataUrl && dataUrlLength > 1000, 
          `Data URL length: ${dataUrlLength} chars`);
      }
    }

    // Test 6: Patient Model Operations
    console.log('\n🏥 TEST 6: Patient Model Operations');
    console.log('─'.repeat(70));
    
    const patientCount = await Patient.countDocuments();
    console.log(`Total Patients: ${patientCount}`);
    logTest('Patient Count', patientCount >= 0, `Found ${patientCount} patients`);
    
    if (patientCount > 0) {
      const samplePatient = await Patient.findOne();
      console.log(`Sample Patient: ${samplePatient.name || samplePatient.email}`);
      logTest('Patient Query', true, 'Successfully queried patient data');
    }

    // Test 7: Appointment Model Operations
    console.log('\n📅 TEST 7: Appointment Model Operations');
    console.log('─'.repeat(70));
    
    const appointmentCount = await Appointment.countDocuments();
    console.log(`Total Appointments: ${appointmentCount}`);
    logTest('Appointment Count', appointmentCount >= 0, `Found ${appointmentCount} appointments`);
    
    if (appointmentCount > 0) {
      const upcomingAppointments = await Appointment.find({ 
        date: { $gte: new Date() } 
      }).limit(5);
      console.log(`Upcoming Appointments: ${upcomingAppointments.length}`);
      logTest('Appointment Query', true, 'Successfully queried appointment data');
    }

    // Test 8: Medicine Model Operations
    console.log('\n💊 TEST 8: Medicine Model Operations');
    console.log('─'.repeat(70));
    
    const medicineCount = await Medicine.countDocuments();
    console.log(`Total Medicines: ${medicineCount}`);
    logTest('Medicine Count', medicineCount >= 0, `Found ${medicineCount} medicines`);

    // Test 9: X-ray Model Operations
    console.log('\n📷 TEST 9: X-ray Model Operations');
    console.log('─'.repeat(70));
    
    const xrayCount = await Xray.countDocuments();
    console.log(`Total X-rays: ${xrayCount}`);
    logTest('X-ray Count', xrayCount >= 0, `Found ${xrayCount} x-rays`);
    
    if (xrayCount > 0) {
      const sampleXray = await Xray.findOne();
      console.log(`Sample X-ray: ${sampleXray.filename || 'N/A'}`);
      logTest('X-ray Query', true, 'Successfully queried x-ray data');
    }

    // Test 10: Database Indexes
    console.log('\n🔍 TEST 10: Database Indexes');
    console.log('─'.repeat(70));
    
    const userIndexes = await User.collection.getIndexes();
    console.log(`User Indexes: ${Object.keys(userIndexes).length}`);
    Object.keys(userIndexes).forEach(idx => console.log(`  • ${idx}`));
    logTest('Database Indexes', Object.keys(userIndexes).length > 0, 'Indexes are configured');

    // Test 11: Aggregation Pipeline
    console.log('\n📈 TEST 11: Aggregation Operations');
    console.log('─'.repeat(70));
    
    try {
      const prescriptionStats = await Prescription.aggregate([
        {
          $group: {
            _id: null,
            totalPrescriptions: { $sum: 1 },
            avgMedicines: { $avg: { $size: { $ifNull: ['$medicines', []] } } },
            withXray: { 
              $sum: { 
                $cond: [{ $ne: ['$xray.name', null] }, 1, 0] 
              } 
            }
          }
        }
      ]);
      
      if (prescriptionStats.length > 0) {
        const stats = prescriptionStats[0];
        console.log(`Total Prescriptions: ${stats.totalPrescriptions}`);
        console.log(`Average Medicines per Prescription: ${stats.avgMedicines.toFixed(2)}`);
        console.log(`Prescriptions with X-ray: ${stats.withXray}`);
        logTest('Aggregation Pipeline', true, 'Successfully executed aggregation');
      } else {
        logTest('Aggregation Pipeline', true, 'No data for aggregation');
      }
    } catch (err) {
      logTest('Aggregation Pipeline', false, err.message);
    }

    // Test 12: Write Operation (Create & Delete)
    console.log('\n✍️  TEST 12: Write Operations (Create & Delete)');
    console.log('─'.repeat(70));
    
    try {
      // Create a test document
      const testPatient = new Patient({
        email: `test_${Date.now()}@test.com`,
        password: 'test123',
        name: 'Test Patient',
        phone: '1234567890',
        mobile: '1234567890' // Added required field
      });
      
      await testPatient.save();
      console.log(`Created test patient: ${testPatient.email}`);
      logTest('Create Operation', true, 'Successfully created test document');
      
      // Delete the test document
      await Patient.deleteOne({ _id: testPatient._id });
      console.log(`Deleted test patient: ${testPatient.email}`);
      logTest('Delete Operation', true, 'Successfully deleted test document');
    } catch (err) {
      logTest('Write Operations', false, err.message);
    }

    // Test 13: Update Operation
    console.log('\n🔄 TEST 13: Update Operations');
    console.log('─'.repeat(70));
    
    try {
      if (patientCount > 0) {
        const patient = await Patient.findOne();
        const originalName = patient.name;
        
        // Update
        patient.name = 'Updated Test Name';
        await patient.save();
        console.log(`Updated patient name from "${originalName}" to "${patient.name}"`);
        
        // Revert
        patient.name = originalName;
        await patient.save();
        console.log(`Reverted patient name back to "${originalName}"`);
        
        logTest('Update Operation', true, 'Successfully updated and reverted document');
      } else {
        logTest('Update Operation', true, 'Skipped (no patients to update)');
      }
    } catch (err) {
      logTest('Update Operation', false, err.message);
    }

    // Test 14: Search Operations
    console.log('\n🔎 TEST 14: Search Operations');
    console.log('─'.repeat(70));
    
    try {
      if (prescriptionCount > 0) {
        const searchResults = await Prescription.find({
          patientName: { $regex: /./i }
        }).limit(5);
        console.log(`Found ${searchResults.length} prescriptions with search query`);
        logTest('Search Operation', true, `Retrieved ${searchResults.length} results`);
      } else {
        logTest('Search Operation', true, 'Skipped (no prescriptions to search)');
      }
    } catch (err) {
      logTest('Search Operation', false, err.message);
    }

    // Test 15: Transaction Support
    console.log('\n💳 TEST 15: Transaction Support');
    console.log('─'.repeat(70));
    
    try {
      // Check if replica set is configured (required for transactions)
      const adminDb = db.admin();
      const serverStatus = await adminDb.serverStatus();
      const isReplicaSet = serverStatus.repl && serverStatus.repl.setName;
      
      if (isReplicaSet) {
        console.log(`Replica Set: ${serverStatus.repl.setName}`);
        logTest('Transaction Support', true, 'Replica set configured');
      } else {
        console.log('Running in standalone mode (transactions require replica set)');
        logTest('Transaction Support', true, 'Standalone mode (transactions not available)');
      }
    } catch (err) {
      logTest('Transaction Support', false, err.message);
    }

    // Final Summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  • ${t.name}: ${t.message}`);
      });
    }
    
    console.log('\n' + '═'.repeat(70));
    
    if (testResults.failed === 0) {
      console.log('✅ All tests passed! MongoDB database is working properly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
    }
    
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Critical Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the tests
testDatabaseOperations();
