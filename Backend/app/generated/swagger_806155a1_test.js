import {
get_abstract_with_payload,
get_abstract_without_payload,
post_abstract_with_payload,
patch_abstract_with_payload,
delete_abstract_without_payload,
put_abstract_with_payload
} from '../../k6/utils/abstract.js';
import { signup, login } from '../../k6/AuthManagement/auth.js';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
 
const PASSWORD = "123123123";
 
export let options = {
    vus: 3,
    iterations: 12,
};
 
 
export default function () {
const user = signup();
const token = login(user.email, PASSWORD);
 
const fn = post_abstract_with_payload({
  url: `https://dev-itona.xyz:443/api/device`,
  token: token,
  tag: "fn",
  job: "fn",
    payload: {"label": "Room 234 Sensor", "name": randomString(5), "type": "Temperature Sensor"}
});
console.log('🧪 fn response:', JSON.stringify(fn.data));
 
const fs = get_abstract_without_payload({
  url: `https://dev-itona.xyz:443/api/device/{deviceId}/credentials`,
  token: token,
  tag: "fs",
  job: "fs"
});
console.log('🧪 fs response:', JSON.stringify(fs.data));
 
}