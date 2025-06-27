const fs = require("fs");
const path = require("path");

const inputPath = path.resolve(__dirname, "swagger.json");
const outputPath = path.resolve(__dirname, "swagger.required-only.json");

const swagger = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const schemas = swagger.components?.schemas || swagger.definitions;

if (!schemas) {
  console.error("No components.schemas or definitions found in Swagger file.");
  process.exit(1);
}

// Helper: reduce schema properties to only `required` fields
function reduceToRequired(schema) {
  if (!schema || !schema.properties || !schema.required) return schema;

  const reducedProps = {};
  for (const key of schema.required) {
    if (schema.properties[key]) {
      reducedProps[key] = schema.properties[key];
    }
  }

  return {
    ...schema,
    properties: reducedProps,
  };
}

// Apply to all schemas
for (const [schemaName, schemaDef] of Object.entries(schemas)) {
  if (schemaDef.type === "object") {
    schemas[schemaName] = reduceToRequired(schemaDef);
  } else if (schemaDef.allOf || schemaDef.oneOf) {
    // Skip composed schemas for now
    console.warn(`Skipping composed schema: ${schemaName}`);
  }
}

// Save new Swagger with only required fields
fs.writeFileSync(outputPath, JSON.stringify(swagger, null, 2));
console.log(`✅ Stripped Swagger saved to: ${outputPath}`);
