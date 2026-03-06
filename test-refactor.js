const app = require('./api/index');
const http = require('http');

async function test() {
    console.log("🧪 Testing Refactored Backend...");

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    const endpoints = [
        { method: 'GET', path: '/api/health' },
        { method: 'GET', path: '/health' },
        { method: 'POST', path: '/api/login', body: {} },
        { method: 'POST', path: '/login', body: {} },
        { method: 'POST', path: '/api/api/login', body: {} }
    ];

    for (const ep of endpoints) {
        try {
            const options = {
                method: ep.method,
                headers: { 'Content-Type': 'application/json' }
            };
            const req = http.request(`${baseUrl}${ep.path}`, options, (res) => {
                console.log(`[${res.statusCode}] ${ep.method} ${ep.path}`);
            });
            if (ep.body) req.write(JSON.stringify(ep.body));
            req.end();
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(`Failed ${ep.path}:`, e.message);
        }
    }

    server.close();
    console.log("✅ Local route tests completed.");
}

test();
