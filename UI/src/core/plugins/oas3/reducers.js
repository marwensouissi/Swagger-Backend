import { fromJS, Map ,Set} from "immutable"

import {
  UPDATE_SELECTED_SERVER,
  UPDATE_REQUEST_BODY_VALUE,
  UPDATE_REQUEST_BODY_INCLUSION,
  UPDATE_ACTIVE_EXAMPLES_MEMBER,
  UPDATE_REQUEST_CONTENT_TYPE,
  UPDATE_SERVER_VARIABLE_VALUE,
  UPDATE_RESPONSE_CONTENT_TYPE,
  SET_REQUEST_BODY_VALIDATE_ERROR,
  CLEAR_REQUEST_BODY_VALIDATE_ERROR,
  CLEAR_REQUEST_BODY_VALUE,
  UPDATE_REQUEST_BODY_VALUE_RETAIN_FLAG,
  REMOVE_API_ENTRY,
  SET_REQUEST_FUNCTION_PARAMS,
  SET_REQUEST_FUNCTION_NAME,
} from "./actions"

const shouldSkipIfMissingRequestData = (state, path, method, actionName) => {
  if(method=="post"){
    const skipActions = new Set([
      UPDATE_REQUEST_BODY_VALUE,
      UPDATE_REQUEST_CONTENT_TYPE,
      SET_REQUEST_BODY_VALIDATE_ERROR,
      CLEAR_REQUEST_BODY_VALIDATE_ERROR,
      UPDATE_REQUEST_BODY_VALUE_RETAIN_FLAG,
      UPDATE_REQUEST_BODY_INCLUSION
    ])
    if (skipActions.has(actionName) && !state.hasIn(["requestData", path, method])) {
      console.warn(`Skipped ${actionName} — requestData[${path}][${method}] does not exist`)
      return true
    }
  }
 
  return false
}

export default {
  [UPDATE_SELECTED_SERVER]: (state, { payload: { selectedServerUrl, namespace } }) => {
    const path = namespace ? [namespace, "selectedServer"] : ["selectedServer"]
    return state.setIn(path, selectedServerUrl)
  },
  [SET_REQUEST_FUNCTION_PARAMS]: (state, { payload: { pathMethod, params } }) => {
    if (!Array.isArray(pathMethod) || pathMethod.length !== 2) {
      console.error("Invalid pathMethod", pathMethod)
      return state
    }
  
    const [path, method] = pathMethod
    const existingParams = state.getIn(["requestData", path, method, "params"], Map())
  
    return state.setIn(
      ["requestData", path, method, "params"],
      existingParams.merge(fromJS(params))
    )
  },
  [UPDATE_REQUEST_BODY_VALUE]: (state, { payload: { value, pathMethod } }) => {
    let [path, method] = pathMethod
    const removedKey = `${path}|${method}`
  
    // ⛔️ Skip if this was removed intentionally
    const removedApis = state.get("removedApis", Set())
    if (removedApis.has(removedKey)) {
      console.log("API was removed intentionally, not recreating:", path, method)
      return state
    }
  
    console.log('Updating request body for', path, method)
  
    if (!Map.isMap(value)) {
      return state.setIn(["requestData", path, method, "bodyValue"], value)
    }
  
    let currentVal = state.getIn(["requestData", path, method, "bodyValue"]) || Map()
    if (!Map.isMap(currentVal)) {
      currentVal = Map()
    }
  
    let newVal = currentVal
    const [...valueKeys] = value.keys()
    valueKeys.forEach((valueKey) => {
      let valueKeyVal = value.getIn([valueKey])
      newVal = newVal.setIn([valueKey, "value"], valueKeyVal)
    })
  
    return state
      .setIn(["requestData", path, method, "bodyValue"], newVal)
      .updateIn(["removedApis"], Set(), set => set.delete(removedKey)) // clean up if re-added
  },
  [SET_REQUEST_FUNCTION_NAME]: (state, { payload: { pathMethod, functionName } }) => {
    const [path, method] = pathMethod
    return state.setIn(["requestData", path, method, "functionName"], functionName)
  },
  [UPDATE_REQUEST_BODY_VALUE_RETAIN_FLAG]: (state, { payload: { value, pathMethod } }) => {
    let [path, method] = pathMethod
    if (shouldSkipIfMissingRequestData(state, path, method, UPDATE_REQUEST_BODY_VALUE_RETAIN_FLAG)) return state
    return state.setIn(["requestData", path, method, "retainBodyValue"], value)
  },

  [UPDATE_REQUEST_BODY_INCLUSION]: (state, { payload: { value, pathMethod, name } }) => {
    let [path, method] = pathMethod
    if (shouldSkipIfMissingRequestData(state, path, method, UPDATE_REQUEST_BODY_INCLUSION)) return state
    return state.setIn(["requestData", path, method, "bodyInclusion", name], value)
  },

  [UPDATE_ACTIVE_EXAMPLES_MEMBER]: (state, { payload: { name, pathMethod, contextType, contextName } }) => {
    let [path, method] = pathMethod
    return state.setIn(["examples", path, method, contextType, contextName, "activeExample"], name)
  },

  [UPDATE_REQUEST_CONTENT_TYPE]: (state, { payload: { value, pathMethod } }) => {
    let [path, method] = pathMethod
    if (shouldSkipIfMissingRequestData(state, path, method, UPDATE_REQUEST_CONTENT_TYPE)) return state
    return state.setIn(["requestData", path, method, "requestContentType"], value)
  },

  [UPDATE_RESPONSE_CONTENT_TYPE]: (state, { payload: { value, path, method } }) => {
    return state.setIn(["requestData", path, method, "responseContentType"], value)
  },

  [UPDATE_SERVER_VARIABLE_VALUE]: (state, { payload: { server, namespace, key, val } }) => {
    const path = namespace ? [namespace, "serverVariableValues", server, key] : ["serverVariableValues", server, key]
    return state.setIn(path, val)
  },

  [SET_REQUEST_BODY_VALIDATE_ERROR]: (state, { payload: { path, method, validationErrors } }) => {
    if (shouldSkipIfMissingRequestData(state, path, method, SET_REQUEST_BODY_VALIDATE_ERROR)) return state

    let errors = ["Required field is not provided"]

    if (validationErrors.missingBodyValue) {
      return state.setIn(["requestData", path, method, "errors"], fromJS(errors))
    }

    if (validationErrors.missingRequiredKeys && validationErrors.missingRequiredKeys.length > 0) {
      const { missingRequiredKeys } = validationErrors
      return state.updateIn(["requestData", path, method, "bodyValue"], fromJS({}), missingKeyValues => {
        return missingRequiredKeys.reduce((bodyValue, currentMissingKey) => {
          return bodyValue.setIn([currentMissingKey, "errors"], fromJS(errors))
        }, missingKeyValues)
      })
    }

    console.warn("unexpected result: SET_REQUEST_BODY_VALIDATE_ERROR")
    return state
  },

  [CLEAR_REQUEST_BODY_VALIDATE_ERROR]: (state, { payload: { path, method } }) => {
    if (shouldSkipIfMissingRequestData(state, path, method, CLEAR_REQUEST_BODY_VALIDATE_ERROR)) return state

    const requestBodyValue = state.getIn(["requestData", path, method, "bodyValue"])
    if (!Map.isMap(requestBodyValue)) {
      return state.setIn(["requestData", path, method, "errors"], fromJS([]))
    }

    const [...valueKeys] = requestBodyValue.keys()
    if (!valueKeys.length) {
      return state
    }

    return state.updateIn(["requestData", path, method, "bodyValue"], fromJS({}), bodyValues => {
      return valueKeys.reduce((bodyValue, curr) => {
        return bodyValue.setIn([curr, "errors"], fromJS([]))
      }, bodyValues)
    })
  },

  [CLEAR_REQUEST_BODY_VALUE]: (state, { payload: { pathMethod } }) => {
    let [path, method] = pathMethod
    const requestBodyValue = state.getIn(["requestData", path, method, "bodyValue"])
    if (!requestBodyValue) return state

    if (!Map.isMap(requestBodyValue)) {
      return state.setIn(["requestData", path, method, "bodyValue"], "")
    }

    return state.setIn(["requestData", path, method, "bodyValue"], Map())
  },

  [REMOVE_API_ENTRY]: (state, { payload: { path, method } }) => {
    console.log('Before removal:', state.getIn(["requestData", path, method]))
    if (!state.hasIn(["requestData", path, method])) {
      console.log('Entry does not exist:', path, method)
      return state
    }
  
    const newState = state.deleteIn(["requestData", path, method])
        .updateIn(["removedApis"], Set(), set => set.add(`${path}|${method}`))
  
    console.log('After removal:', newState.getIn(["requestData", path, method]))
  
    const remainingMethods = newState.getIn(["requestData", path])
    if (!remainingMethods || remainingMethods.isEmpty()) {
      console.log('No remaining methods, deleting path')
      return newState.deleteIn(["requestData", path])
    }
  
    return newState
  }
  
}
