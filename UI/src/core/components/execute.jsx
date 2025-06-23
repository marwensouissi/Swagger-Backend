import React, { Component } from "react";
import PropTypes from "prop-types";
import YAML from "js-yaml"; // Make sure to install this via `yarn add js-yaml` or `npm install js-yaml`

export default class Execute extends Component {
  static propTypes = {
    specSelectors: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    operation: PropTypes.object.isRequired,
    path: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    onExecute: PropTypes.func,
    disabled: PropTypes.bool,
  };

  state = {
    functionName: "", // 👈 local state to store function name
  };

  handleValidateParameters = () => {
    let { specSelectors, specActions, path, method } = this.props;
    specActions.validateParams([path, method]);
    return specSelectors.validateBeforeExecute([path, method]);
  };

  handleValidateRequestBody = () => {
    let { path, method, specSelectors, oas3Selectors, oas3Actions } = this.props;
    let validationErrors = {
      missingBodyValue: false,
      missingRequiredKeys: [],
    };

    oas3Actions.clearRequestBodyValidateError({ path, method });

    let oas3RequiredRequestBodyContentType = specSelectors.getOAS3RequiredRequestBodyContentType([path, method]);
    let oas3RequestBodyValue = oas3Selectors.requestBodyValue(path, method);
    let oas3ValidateBeforeExecuteSuccess = oas3Selectors.validateBeforeExecute([path, method]);
    let oas3RequestContentType = oas3Selectors.requestContentType(path, method);

    if (!oas3ValidateBeforeExecuteSuccess) {
      validationErrors.missingBodyValue = true;
      oas3Actions.setRequestBodyValidateError({ path, method, validationErrors });
      return false;
    }

    if (!oas3RequiredRequestBodyContentType) return true;

    let missingRequiredKeys = oas3Selectors.validateShallowRequired({
      oas3RequiredRequestBodyContentType,
      oas3RequestContentType,
      oas3RequestBodyValue,
    });

    if (!missingRequiredKeys || missingRequiredKeys.length < 1) return true;

    missingRequiredKeys.forEach((missingKey) => {
      validationErrors.missingRequiredKeys.push(missingKey);
    });

    oas3Actions.setRequestBodyValidateError({ path, method, validationErrors });
    return false;
  };

  handleValidationResultPass = () => {
    const { path, method, specSelectors, specActions } = this.props;
    const { functionName } = this.state;

    let spec = specSelectors.specJson().toJS();

    if (!spec.paths?.[path]?.[method]) return;

    // Add `x-function-name`
    spec.paths[path][method]["x-function-name"] = functionName;

    // Convert to YAML
    const updatedYaml = YAML.dump(spec);

    // Dispatch updated spec
    specActions.updateSpec(updatedYaml);

    if (this.props.onExecute) {
      this.props.onExecute();
    }
  };

  handleValidationResultFail = () => {
    let { specActions, path, method } = this.props;
    specActions.clearValidateParams([path, method]);
    setTimeout(() => {
      specActions.validateParams([path, method]);
    }, 40);
  };

  handleValidationResult = (isPass) => {
    if (isPass) {
      this.handleValidationResultPass();
    } else {
      this.handleValidationResultFail();
    }
  };

  onClick = () => {
    const { path, method, oas3Actions } = this.props;
    const { functionName } = this.state;
  
    // Validate request
    const paramsResult = this.handleValidateParameters();
    const requestBodyResult = this.handleValidateRequestBody();
    const isPass = paramsResult && requestBodyResult;
  
    // Store the function name in Redux under request data
    oas3Actions.setRequestFunctionName({ path, method, functionName });
  
    //this.handleValidationResult(isPass);
  };
    render() {
    const { disabled } = this.props;
    const { functionName } = this.state;

    return (
      <>
        <div className="functionNameContainer">
          <h4 style={{textAlign:"left"}}>Function name</h4>
          <input
            value={functionName}
            onChange={(event) => this.setState({ functionName: event.target.value })}
            className="inputFunction"
          />
        </div>
        <button
          className="btn execute opblock-control__btn"
          onClick={this.onClick}
          disabled={disabled}
        >
          Add API
        </button>
      </>
    );
  }
}
