// Using native fetch (Node 18+)

const BASE_URL = 'http://localhost:5000';

async function checkEndpoint(name, url, method = 'GET') {
    try {
        const res = await fetch(`${BASE_URL}${url}`, { method });
        console.log(`[${res.ok ? 'PASS' : 'FAIL'}] ${name} (${url}) - Status: ${res.status}`);
        return res.ok;
    } catch (err) {
        console.log(`[FAIL] ${name} (${url}) - Error: ${err.message}`);
        return false;
    }
}

async function runTests() {
    console.log('--- Starting System Health Check ---');

    // 1. Server Root
    await checkEndpoint('Server Root', '/');

    // 2. Auth Routes (Should return 404 or specific error if not post, but just checking reachability)
    // Actually, let's check a GET route if available or just ensure it doesn't timeout.
    // /api/auth usually implies POST login.
    // Let's check /api/medicines (protected, should return 401)
    const medRes = await fetch(`${BASE_URL}/api/medicines`);
    console.log(`[${medRes.status === 401 ? 'PASS' : 'WARN'}] Protected Route (Medicines) - Expected 401, Got: ${medRes.status}`);

    // 3. Public Routes? Most are protected.
    // /api/appointments/requests might be open or 401. User said it was public earlier? 
    // Wait, I saw "Remove authorization header for now" in doctor-appointments.js. 
    // So /api/appointments/requests might be public.
    await checkEndpoint('Appointment Requests', '/api/appointments/requests');

    // 4. Doctor Stats (Protected) - Expect 401
    const statsRes = await fetch(`${BASE_URL}/api/doctor/appointments/stats`);
    console.log(`[${statsRes.status === 401 ? 'PASS' : 'WARN'}] Protected Route (Doctor Stats) - Expected 401, Got: ${statsRes.status}`);

    console.log('--- Health Check Complete ---');
}

runTests();
