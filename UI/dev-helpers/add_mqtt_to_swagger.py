import json
import sys
 
def add_mqtt_endpoint_with_path_params(swagger_json):
    mqtt_path = {
        "/run-mqtt-test/{device_count}/{token}/{VU_COUNT}/{duration}/{broker}/{port}/{topic}/{password}": {
            "post": {
                "tags": ["mqtt-controller"],
                "summary": "Run MQTT Load Test via Path Params",
                "description": "Runs MQTT load test using parameters passed directly in the URL path.",
                "operationId": "runMqttTestWithParams",
                "parameters": [
                    {
                        "name": "device_count",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"},
                        "description": "Number of devices to create and use for testing"
                    },
                    {
                        "name": "token",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "JWT token for ThingsBoard API access"
                    },
                    {
                        "name": "VU_COUNT",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"},
                        "description": "Number of Virtual Users for K6 test"
                    },
                    {
                        "name": "duration",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "Duration of the load test"
                    },
                    {
                        "name": "broker",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "MQTT broker address"
                    },
                    {
                        "name": "port",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "MQTT broker port"
                    },
                    {
                        "name": "topic",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "MQTT topic to publish to"
                    },
                    {
                        "name": "password",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "MQTT password (can be empty)"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Test started successfully"
                    },
                    "400": {
                        "description": "Invalid input"
                    }
                }
            }
        }
    }

    swagger_json.setdefault("paths", {}).update(mqtt_path)
    return swagger_json

 
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python add_mqtt_to_swagger.py input_swagger.json [output_swagger.json]")
        sys.exit(1)
 
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "swagger_with_mqtt.json"
 
    with open(input_path, "r", encoding="utf-8") as f:
        swagger = json.load(f)
 
    updated_swagger = add_mqtt_endpoint_with_path_params(swagger)
 
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(updated_swagger, f, indent=2)
        print(f"✅ MQTT endpoint added and saved to '{output_path}'")

 