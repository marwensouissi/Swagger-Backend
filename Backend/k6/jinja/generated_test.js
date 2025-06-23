
import {
    get_abstract_with_payload,
    get_abstract_without_payload,
    post_abstract_with_payload,
    patch_abstract_with_payload,
    delete_abstract_without_payload,
    put_abstract_with_payload
} from '../utils/abstract.js';
import { signup, login } from '../AuthManagement/auth.js';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';


const PASSWORD = "123123123";

export let options = {
    stages: [

            { duration: '20s', target: 1 },

            { duration: '20s', target: 1 }

    ]
};
export default function () {
    const user = signup();
    const token = login(user.email, PASSWORD);



    const create_device = post_abstract_with_payload({
        url: `https://dev-itona.xyz/api/device?accessToken=${token}`,
        token: token,
        tag: "create_device",
        job: "create_device",
    payload: {"name": randomString(15), "type": randomString(15)}
    });



    delete_abstract_without_payload({
        url: `https://dev-itona.xyz/api/device/${create_device.data.id.id}?accessToken=${token}`,
        token: token,
        tag: "delete_device",
        job: "delete_device"
    });


}