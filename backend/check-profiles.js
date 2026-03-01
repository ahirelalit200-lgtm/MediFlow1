// Quick script to check MongoDB for doctor profile data
const mongoose = require('mongoose');
require('dotenv').config();

const DoctorProfile = require('./models/DoctorProfile');

async function checkProfiles() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prescriptionDB');
        console.log('✅ Connected to MongoDB');

        const profiles = await DoctorProfile.find({}).lean();
        console.log('\n📋 Found', profiles.length, 'doctor profiles:\n');

        profiles.forEach((profile, index) => {
            console.log(`--- Profile ${index + 1} ---`);
            console.log('Email:', profile.email);
            console.log('Name:', profile.fullName);
            console.log('Registration No.:', profile.RegistrationNo || '(empty)');
            console.log('All fields:', JSON.stringify(profile, null, 2));
            console.log('');
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

checkProfiles();
