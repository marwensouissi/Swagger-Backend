import json
from typing import IO
from io import BytesIO

def reduce_swagger_to_required_only(file_obj: IO[bytes]) -> bytes:
    data = json.load(file_obj)

    schemas = (
        data.get("components", {}).get("schemas")
        or data.get("definitions")
    )

    if not isinstance(schemas, dict):
        raise ValueError("No valid schemas found in Swagger JSON.")

    for schema in schemas.values():
        if schema.get("type") != "object":
            continue

        required_fields = schema.get("required", [])
        properties = schema.get("properties", {})

        filtered_props = {k: v for k, v in properties.items() if k in required_fields}
        schema["properties"] = filtered_props

    return json.dumps(data, indent=2).encode("utf-8")
