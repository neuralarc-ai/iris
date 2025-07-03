// Test file for website analysis API
// This can be used to test the Exa API integration

export async function testWebsiteAnalysis() {
  try {
    const response = await fetch('/api/website-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        website: 'https://openai.com' // Test with a well-known website
      }),
    });

    const data = await response.json();
    console.log('Website analysis result:', data);
    return data;
  } catch (error) {
    console.error('Test failed:', error);
    return null;
  }
} 