import React, { cloneElement, useState } from "react"
import PropTypes from "prop-types"
import {parseSearch, serializeSearch} from "core/utils"
import Upload from "core/components/Upload"
import { color } from "framer-motion"
import ListSelectedApis from "../../../../core/components/list-selected-apis"; // Corrected path to match the actual file structure

class TopBar extends React.Component {

  static propTypes = {
    layoutActions: PropTypes.object.isRequired,
    authActions: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired
  }

   constructor(props, context) {
    super(props, context)
    this.state = { 
      url: props.specSelectors.url(), 
      selectedIndex: 0,
      showUploadModal: false,
      customSpecs: [], // Store uploaded specs here
      uploadedSpecs: [], // <-- add this
      hasMqtt: false, // Track MQTT injection status
      isCheckingMqtt: false, // Loading state for MQTT check
      isInjectingMqtt: false // Loading state for MQTT injection
    }
    
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ url: nextProps.specSelectors.url() })
  }

  onUrlChange =(e)=> {
    let {target: {value}} = e
    this.setState({url: value})
  }

  toggleUploadModal = () => {
    this.setState(prev => ({ showUploadModal: !prev.showUploadModal }))
  }

handleUploadSuccess = (newSpec) => {
  this.setState(prev => ({
    customSpecs: [...prev.customSpecs, newSpec],
    showUploadModal: false
  }));
  this.fetchUploadedSpecs();
  // Optionally load the new spec immediately
  this.loadSpec(newSpec.url);
}

checkMqttStatus = async () => {
  const filename = this.getCurrentSwaggerFilename();
  if (!filename) {
    console.log('[checkMqttStatus] No filename found');
    return;
  }

  this.setState({ isCheckingMqtt: true });
  try {
    console.log(`[checkMqttStatus] Checking MQTT for: ${filename}`);
    const response = await fetch(`http://localhost:6060/mqtt/check-mqtt?filename=${encodeURIComponent(filename)}`);
    if (response.ok) {
      const data = await response.json();
      console.log('[checkMqttStatus] API response:', data);
      this.setState({ hasMqtt: data.injected });
    } else {
      console.error('[checkMqttStatus] API error:', response.status);
      this.setState({ hasMqtt: false });
    }
  } catch (error) {
    console.error('[checkMqttStatus] Exception:', error);
    this.setState({ hasMqtt: false });
  } finally {
    this.setState({ isCheckingMqtt: false });
  }
}

injectMqtt = async () => {
  const filename = this.getCurrentSwaggerFilename();
  console.log('[injectMqtt] Current filename:', filename); // Debug log
  if (!filename) {
    console.log('[injectMqtt] No filename found', filename);
    alert('No Swagger file selected');
    return;
  }

  this.setState({ isInjectingMqtt: true });
  try {
    console.log(`[injectMqtt] Injecting MQTT for: ${filename}`);
    const response = await fetch(`http://localhost:6060/mqtt/inject-mqtt?filename=${encodeURIComponent(filename)}`, {
      method: 'POST'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[injectMqtt] API response:', data);
      alert(data.message || 'MQTT injected successfully!');
      this.setState({ hasMqtt: true });

      // Force Swagger UI to reload the file with a cache-busting query
      const currentUrl = this.props.specSelectors.url();
      const cacheBustedUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      console.log('[injectMqtt] Reloading spec with URL:', cacheBustedUrl);
      this.props.specActions.updateUrl(cacheBustedUrl);
      this.props.specActions.download(cacheBustedUrl);
    } else {
      const errorData = await response.json();
      console.error('[injectMqtt] API error:', errorData);
      alert(`Error: ${errorData.detail || 'Failed to inject MQTT'}`);
    }
  } catch (error) {
    console.error('[injectMqtt] Exception:', error);
    alert('Error injecting MQTT. Please try again.');
  } finally {
    this.setState({ isInjectingMqtt: false });
  }
}

flushAuthData() {
    const { persistAuthorization } = this.props.getConfigs()
    if (persistAuthorization)
    {
      return
    }
    this.props.authActions.restoreAuthorization({
      authorized: {}
    })
  }


 async fetchUploadedSpecs() {
  try {
    const res = await fetch("http://localhost:6060/swagger/list-json");
    if (!res.ok) return;
    const data = await res.json();
    const files = data.files || [];

    // Fetch info.title for each file
    const uploadedSpecs = await Promise.all(
      files.map(async (file) => {
        try {
          const jsonRes = await fetch(`http://localhost:6060/swagger/json/${file}`);
          if (!jsonRes.ok) throw new Error();
          const json = await jsonRes.json();
          return {
            name: json.info?.title, // fallback to filename if no title
            filename: file,
            url: `http://localhost:6060/swagger/json/${file}`
          };
        } catch {
          return {
            name: file,
            url: `http://localhost:6060/swagger/json/${file}`,
            
          };
          
        }
        
      })
    );

    this.setState({ uploadedSpecs });
  } catch (err) {
    // handle error if needed
  }
}


  loadSpec = (url) => {
    this.flushAuthData()
    this.props.specActions.updateUrl(url)
    this.props.specActions.download(url)
  }

  onUrlSelect = (e) => {
  let url = e.target.value || e.target.href;
  
  // Check if this is a custom uploaded spec
  const isCustomSpec = this.state.customSpecs.some(spec => spec.url === url);
  
  if (isCustomSpec) {
    // For custom specs, we might need to handle them differently
    const spec = this.state.customSpecs.find(spec => spec.url === url);
    this.loadSpec(spec.url);
  } else {
    // Default behavior for original URLs
    this.loadSpec(url);
  }
  
  this.setSelectedUrl(url);
  e.preventDefault();
}

  downloadUrl = (e) => {
    this.loadSpec(this.state.url)
    e.preventDefault()
  }

  setSearch = (spec) => {
    let search = parseSearch()
    search["urls.primaryName"] = spec.name
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    if(window && window.history && window.history.pushState) {
      window.history.replaceState(null, "", `${newUrl}?${serializeSearch(search)}`)
    }
  }


getCurrentSwaggerFilename = () => {
  const currentUrl = this.props.specSelectors.url();
  console.log("Current URL in getCurrentSwaggerFilename:", currentUrl); // Debug log
  if (!currentUrl) return null;
  // Remove query string if present
  const cleanUrl = currentUrl.split('?')[0];
  return cleanUrl.split('/').pop();
};

 setSelectedUrl = (selectedUrl) => {
  const configs = this.props.getConfigs()
  const urls = configs.urls || []
const allSpecs = [
  ...(urls || []), 
  ...this.state.customSpecs, 
  ...this.state.uploadedSpecs
];

  if (allSpecs && allSpecs.length) {
    allSpecs.forEach((spec, i) => {
      if (spec.url === selectedUrl) {
        console.log(`Selected Swagger file: ${spec.filename}`); // Log the selected Swagger file name
        this.setState({ selectedIndex: i })
        this.setSearch(spec)
      }
    })
  }
}

// Update componentDidUpdate to better handle file changes
  componentDidUpdate(prevProps) {
    const currentUrl = this.props.specSelectors.url();
    const prevUrl = prevProps.specSelectors.url();
    
    if (currentUrl !== prevUrl) {
      const updatedFilename = this.getCurrentSwaggerFilename();
      console.log("Swagger file changed to:", updatedFilename);
      
      // Reset MQTT status when file changes
      this.setState({ hasMqtt: false });
      
      // Check MQTT status for the new file
      setTimeout(() => {
        this.checkMqttStatus();
      }, 500);
    }
  }

  // Update componentDidMount
  componentDidMount() {
    const configs = this.props.getConfigs()
    const urls = configs.urls || []

    if(urls && urls.length) {
      var targetIndex = this.state.selectedIndex
      let search = parseSearch()
      let primaryName = search["urls.primaryName"] || configs.urls.primaryName
      if(primaryName)
      {
        urls.forEach((spec, i) => {
          if(spec.name === primaryName)
            {
              this.setState({selectedIndex: i})
              targetIndex = i
            }
        })
      }

      this.loadSpec(urls[targetIndex].url)
    }
    
    this.fetchUploadedSpecs();
    
    // Check MQTT status on initial load with delay
    setTimeout(() => {
      this.checkMqttStatus();
    }, 2000);
  }


getCurrentSwaggerFilename() {
  const currentUrl = this.props.specSelectors.url();
  // Extract filename from URL (handles both local and remote files)
  const filename = currentUrl?.split('/').pop() || null;
  console.log("Current Swagger filename:", filename);
  return filename;
}



  onFilterChange =(e) => {
    let {target: {value}} = e
    this.props.layoutActions.updateFilter(value)
  }

  render() {

    
  let { getComponent, specSelectors, getConfigs } = this.props
      const Button = getComponent("Button", () => <button />)
    const Link = getComponent("Link", () => <a />)
    const Logo = getComponent("Logo", () => <span>Logo</span>)
    const ServersContainer = getComponent("ServersContainer", () => null)
    const Modal = getComponent("Modal", () => null) // Fallback if Modal doesn't exist
    const SchemesContainer = getComponent("SchemesContainer", () => null)


  let isLoading = specSelectors.loadingStatus() === "loading"
  let isFailed = specSelectors.loadingStatus() === "failed"



  const { urls } = getConfigs()
  let control = []


   const renderUploadModal = () => {
      if (Modal) {
        return (
          <Modal title="Upload API Specification" onClose={this.toggleUploadModal}>
            <Upload onSuccess={this.handleUploadSuccess} />
          </Modal>
        )
      }
      return this.state.showUploadModal && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <button onClick={this.toggleUploadModal} className="close-btn">x</button>
            <Upload onSuccess={this.handleUploadSuccess} />
          </div>
        </div>
      )
    }
        const swaggerFilename = this.getCurrentSwaggerFilename();

console.log("Passing swaggerFilename to ListSelectedApis:", swaggerFilename);
<ListSelectedApis 
  swaggerFilename={swaggerFilename} 
  onDebug={(payload) => console.log("Payload in ListSelectedApis:", payload)} 
/>

const allSpecs = [...(urls || []), ...this.state.customSpecs, ...this.state.uploadedSpecs];

if (allSpecs.length) {
  const options = allSpecs.map((link, i) => (
    <option
      key={i}
      value={link.url}
      style={{ color: "#000", backgroundColor: "#fff" }}
    >
      {link.name || link.url}
    </option>
  ));

  control.push(
    <label className="select-label" htmlFor="select">
      <span>Select a definition</span>
      <select
        id="select"
        disabled={isLoading}
        onChange={this.onUrlSelect}
        value={allSpecs[this.state.selectedIndex]?.url}
      >
        {options}
      </select>
    </label>
  );
}

  const servers = specSelectors.servers()
  const schemes = specSelectors.schemes()
  const hasServers = servers && servers.size
  const Col = getComponent("Col")
  const hasSchemes = schemes && schemes.size
  const hasSecurityDefinitions = !!specSelectors.securityDefinitions()
  const AuthorizeBtnContainer = getComponent("AuthorizeBtnContainer", true)

  // Show MQTT button only if current file doesn't have MQTT and we have a valid filename
  const showMqttButton = !this.state.hasMqtt && 
                          swaggerFilename && 
                          !this.state.isCheckingMqtt;

                   console.log('Render - showMqttButton:', showMqttButton, {
      hasMqtt: this.state.hasMqtt,
      swaggerFilename,
      isCheckingMqtt: this.state.isCheckingMqtt
    });        

  return (
          <div className="topbar">
        <div className="wrapper">
          <div className="topbar-wrapper">
            <Link>
              <Logo />
            </Link>
            <div className="controls-wrapper">
              <form className="download-url-wrapper">
                {control.map((el, i) => cloneElement(el, { key: i }))}
              </form>
              
              {/* Add Upload button next to the dropdown */}
              <Button 
                className="upload-btn"
                onClick={this.toggleUploadModal}
              >
                Upload JSON
              </Button>

              {/* Add MQTT Injection button - only show if MQTT not already injected */}
              {showMqttButton && (
                <Button 
                  className="mqtt-btn"
                  onClick={this.injectMqtt}
                  disabled={this.state.isInjectingMqtt}
                  style={{ 
                    marginLeft: '10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    cursor: this.state.isInjectingMqtt ? 'not-allowed' : 'pointer'

                  }}
                >
                  {this.state.isInjectingMqtt ? 'Injecting...' : 'Inject MQTT'}
                </Button>
              )}
            </div>

              { /* (hasServers || hasSchemes || hasSecurityDefinitions) && (
                <div className="scheme-container">
                  <Col className="schemes wrapper" mobile={12}>
                    <div className="schemes-server-container">
                      {hasServers && <ServersContainer />}
                      {hasSchemes && <SchemesContainer />}
                    </div>
                    {hasSecurityDefinitions && <AuthorizeBtnContainer />}
                  </Col>
                </div>
              ) */}
          </div>
        </div>

        {/* Upload Modal */}
      {renderUploadModal()}

      </div>
    )
  }
}


const styles = `
  .upload-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .upload-modal {
    border-radius: 4px;
    height: 40%;
    margin-bottom:15%;
    width: 60%;
  }

  .mqtt-btn {
    background-color: #4CAF50 !important;
    color: white !important;
    border: 1px solid #4CAF50 !important;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }

  .mqtt-btn:hover:not(:disabled) {
    background-color: #45a049 !important;
  }

  .mqtt-btn:disabled {
    background-color: #cccccc !important;
    cursor: not-allowed;
  }

  .controls-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement("style")
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}


TopBar.propTypes = {
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  getConfigs: PropTypes.func.isRequired
}

export default TopBar