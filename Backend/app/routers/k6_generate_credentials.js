// import http from 'k6/http';
// import { sleep } from 'k6';
// import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJiZWphdWxsZWl5b2lnaS04MTgwQHlvcG1haWwuY29tIiwidXNlcklkIjoiYjI1YmZkNzAtNTAwZi0xMWYwLThkNzYtZmZlOWNhN2ZlYjU3Iiwic2NvcGVzIjpbIlRFTkFOVF9BRE1JTiJdLCJzZXNzaW9uSWQiOiI5MjUxNmUwNC02MGJhLTQzNGUtOTNmZS1iZTM5NTcyZjBhNWMiLCJpc3MiOiJpdG9uYS5uZXQiLCJpYXQiOjE3NTA2Njg4OTQsImV4cCI6MTc1MDY3Nzg5NCwiZmlyc3ROYW1lIjoibXRlc3QiLCJsYXN0TmFtZSI6Im10ZXN0IiwiZW5hYmxlZCI6dHJ1ZSwiaXNQdWJsaWMiOmZhbHNlLCJ0ZW5hbnRJZCI6ImIxYTNmODEwLTUwMGYtMTFmMC04ZDc2LWZmZTljYTdmZWI1NyIsImN1c3RvbWVySWQiOiIxMzgxNDAwMC0xZGQyLTExYjItODA4MC04MDgwODA4MDgwODAiLCJpc1N1cGVyVXNlciI6dHJ1ZX0.GPi-LND6zNPPVkLtfIwdGxoylyKxlqe12gB-Vs-_JIDICSCqfjTLKwS8DafPIK9P3IKPJmz6LdIIKlMNIMAAcw";
// const baseUrl = "https://www.itona.ai/api";
// let credentialsList = [];

// export let options = {
//     vus:"1",
//     iterations: "3",
// };

// function createDevice() {
//     const headers = {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//     };

//     const payload = JSON.stringify({
//         name: `device-${randomString(5)}`,
//         label: "LoadTest Device",
//         additionalInfo: {}
//     });

//     const res = http.post(`${baseUrl}/device`, payload, { headers });

//     const json = res.json();
//     return json && json.id && json.id.id ? json.id.id : null;
// }

// function getDeviceCredentials(deviceId) {
//     const headers = {
//         'Authorization': `Bearer ${token}`,
//     };

//     const res = http.get(`${baseUrl}/device/${deviceId}/credentials`, { headers });

//     const json = res.json();
//     return json && json.credentialsId ? json.credentialsId : null;
// }

// // ✅ Helper to safely stringify
// function safeJSONOutput(obj) {
//     try {
//         return JSON.stringify(obj);
//     } catch (e) {
//         return JSON.stringify({ error: "Failed to serialize JSON", message: e.message });
//     }
// }

// export default function () {
//     const deviceId = createDevice();
//     if (!deviceId) return;

//     const credentialsId = getDeviceCredentials(deviceId);
//     if (credentialsId) {
//         credentialsList.push(credentialsId);
//     }

//     sleep(1);
// }

// export function teardown() {
//     console.log(safeJSONOutput({ credentials: credentialsList }));
// }
import http from 'k6/http';
import { sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ✅ Configuration
const BASE_URL = 'https://www.itona.ai/api';
const PASSWORD = '123123';
const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0dWxveG9rb3JldS03MzEyMUB5b3BtYWlsLmNvbSIsInVzZXJJZCI6ImM4MzdiMzEwLTRhY2QtMTFmMC1iMzdmLWViNWY2NDM4MDMzYiIsInNjb3BlcyI6WyJURU5BTlRfQURNSU4iXSwic2Vzc2lvbklkIjoiNzU5MmUyMjItYmIwZi00ZGM0LWEzOWEtMjczNDZhNWRhYzk0IiwiaXNzIjoiaXRvbmEubmV0IiwiaWF0IjoxNzUwMDkwODI2LCJleHAiOjE3NTAwOTk4MjYsImZpcnN0TmFtZSI6ImtoYWxpbCIsImxhc3ROYW1lIjoia2hhbGlsIiwiZW5hYmxlZCI6dHJ1ZSwiaXNQdWJsaWMiOmZhbHNlLCJ0ZW5hbnRJZCI6ImM4MTY5NjgwLTRhY2QtMTFmMC1iMzdmLWViNWY2NDM4MDMzYiIsImN1c3RvbWVySWQiOiIxMzgxNDAwMC0xZGQyLTExYjItODA4MC04MDgwODA4MDgwODAiLCJpc1N1cGVyVXNlciI6dHJ1ZX0.KyvfF3Xzm3o69zF81bwpCrBQjP-ys1_oxlebCyb-HXKtAKM6A4tMVeROg8bfyByUvofckrQU-dkrIRIKlmoH3g";

// Global in-memory list to store credentials IDs
let credentialsList = [];

export let options = {
    vus: 200,
    iterations: 200,
};

// Function to create a device
function createDevice(token) {
    console.log(`🛠 Creating device...`);
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    let payload = JSON.stringify({
        "name": `sdsd-${randomString(5)}`,
        "label": "Test Device",
        "additionalInfo": {}
    });

    let res = http.post(`${BASE_URL}/device`, payload, { headers });

    if (!res.json().id?.id) {
        console.error("❌ Failed to create device", res.status, res.body);
        return null;
    }

    console.log(`✅ Device Created: ${res.json().id.id}`);
    return res.json().id.id;
}

// Function to get device credentials
function getDeviceCredentials(deviceId, token) {
    console.log(`🔑 Fetching credentials for device: ${deviceId}`);

    let headers = {
        'Authorization': `Bearer ${token}`,
    };

    let res = http.get(`${BASE_URL}/device/${deviceId}/credentials`, { headers });

    let credentialsId = res.json()?.credentialsId || null;
    if (!credentialsId) {
        console.error(`❌ Failed to fetch credentials for device: ${deviceId}`);
        return null;
    }

    console.log(`✅ Credentials Retrieved: ${credentialsId}`);

    // Append to the global list instead of file
    appendCredentialsToList(credentialsId);

    return credentialsId;
}

// Append credentials to global list
function appendCredentialsToList(credentialsId) {
    credentialsList.push({ credentialsId });
    console.log(`✅ Credentials added to list: ${credentialsId}`);
}

// Default function executed by each VU/iteration
export default function () {
    console.log(`🚀 Starting execution for VU: ${__VU}, Iteration: ${__ITER}`);

    let deviceId = createDevice(token);
    if (!deviceId) return;

    getDeviceCredentials(deviceId, token);

    sleep(2);
}

// Teardown function to output final list as JSON
export function teardown() {
    console.log(JSON.stringify({ credentials: credentialsList }, null, 2));
}
