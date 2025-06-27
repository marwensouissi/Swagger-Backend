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
    stages: [
        {
            duration: "30s",
            target: 1
        }    ],
};
 
 
export default function () {
const user = signup();
const token = login(user.email, PASSWORD);
 
const j = post_abstract_with_payload({
  url: `https://dev-itona.xyz:443/api`,
  token: token,
  tag: "j",
  job: "j",
    payload: {"acknowledged": true, "cleared": false, "name": "High Temperature Alarm", "severity": "CRITICAL", "type": "High Temperature Alarm"}
});
console.log('🧪 j response:', JSON.stringify(j.data));
 
}