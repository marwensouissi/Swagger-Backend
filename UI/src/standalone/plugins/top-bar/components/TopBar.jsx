import React, { cloneElement, useState } from "react"
import PropTypes from "prop-types"
import {parseSearch, serializeSearch} from "core/utils"
import Upload from "core/components/Upload"
import { color } from "framer-motion"

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
      customSpecs: [] // Store uploaded specs here
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
    }))
    // Optionally load the new spec immediately
    this.loadSpec(newSpec.url)}

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

 setSelectedUrl = (selectedUrl) => {
  const configs = this.props.getConfigs()
  const urls = configs.urls || []
  const allSpecs = [...urls, ...this.state.customSpecs]

  if (allSpecs && allSpecs.length) {
    allSpecs.forEach((spec, i) => {
      if (spec.url === selectedUrl) {
        this.setState({ selectedIndex: i })
        this.setSearch(spec)
      }
    })
  }
}

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


  const allSpecs = [...(urls || []), ...this.state.customSpecs]

    if (allSpecs.length) {
  const options = allSpecs.map((link, i) => (
    <option
      key={i}
      value={link.url}
      style={{ color: "#000", backgroundColor: "#fff" }} // Black text, white background
    >
     {link.name || link.url}

    </option>
  ))

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
      )
  }

  const servers = specSelectors.servers()
  const schemes = specSelectors.schemes()
  const hasServers = servers && servers.size
  const Col = getComponent("Col")
  const hasSchemes = schemes && schemes.size
  const hasSecurityDefinitions = !!specSelectors.securityDefinitions()
  const AuthorizeBtnContainer = getComponent("AuthorizeBtnContainer", true)

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
