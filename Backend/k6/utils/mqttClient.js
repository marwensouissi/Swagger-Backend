// utils/mqttClient.js
import mqtt from 'k6/x/mqtt';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const broker = "mqtt://dev-itona.xyz";
const port = "1883";
const password = "YourPasswordIfRequired";

export function connectMQTT(credentialsId) {
    const clientId = `k6-client-${Math.random().toString(16).substr(2, 8)}`;
    const client = new mqtt.Client(
        [`${broker}:${port}`],
        credentialsId,
        password,
        false,
        clientId,
        5000,
        "",
        "",
        "",
        {
            sentBytesLabel: "mqtt_sent_bytes",
            receivedBytesLabel: "mqtt_received_bytes",
            sentMessagesCountLabel: "mqtt_sent_messages_count",
            receivedMessagesCountLabel: "mqtt_received_messages_count",
        },
        false,
        "TLS 1.2"
    );

    client.connect();
    return client;
}

export function sendTelemetry(client, credentialsId) {
    const deviceTopic = "v1/devices/me/telemetry";

    const payload = JSON.stringify({
        device_id: credentialsId,
        temperature: (Math.random() * 50).toFixed(2),
        humidity: (Math.random() * 100).toFixed(2),
        timestamp: new Date().toISOString(),
    });

    client.publish(deviceTopic, 1, payload, true, 5000);
}
