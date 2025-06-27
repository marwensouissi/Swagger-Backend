/**
 * @prettier
 */
import React from "react"
import PropTypes from "prop-types"
import ListSelectedApis from "../list-selected-apis"
import { Warning } from "postcss"

export default class BaseLayout extends React.Component {
  static propTypes = {
    errSelectors: PropTypes.object.isRequired,
    errActions: PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
  }

  render() {
    const { errSelectors, specSelectors, getComponent } = this.props

    const SvgAssets = getComponent("SvgAssets")
    const InfoContainer = getComponent("InfoContainer", true)
    const VersionPragmaFilter = getComponent("VersionPragmaFilter")
    const Operations = getComponent("operations", true)
    const Models = getComponent("Models", true)
    const Webhooks = getComponent("Webhooks", true)
    const Row = getComponent("Row")
    const Col = getComponent("Col")
    const Errors = getComponent("errors", true)

    const ServersContainer = getComponent("ServersContainer", true)
    const SchemesContainer = getComponent("SchemesContainer", true)
    const AuthorizeBtnContainer = getComponent("AuthorizeBtnContainer", true)
    const FilterContainer = getComponent("FilterContainer", true)
    const isSwagger2 = specSelectors.isSwagger2()
    const isOAS3 = specSelectors.isOAS3()
    const isOAS31 = specSelectors.isOAS31()

    const isSpecEmpty = !specSelectors.specStr()

    const loadingStatus = specSelectors.loadingStatus()

    let loadingMessage = null

    if (loadingStatus === "loading") {
      loadingMessage = (
        <div className="info">
          <div className="loading-container">
            <div className="loading"></div>
          </div>
        </div>
      )
    }

    if (loadingStatus === "failed") {
      loadingMessage = (
        <div className="info">
          <div className="loading-container">
            <h4 className="title">Please upload a Swagger JSON file to continue.
</h4>
          </div>
        </div>
      )
    }

    if (loadingStatus === "failedConfig") {
      const lastErr = errSelectors.lastError()
      const lastErrMsg = lastErr ? lastErr.get("message") : ""
      loadingMessage = (
        <div className="info failed-config">
          <div className="loading-container">
            <h4 className="title">Failed to load remote configuration.</h4>
            <p>{lastErrMsg}</p>
          </div>
        </div>
      )
    }

    if (!loadingMessage && isSpecEmpty) {
      loadingMessage = <h4>No API definition provided.</h4>
    }

    if (loadingMessage) {
      return (
        <div className="swagger-ui">
          <div className="loading-container">{loadingMessage}</div>
        </div>
      )
    }

    const servers = specSelectors.servers()
    const schemes = specSelectors.schemes()

    const hasServers = servers && servers.size
    const hasSchemes = schemes && schemes.size
    const hasSecurityDefinitions = !!specSelectors.securityDefinitions()

    const swaggerFilename = specSelectors.url()?.split('/').pop() || null;

    return (
      <div className="swagger-ui">
        <SvgAssets />
        <VersionPragmaFilter
          isSwagger2={isSwagger2}
          isOAS3={isOAS3}
          alsoShow={<Errors />}
        >
          <Errors />
          {/*         <Row className="information-container">
            <Col mobile={12}>
              <InfoContainer />
            </Col>
          </Row> */}

      

          <FilterContainer />

          <Row>
            <Col
              mobile={12}
              desktop={12}
              style={{
                height: "calc(100vh - 100px)",
                overflowY: "auto",
                paddingInlineEnd: '16px',  
              }}
            >
              <Operations />
            </Col>

            <ListSelectedApis swaggerFilename={swaggerFilename} />
          </Row>

          {isOAS31 && (
            <Row className="webhooks-container">
              <Col mobile={12} desktop={12}>
                <Webhooks />
              </Col>
            </Row>
          )}

          {/*  <Row>
            <Col mobile={12} desktop={12}>
              <Models />
            </Col>
          </Row> */}
        </VersionPragmaFilter>
      </div>
    )
  }
}
