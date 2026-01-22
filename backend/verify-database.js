/**
 * Database Verification Script
 * Checks if all data is properly stored in MongoDB
 * Run: node backend/verify-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Prescription = require('./models/Prescription');

async function verifyDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB");
    console.log('✅ Connected to MongoDB\n');

    // Get total prescriptions
    const totalPrescriptions = await Prescription.countDocuments();
    console.log(`📊 Total Prescriptions: ${totalPrescriptions}\n`);

    if (totalPrescriptions === 0) {
      console.log('⚠️  No prescriptions found in database');
      console.log('💡 Create a prescription first to test database storage\n');
      await mongoose.connection.close();
      return;
    }

    // Get latest prescription
    const latestPrescription = await Prescription.findOne().sort({ createdAt: -1 });
    
    console.log('📋 Latest Prescription Details:');
    console.log('─'.repeat(60));
    console.log(`Patient Name: ${latestPrescription.patientName}`);
    console.log(`Patient Email: ${latestPrescription.patientEmail || 'N/A'}`);
    console.log(`Mobile: ${latestPrescription.mobile || 'N/A'}`);
    console.log(`Doctor: ${latestPrescription.doctor}`);
    console.log(`Treatment Type: ${latestPrescription.treatmentType || 'N/A'}`);
    console.log(`Date: ${latestPrescription.date}`);
    console.log(`Medicines Count: ${latestPrescription.medicines?.length || 0}`);
    console.log(`Has Notes: ${!!latestPrescription.notes}`);
    console.log(`Has Treatment: ${!!latestPrescription.treatment}`);
    console.log(`Follow-up Date: ${latestPrescription.followUpDate || 'N/A'}`);
    
    // Check X-ray
    console.log('\n📷 X-ray Storage:');
    console.log('─'.repeat(60));
    if (latestPrescription.xray && latestPrescription.xray.name) {
      console.log(`✅ X-ray Found: ${latestPrescription.xray.name}`);
      console.log(`   Type: ${latestPrescription.xray.type}`);
      console.log(`   Size: ${(latestPrescription.xray.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Has Data URL: ${!!latestPrescription.xray.dataUrl}`);
      console.log(`   Data URL Length: ${latestPrescription.xray.dataUrl?.length || 0} characters`);
    } else {
      console.log('❌ No X-ray stored');
    }

    // Check AI Analysis
    console.log('\n🤖 AI Analysis Storage:');
    console.log('─'.repeat(60));
    if (latestPrescription.xrayAnalysis && latestPrescription.xrayAnalysis.success) {
      console.log(`✅ AI Analysis Found`);
      console.log(`   Success: ${latestPrescription.xrayAnalysis.success}`);
      console.log(`   X-ray Type: ${latestPrescription.xrayAnalysis.xrayType}`);
      console.log(`   Timestamp: ${latestPrescription.xrayAnalysis.timestamp}`);
      console.log(`   Severity: ${latestPrescription.xrayAnalysis.severity}`);
      console.log(`   Confidence: ${(latestPrescription.xrayAnalysis.confidence * 100).toFixed(0)}%`);
      console.log(`   Findings Count: ${latestPrescription.xrayAnalysis.findings?.length || 0}`);
      console.log(`   Recommendations Count: ${latestPrescription.xrayAnalysis.recommendations?.length || 0}`);
      
      if (latestPrescription.xrayAnalysis.findings?.length > 0) {
        console.log('\n   Findings:');
        latestPrescription.xrayAnalysis.findings.forEach((finding, index) => {
          console.log(`   ${index + 1}. ${finding.type} - ${finding.location}`);
          console.log(`      Severity: ${finding.severity}, Confidence: ${(finding.confidence * 100).toFixed(0)}%`);
        });
      }
      
      if (latestPrescription.xrayAnalysis.recommendations?.length > 0) {
        console.log('\n   Recommendations:');
        latestPrescription.xrayAnalysis.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }
    } else {
      console.log('❌ No AI Analysis stored');
    }

    // Statistics
    console.log('\n📊 Database Statistics:');
    console.log('─'.repeat(60));
    
    const withXray = await Prescription.countDocuments({ 'xray.name': { $exists: true, $ne: null } });
    const withAnalysis = await Prescription.countDocuments({ 'xrayAnalysis.success': true });
    const withEmail = await Prescription.countDocuments({ patientEmail: { $exists: true, $ne: '' } });
    const withFollowUp = await Prescription.countDocuments({ followUpDate: { $exists: true, $ne: null } });
    
    console.log(`Prescriptions with X-ray: ${withXray} / ${totalPrescriptions}`);
    console.log(`Prescriptions with AI Analysis: ${withAnalysis} / ${totalPrescriptions}`);
    console.log(`Prescriptions with Email: ${withEmail} / ${totalPrescriptions}`);
    console.log(`Prescriptions with Follow-up: ${withFollowUp} / ${totalPrescriptions}`);

    // Treatment Types Distribution
    console.log('\n🦷 Treatment Types Distribution:');
    console.log('─'.repeat(60));
    const treatmentTypes = await Prescription.aggregate([
      { $match: { treatmentType: { $exists: true, $ne: '' } } },
      { $group: { _id: '$treatmentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    if (treatmentTypes.length > 0) {
      treatmentTypes.forEach(type => {
        console.log(`${type._id}: ${type.count}`);
      });
    } else {
      console.log('No treatment types recorded');
    }

    console.log('\n' + '─'.repeat(60));
    console.log('✅ Database verification complete!\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
