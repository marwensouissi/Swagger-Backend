import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const PASSWORD = '123123123';
const VERIFICATION_CODE = '123456';
const BASE_URL = 'https://dev-itona.xyz/api';

/**
 * Utility function to handle API requests.
 * @param {string} method - HTTP method ('GET', 'POST', etc.).
 * @param {string} url - API endpoint URL.
 * @param {Object|null} payload - Request body data.
 * @param {string|null} token - Optional authentication token.
 * @returns {Object|null} - API response JSON or null if the request fails.
 */
function makeRequest(method, url, payload = null, token = null) {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = { headers };
    const response = payload 
        ? http[method.toLowerCase()](url, JSON.stringify(payload), params)
        : http[method.toLowerCase()](url, params);

    return check(response, { [`✅ ${method} ${url} - Success`]: (r) => r.status === 200 })
        ? response.json() 
        : null;
}

/**
 * Registers a new user and verifies their email.
 * @returns {Object|null} - Verified user object { email, password } or null if signup fails.
 */
export function signup() {
    const email = `test-${randomString(5)}-${randomIntBetween(100, 1000)}@yopmail.com`;

    const user = {
        email,
        password: PASSWORD,
        firstName: `firstName-${randomString(5)}`,
        lastName: `lastName-${randomString(5)}`,
        phone: '12345678'
    };

    if (!makeRequest('POST', `${BASE_URL}/noauth/signup`, user)) {
        return null;
    }

    sleep(1); // Simulate real-world delay before verification

    return verifyUser(email) ? user : null;
}

/**
 * Verifies a user's email using a static OTP code.
 * @param {string} email - The email to verify.
 * @returns {boolean} - True if verification is successful, otherwise false.
 */
export function verifyUser(email) {
    const payload = { email, otpCode: VERIFICATION_CODE };
    return !!makeRequest('POST', `${BASE_URL}/noauth/autoLoginByEmail`, payload);
}

/**
 * Logs in a user and returns an authentication token.
 * @param {string} email - User email.
 * @param {string} password - User password.
 * @returns {string|null} - Authentication token or null if login fails.
 */
export function login(email, password) {
    const payload = { username: email, password };
    const response = makeRequest('POST', `${BASE_URL}/auth/login`, payload);
    return response ? response.token : null;
}

/**
 * Logs out a user.
 * @param {string} token - Authentication token.
 * @returns {boolean} - True if logout is successful, otherwise false.
 */
export function logout(token) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const res = http.post(`${BASE_URL}/auth/logout`, null, { headers });

    return check(res, {
        "Logout successful - status 200": (r) => r.status === 200,
    });
}
