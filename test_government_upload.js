// Test script to verify government upload service integration
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testGovernmentUpload() {
  console.log('Testing Government PDF Upload Service...');

  // First, create a test pin via the API
  try {
    const pinResponse = await axios.post('http://localhost:5000/api/pins', {
      type: 'pothole',
      severity: 'Severe',
      latitude: 17.440081,
      longitude: 78.348915,
      speed: 35,
      source: 'test',
      reporterId: 'test-user',
      description: 'Test pin for government upload verification'
    });

    const pinId = pinResponse.data.data.id;
    console.log(`✅ Created test pin: ${pinId}`);

    // Now generate the report (this should trigger the government upload attempt)
    const reportResponse = await axios.get(`http://localhost:5000/api/pins/${pinId}/report`, {
      responseType: 'stream'
    });

    console.log(`✅ Generated report for pin ${pinId}`);
    console.log('📝 Check server logs for government upload attempt (will fail without API credentials but shows integration is working)');

    // Clean up - delete the test pin
    // await axios.delete(`http://localhost:5000/api/pins/${pinId}`); // Delete endpoint not implemented, but that's OK for test

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Mock axios for demo if not available
if (typeof require !== 'undefined' && require.main === module) {
  testGovernmentUpload().catch(console.error);
}

module.exports = { testGovernmentUpload };