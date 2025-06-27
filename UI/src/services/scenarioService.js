const API_BASE_URL = 'http://localhost:6060/scenarios';

export async function createScenario(rawJson) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: rawJson
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create scenario');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating scenario:', error);
    throw error;
  }

}


