// In your main initialization file (likely index.js or similar)
window.onload = function() {
  window.SwaggerUIBundle = window['swagger-ui-bundle']
  window.SwaggerUIStandalonePreset = window['swagger-ui-standalone-preset']
  
  // Store all specs and UI instances
  window.specRegistry = {
    currentUI: null,
    specs: {},
    containers: {}
  }

  // Function to load or switch specs
  window.loadSwaggerSpec = function(specKey, specUrl) {
    // Destroy previous instance if exists
    if (window.specRegistry.containers[specKey]) {
      window.specRegistry.containers[specKey].unmount()
    }
    
    // Create new instance
    const ui = SwaggerUIBundle({
      url: specUrl,
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      layout: "StandaloneLayout"
    })
    
    // Store reference
    window.specRegistry.currentUI = ui
    window.specRegistry.containers[specKey] = ui
    window.specRegistry.specs[specKey] = specUrl
    
    return ui
  }

  // Load default spec
  window.loadSwaggerSpec('default', './swagger.json')
}