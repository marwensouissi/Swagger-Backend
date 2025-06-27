import http from 'k6/http';
import { check } from 'k6';

// Function to perform login and return token
export function login(email, password, baseUrl) {
    const payload = JSON.stringify({
        username: email,
        password: password
    });

    const headers = {
        'Content-Type': 'application/json',
    };

    const res = http.post(`${baseUrl}/auth/login`, payload, { headers });

    // Validate login response
    const success = check(res, {
        "Login successful - status 200": (r) => r.status === 200 && r.json('token') !== undefined,
    });

    return res.json('token');
}
