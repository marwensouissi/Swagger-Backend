import http from 'k6/http';
import { check } from 'k6';

// Utility function to handle API requests
function handleRequest(method, metadata, body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (metadata.token) {
        headers['Authorization'] = `Bearer ${metadata.token}`;
    }
    console.log("headers : ", headers);

    const params = {
        headers: headers,
        tags: {
            name: metadata.tag,
            job: metadata.job,
        },
    };
    console.log("params : ", params);


    let response;
    if (method === 'del') {
        response = http.request('DELETE', metadata.url, null, params);  
    } else {
        response = body ? http[method](metadata.url, JSON.stringify(body), params) : http[method](metadata.url, params);
    }


    // Validate response status
    const success = check(response, {
        [`${metadata.job} - status ${metadata.status || 200}`]: (r) => r.status === (metadata.status || 200),
    });

    if (!success) {
        return { success: false, status: response.status, error: response.body };
    }

    // Handle empty or non-JSON responses
    try {
        if (method === 'del' && response.status === 200 && !response.body) {
            return { success: true, data: null };  // DELETE success with no body
        }
        return { success: true, data: response.json() };
    } catch (error) {
        return { success: true, status: response.status, data: response.body };  // Return raw body if JSON parsing fails
    }
}

// GET request with payload (includes query parameters or authentication)
export function get_abstract_with_payload(metadata) {
    return handleRequest('get', metadata);
}

// GET request without payload (simple GET request)
export function get_abstract_without_payload(metadata) {
    return handleRequest('get', metadata);
}

// POST request with payload
export function post_abstract_with_payload(metadata) {
    return handleRequest('post', metadata, metadata.payload);
}

// PATCH request with payload
export function patch_abstract_with_payload(metadata) {
    return handleRequest('patch', metadata, metadata.payload);
}

// DELETE request without payload
export function delete_abstract_without_payload(metadata) {
    return handleRequest('del', metadata);
}

export function put_abstract_with_payload(metadata) {
    return handleRequest('put', metadata);
}
