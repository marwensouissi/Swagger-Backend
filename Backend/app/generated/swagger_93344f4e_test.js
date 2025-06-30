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
            duration: "20s",
            target: 3
        }    ],
};
 
 
export default function () {
const user = signup();
const token = login(user.email, PASSWORD);
 
const r = post_abstract_with_payload({
  url: `https://dev-itona.xyz:443/api/device`,
  token: token,
  tag: "r",
  job: "r",
    payload: {"label": "Room 234 Sensor", "name": randomString(17), "type": "Temperature Sensor"}
});
console.log('🧪 r response:', JSON.stringify(r.data));
 
const fz = get_abstract_without_payload({
  url: `https://dev-itona.xyz:443/api/device/${r.data.id.id}/credentials`,
  token: token,
  tag: "fz",
  job: "fz"
});
console.log('🧪 fz response:', JSON.stringify(fz.data));
 
}