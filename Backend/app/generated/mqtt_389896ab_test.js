import { sleep } from 'k6';
import mqtt from 'k6/x/mqtt';
import { SharedArray } from 'k6/data';
import { check } from 'k6';

// Shared credentials list using SharedArray (inline, not file-based)
const credentialsData = new SharedArray('device_credentials', () => {
    return [
        { credentialsId: "WcW9z7al3bIetnG3fO4l" },        { credentialsId: "MTv5alTDDlJfjEoVsALM" },        { credentialsId: "SEYyYPX2825pZzAhE9rS" },        { credentialsId: "1FFG4Tb0QtdbV3j84Lzy" },        { credentialsId: "9bVX5UoiRHiPxCb0wmeN" },        { credentialsId: "qJOqSl5jiRA1Xe5UjXrV" },        { credentialsId: "RlkW2zc2bXzb8P59Xhqw" },        { credentialsId: "OTSSaqIOXiFJVIeGBYgs" },        { credentialsId: "bV32MdWD1A1qLGdf80Wd" },        { credentialsId: "wDyFj9fAI2rZUCz66VbN" },        { credentialsId: "AqLIQE4A8LFCuZHzj16r" },        { credentialsId: "JLJuKScR3hbge3YMYonY" },        { credentialsId: "jbOk59hXH4utD3gCrDVw" },        { credentialsId: "6JykFbUtSWkg6tgy5jKW" },        { credentialsId: "eoO1qmZKTPwoYGX191Gv" },        { credentialsId: "mpIZEHykaCfOgMMyuoAt" },        { credentialsId: "cVBkBN2rC7tbPUaiCoC1" },        { credentialsId: "igNZyeSKsYbfc3Tg4nTD" },        { credentialsId: "5CV8lUqwLTfdD5gTZ52J" },        { credentialsId: "LjC99fHyFaC9sq5TAAEs" },        { credentialsId: "pTQAVkvtXGbRansWKRx7" },        { credentialsId: "OHbYDQJ5JYvpIfVlU2mK" },        { credentialsId: "qpiQUhZZPHUvcyTD0KBc" },        { credentialsId: "RbnWFwrKxSBiqVaTWdJn" },        { credentialsId: "zv5qjBkATZypMLpLdiVd" },        { credentialsId: "Owf1pRIPZbfkTbpZCPuj" },        { credentialsId: "raRs0goaDirhj9TYAABh" },        { credentialsId: "vHSEz5LD0OwLpTvlhw4c" },        { credentialsId: "a7RWP14strejf3YBeJND" },        { credentialsId: "WrQWtNhUPa2F2PJzHrDF" },        { credentialsId: "mK5gXIF0MVxn8ZUkeep5" },        { credentialsId: "bCV3GXMMvwpn9iGEu8td" },        { credentialsId: "Jxt7nqNqWetEeLySfDmT" },        { credentialsId: "cUCLjecOCDtGul7D09te" },        { credentialsId: "bzVwXmd2CNRtEovwCsvh" },        { credentialsId: "GNylHrwntk7gC3NqIuVa" },        { credentialsId: "VEG3zmMxCZhJUKxYfgeH" },        { credentialsId: "meEN1bf4o9hbTp8SqMA3" },        { credentialsId: "v1mX1A3u9b2N2NhU0P87" },        { credentialsId: "f5Pa5i2wV3gz21xNDbAW" },        { credentialsId: "bR70t6iHdtgif2zNgDTA" },        { credentialsId: "KyEtB7CAhOm2Zpljvmi3" },        { credentialsId: "CBnOmkCjXTexmyGx9RSq" },        { credentialsId: "TOXWEz9Hpal7cSsGTV2F" },        { credentialsId: "2rWdPEnGSTCXSjmChjjD" },        { credentialsId: "SIh9ByReic1Ctam4eDdW" },        { credentialsId: "JbifXBhRiIZZQP1NSdXR" },        { credentialsId: "atE6lOKKuGb56VWbMlnd" },        { credentialsId: "wRUbvKGRlxuIxieBcxaS" },        { credentialsId: "3fHKEeAUabxLf0uc1dAd" },        { credentialsId: "xGl97l78ht9ZqqbQJuL9" },        { credentialsId: "fudCyn4bM7InVQvphthj" },        { credentialsId: "JaLadMHYwW5zi2zu4mwY" },        { credentialsId: "yqc8H7it6Bz9rKU38HKm" },        { credentialsId: "aYUlTXfTaOAPTcFrSTLM" },        { credentialsId: "RzyApKM9gUaNXJ6uPUca" },        { credentialsId: "3lqJsGhdZxVHWcLI8fnk" },        { credentialsId: "3jB09Kr9ZT9yEZcedGXS" },        { credentialsId: "Pz3dVoDKLyOzdUVTzWoS" },        { credentialsId: "OTLf0giqHXrMtF3yMOV8" },        { credentialsId: "Vvt4ZoLmZncNz0wb2tjO" },        { credentialsId: "pSQ0v7hsgJNJK81R8EjH" },        { credentialsId: "DrnjRVP85TFrPCkpevhx" },        { credentialsId: "bgMw9Rc78DxlqF1mP4sf" },        { credentialsId: "KlIjMzLqblbrQLnjuzRs" },        { credentialsId: "yu80y0Bx1xPDklZwPN2x" },        { credentialsId: "d7lIZMaMjcNB8cvgnGmK" },        { credentialsId: "vQZDl2khdC8lI7HvpPsT" },        { credentialsId: "Nmjra3njL0DslW2nbkpB" },        { credentialsId: "L3AmTFqEWe1i5pkQS9xr" }    ];
});

const VU_COUNT = 54;
const BUFFER_TIME = 5;

export const options = {
    vus: VU_COUNT,
    duration: '60s',
    preAllocatedVUs: VU_COUNT,
};

const broker = "mqtt://164.90.243.134";
const port = "8883";
const topic = "v1/devices/me/telemetry";
const password = "564";

const clients = new Array(VU_COUNT);

// Create clients using inline credentials from SharedArray
for (let i = 0; i < VU_COUNT; i++) {
    const { credentialsId } = credentialsData[i % credentialsData.length]; // Safe wrap
    const clientId = `k6-client-${i + 1}`;

    try {
        const client = new mqtt.Client(
            [`${broker}:${port}`],
            credentialsId,
            password,
            false,
            clientId,
            5000,
            "", "", "",
            {
                sentBytesLabel: "mqtt_sent_bytes",
                receivedBytesLabel: "mqtt_received_bytes",
                sentMessagesCountLabel: "mqtt_sent_messages_count",
                receivedMessagesCountLabel: "mqtt_received_messages_count",
            },
            false,
        );
        clients[i] = client;
        console.log(`✅ Client ${i + 1} connected with credentialsId ${ credentialsId }`);
    } catch (err) {
        console.error(`❌ Client ${i + 1} connection failed`, err);
    }
}

// Main test loop
export default function () {
    const vuId = __VU;
    const client = clients[(vuId - 1) % clients.length]; // Safe index

    if (!client) {
        console.error(`❌ No MQTT client for VU ${vuId}`);
        return;
    }

    client.connect();
    sleep(2);

    check(client, {
        "is publisher connected": publisher => publisher.isConnected()
    });

    for (let i = 0; i < 5; i++) {
        try {
            const payload = JSON.stringify({
                temperature: (Math.random() * 50).toFixed(2),
                humidity: (Math.random() * 100).toFixed(2),
                timestamp: new Date().toISOString()
            });
            client.publish(topic, 1, payload, false, 5000);
            console.log(`📡 VU ${vuId} published: ${payload}`);
        } catch (err) {
            console.error(`❌ VU ${vuId} publish failed`, err);
        }
        sleep(BUFFER_TIME);
    }
}

// Graceful shutdown
export function teardown() {
    console.log("🔌 Disconnecting MQTT clients...");
    for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        if (client) {
            try {
                client.close();
                console.log(`✅ Client ${i + 1} disconnected`);
            } catch (err) {
                console.error(`❌ Error disconnecting client ${i + 1}`, err);
            }
        }
    }
}