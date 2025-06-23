import { signup, login, logout } from './auth.js';
import { sleep } from 'k6';

// ✅ Test Configurations
const BASE_URL = 'https://dev-itona.xyz/api';
const PASSWORD = '123123123'; // Fixed password for new users

// ✅ k6 Test Options (Adjust VUs & Duration as Needed)
export let options = {
    vus: 2,
    duration: '10s',
};

// ✅ Main k6 Execution Function
export default function () {
    // ************* SIGNUP & VERIFICATION TEST *********************/
    const user = signup();
    if (!user) return;

    // ************* LOGIN TEST *********************/
    const token = login(user.email, PASSWORD); // Use the generated email and fixed password
    if (!token) return;

    // ************* LOGOUT TEST *********************/
    logout(token);

    sleep(1);
}
