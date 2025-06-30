import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeApiEntry } from '../plugins/oas3/actions';
import LaunchTestModal from './LaunchTestModal';
import ChooseExecutionOption from './ChooseExecutionOption';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const ListSelectedApis = ({ swaggerFilename }) => {
    console.log("[ListSelectedApis] swaggerFilename:", swaggerFilename); // Debug

  const dispatch = useDispatch();
  const [isModalOpen, setModalOpen] = useState(false);
  const [generatedFilename, setGeneratedFilename] = useState(null);
  const [showLaunchModal, setShowLaunchModal] = useState(true);
  const [showExecutionOptions, setShowExecutionOptions] = useState(false);
  const [showMQTTExecutionOptions, setShowMQTTExecutionOptions] = useState(false); // New state for MQTT
  const [activeTab, setActiveTab] = useState('HTTP');

  const handleBackToLaunchModal = () => {
    setShowExecutionOptions(false);
    setShowLaunchModal(true);
  };

  const handleMQTTExecution = async () => {
    if (!mqttApis.length) {
      alert("No MQTT API selected.");
      return;
    }
  
    const { functionName, params, bodyValue } = mqttApis[0];
  
    // Remove all '-path' suffixes from params keys
    const cleanedParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (key.endsWith('-path')) {
        cleanedParams[key.replace('-path', '')] = value;
      } else {
        cleanedParams[key] = value;
      }
    });
  
    // Validate credentials in bodyValue
    let parsedCredentials = [];
    try {
      const parsedBody = JSON.parse(bodyValue || '{}');
      if (Array.isArray(parsedBody.credentials)) {
        parsedCredentials = parsedBody.credentials;
      } else {
        alert("Invalid credentials format. Expected: { credentials: [ ... ] }");
        return;
      }
    } catch (err) {
      alert("Failed to parse credentials from body. Make sure it's a valid JSON.");
      return;
    }
  
    // Build the payload with actual user-provided credentials
    const payload = {
      credentials: parsedCredentials,
      parameters: [
        {
          function: functionName,
          method: "MQTT",
          save_as: functionName,
          ...cleanedParams,
        }
      ]
    };
  
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('http://localhost:6060/mqtt/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      console.log("MQTT payload:", payload);
  
      const result = await response.json();
      setGeneratedFilename(result.filename);
      setModalOpen(false);
      setShowMQTTExecutionOptions(true); // Show MQTT execution options
    } catch (error) {
      console.error('Error generating MQTT test:', error);
    }
  };
  

const apiData = useSelector((state) => {
    const requestData = state.getIn(['oas3', 'requestData']);
    if (!requestData) return [];

    const jsData = requestData.toJS();
    const results = [];

    for (const [apiPath, methods] of Object.entries(jsData)) {
      for (const [method, methodData] of Object.entries(methods)) {
        results.push({
          api: apiPath,
          method: method.toUpperCase(),
          bodyValue: methodData.bodyValue || null,
          functionName: methodData.functionName || '',
          params: methodData.params || {},
        });
      }
    }

    return results;
  });

  // Split apiData into HTTP and MQTT
  const httpApis = apiData.filter(item => HTTP_METHODS.includes(item.method));
  const mqttApis = apiData.filter(item => item.method === 'MQTT');

  const handleRemove = (api, method) => {
    dispatch(removeApiEntry(api, method.toLowerCase()));
  };

const handleLaunchTest = async (stages) => {
  // Filter only HTTP APIs
  const httpTestCases = apiData
  .filter(({ method, functionName }) => HTTP_METHODS.includes(method) && !!functionName)
  .map(({ api, method, bodyValue, functionName, params }) => {
    let url = api.replace(/\{\?.*?\}/, ''); // remove optional query template
    const queryParams = [];

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (key.endsWith('-path')) {
          const paramName = key.replace('-path', '');
          url = url.replace(`{${paramName}}`, value);
        } else if (key.endsWith('-query')) {
          const paramName = key.replace('-query', '');
          queryParams.push(`${encodeURIComponent(paramName)}=${encodeURIComponent(value)}`);
        }
      });

      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
    }

    const testCase = {
      function: functionName,
      method,
      url,
      save_as: functionName,
    };

      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && bodyValue) {
        try {
          testCase.payload = JSON.parse(bodyValue);
        } catch (e) {
          console.error('Invalid JSON body:', bodyValue);
          testCase.payload = {};
        }
      }

      return testCase;
    });

  // Combine stages with test cases
  const payload = {
    swagger_filename: swaggerFilename,
    stages: stages,
    test_cases: httpTestCases, // Only HTTP APIs are included
  };

  console.log("Complete payload:", payload);

  try {
    const token = sessionStorage.getItem('authToken');
    const response = await fetch('http://localhost:6060/generate/from-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setGeneratedFilename(result.filename);
    setShowExecutionOptions(true);
    setModalOpen(false);
  } catch (error) {
    console.error('Error launching test:', error);
  }
};

  const getMethodColor = (method) => {
    switch (method.toLowerCase()) {
      case 'get': return '#28a745';
      case 'post': return '#0366d6';
      case 'put': return '#6f42c1';
      case 'mqtt': return '#897e06';
      case 'delete': return '#d73a49';
      case 'patch': return '#ff9a3c';
      default: return '#6a737d';
    }
  };

  return (
    <div style={{
      height: '85vh',
      width: '100%',
      maxWidth: '500px',
      border: '1px solid #e1e4e8',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #eaecef',
        backgroundColor: '#f6f8fa'
      }}>
        <h2 style={{
          margin: '-8px',
          fontSize: '18px',
          fontWeight: 600,
          color: '#24292e'
        }}>API List</h2>
      </div>
      <div style={{ display: 'flex' }}>
        <button
          style={{
            flex: 1,
            padding: '8px 0',
            background: activeTab === 'HTTP' ? '#f6f8fa' : '#f6f8fa',
            color: activeTab === 'HTTP' ? '#24292e' : '#24292e',
            border: 'none',
            borderBottom: activeTab === 'HTTP' ? '2px solid #2ea44f' : '2px solid #eaecef',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('HTTP')}
        >
          HTTP
        </button>
        <button
          style={{
            flex: 1,
            padding: '8px 0',
            background: activeTab === 'MQTT' ? '#f6f8fa' : '#f6f8fa',
            color: activeTab === 'MQTT' ? '#24292e' : '#24292e',
            border: 'none',
            borderBottom: activeTab === 'MQTT' ? '2px solid #2ea44f' : '2px solid #eaecef',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('MQTT')}
        >
          MQTT
        </button>
      </div>

      <LaunchTestModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onLaunch={handleLaunchTest} // Just pass the function directly
        swaggerFilename={swaggerFilename} // Add this line

      />
        {showMQTTExecutionOptions && (
  <ChooseExecutionOption
    filename={generatedFilename}
    onBack={() => setShowMQTTExecutionOptions(false)} // Close MQTT modal and go back
    onClose={() => setShowMQTTExecutionOptions(false)}
  />
)}


      {showExecutionOptions ? (
        <ChooseExecutionOption
          filename={generatedFilename}
          onBack={handleBackToLaunchModal}
          onClose={() => setShowExecutionOptions(false)}
        />
      ) : (
        <>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: '#fafbfc'
          }}>
            {/* Render list based on activeTab */}
            {activeTab === 'HTTP' ? (
              !httpApis.some(item => item.functionName) ? (
                <p style={{
                  textAlign: 'center',
                  color: '#586069',
                  padding: '20px',
                  fontSize: '14px'
                }}>No HTTP APIs selected.</p>
              ) : (
                <ul style={{
                  paddingLeft: 0,
                  margin: 0,
                  listStyle: 'none'
                }}>
                  {httpApis.map(({ api, method, bodyValue, functionName, params }, index) => {
                    if (!functionName) return null;

                    let displayApi = api.replace(/\{\?.*?\}/, '');
                    let queryParams = [];

                    if (params) {
                      Object.entries(params).forEach(([key, value]) => {
                        if (key.endsWith('-path')) {
                          const paramName = key.replace('-path', '');
                          displayApi = displayApi.replace(`{${paramName}}`, value);
                        } else if (key.endsWith('-query')) {
                          const paramName = key.replace('-query', '');
                          queryParams.push(`${encodeURIComponent(paramName)}=${encodeURIComponent(value)}`);
                        }
                      });

                      if (queryParams.length > 0) {
                        displayApi;
                      }
                    }

                    return (
                      <li key={index} style={{
                        marginBottom: '16px',
                        padding: '16px',
                        border: '1px solid #e1e4e8',
                        borderRadius: '8px',
                        background: '#ffffff',
                        transition: 'box-shadow 0.2s ease'
                      }}>
                        <div style={{
                          display: 'flex',
                          marginBottom: '8px',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{
                            fontWeight: 600,
                            color: '#24292e',
                            minWidth: '110px',
                            fontSize: '13px'
                          }}>Function Name:</span>
                          <span style={{
                            color: '#0366d6',
                            flex: 1,
                            fontSize: '13px',
                            wordBreak: 'break-word',
                            fontWeight: 500
                          }}>{functionName}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          marginBottom: '8px',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{
                            fontWeight: 600,
                            color: '#24292e',
                            minWidth: '110px',
                            fontSize: '13px'
                          }}>API:</span>
                          <span style={{
                            color: '#6a737d',
                            flex: 1,
                            fontSize: '13px',
                            wordBreak: 'break-word'
                          }}>{displayApi}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          marginBottom: '8px',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{
                            fontWeight: 600,
                            color: '#24292e',
                            minWidth: '110px',
                            fontSize: '13px'
                          }}>Method:</span>
                          <span style={{
                            color: getMethodColor(method),
                            flex: 1,
                            fontSize: '13px',
                            fontWeight: 500
                          }}>{method}</span>
                        </div>
                        {bodyValue && (
                          <div style={{ marginTop: '12px' }}>
                            <div style={{
                              fontWeight: 600,
                              color: '#24292e',
                              fontSize: '13px'
                            }}>Body:</div>
                            <pre style={{
                              background: '#f6f8fa',
                              padding: '12px',
                              borderRadius: '6px',
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: '12px',
                              lineHeight: 1.5,
                              marginTop: '8px',
                              color: 'rgb(46, 164, 79)',
                              border: '1px solid #e1e4e8',
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}>
                              {JSON.stringify(JSON.parse(bodyValue), null, 2)}
                            </pre>
                          </div>
                        )}
                        <button
                          style={{
                            marginTop: '12px',
                            padding: '6px 12px',
                            backgroundColor: '#fafbfc',
                            color: '#d73a49',
                            border: '1px solid #d73a49',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleRemove(api, method)}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#d73a49';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#fafbfc';
                            e.target.style.color = '#d73a49';
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    );

                    
                  })}

                    <button
              style={{
                padding: '7px 11px',
                backgroundColor: '#2ea44f',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                position: 'absolute',
                top: '607px',
                right: '208px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => setModalOpen(true)}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2c974b';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2ea44f';
              }}
              onMouseDown={(e) => {
                e.target.style.backgroundColor = '#298e46';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseUp={(e) => {
                e.target.style.backgroundColor = '#2c974b';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              Add APIs to Test
            </button>
                </ul>
              )
            ) : (
              !mqttApis.some(item => item.functionName) ? (
                <p style={{
                  textAlign: 'center',
                  color: '#586069',
                  padding: '20px',
                  fontSize: '14px'
                }}>No MQTT APIs selected.</p>
              ) : (
                <ul style={{
                  paddingLeft: 0,
                  margin: 0,
                  listStyle: 'none'
                }}>
                  {mqttApis.map(({ api, method, bodyValue, functionName, params }, index) => {
                    if (!functionName) return null;

                    let displayApi = api.replace(/\{\?.*?\}/, '');
                    let queryParams = [];

                    if (params) {
                      Object.entries(params).forEach(([key, value]) => {
                        if (key.endsWith('-path')) {
                          const paramName = key.replace('-path', '');
                          displayApi = displayApi.replace(`{${paramName}}`, value);
                        } else if (key.endsWith('-query')) {
                          const paramName = key.replace('-query', '');
                          queryParams.push(`${encodeURIComponent(paramName)}=${encodeURIComponent(value)}`);
                        }
                      });

                      if (queryParams.length > 0) {
                        displayApi;
                      }
                    }

                    return (
                      <li key={index} style={{
                        marginBottom: '16px',
                        padding: '16px',
                        border: '1px solid #e1e4e8',
                        borderRadius: '8px',
                        background: '#ffffff',
                        transition: 'box-shadow 0.2s ease'
                      }}>
                        <div style={{
                          display: 'flex',
                          marginBottom: '8px',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{
                            fontWeight: 600,
                            color: '#24292e',
                            minWidth: '110px',
                            fontSize: '13px'
                          }}>Function Name:</span>
                          <span style={{
                            color: '#897e06',
                            flex: 1,
                            fontSize: '13px',
                            wordBreak: 'break-word',
                            fontWeight: 500
                          }}>{functionName}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          marginBottom: '8px',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{
                            fontWeight: 600,
                            color: '#24292e',
                            minWidth: '110px',
                            fontSize: '13px'
                          }}>API:</span>
                          <span style={{
                            color: '#6a737d',
                            flex: 1,
                            fontSize: '13px',
                            wordBreak: 'break-word'
                          }}>{displayApi}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          marginBottom: '8px',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{
                            fontWeight: 600,
                            color: '#24292e',
                            minWidth: '110px',
                            fontSize: '13px'
                          }}>Method:</span>
                          <span style={{
                            color: getMethodColor(method),
                            flex: 1,
                            fontSize: '13px',
                            fontWeight: 500
                          }}>{method}</span>
                        </div>
                        {bodyValue && (
                          <div style={{ marginTop: '12px' }}>
                            <div style={{
                              fontWeight: 600,
                              color: '#24292e',
                              fontSize: '13px'
                            }}>Body:</div>
                            <pre style={{
                              background: '#f6f8fa',
                              padding: '12px',
                              borderRadius: '6px',
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: '12px',
                              lineHeight: 1.5,
                              marginTop: '8px',
                              color: 'rgb(137, 126, 6)',
                              border: '1px solid #e1e4e8',
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}>
                              {JSON.stringify(JSON.parse(bodyValue), null, 2)}
                            </pre>
                          </div>
                        )}
                        <button
                          style={{
                            marginTop: '12px',
                            padding: '6px 12px',
                            backgroundColor: '#fafbfc',
                            color: '#d73a49',
                            border: '1px solid #d73a49',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleRemove(api, method)}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#d73a49';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#fafbfc';
                            e.target.style.color = '#d73a49';
                          }}
                        >
                          Remove
                        </button>

                        
                      </li>
                    );
                  })}
                    <button
              style={{
                padding: '7px 11px',
                backgroundColor: '#897e06',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                position: 'absolute',
                top: '607px',
                right: '208px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2c974b';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2ea44f';
              }}
              onMouseDown={(e) => {
                e.target.style.backgroundColor = '#298e46';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseUp={(e) => {
                e.target.style.backgroundColor = '#2c974b';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
                      onClick={handleMQTTExecution} // Opens ChooseExecutionOption for MQTT

            >
              Add MQTT
            </button>
                </ul>
              )
            )}
          </div>

          <div style={{
            padding: '12px',
            borderTop: '1px solid #eaecef',
            textAlign: 'center',
            backgroundColor: '#f6f8fa'
          }}>
          
          </div>
        </>
      )}
    </div>
  );
};

export default ListSelectedApis;