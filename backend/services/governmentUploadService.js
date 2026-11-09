// Government PDF Upload Service for RoadBump
// Integrates with government platforms (API Setu, CPGRAMS, municipal APIs) for automatic PDF submission

const https = require('https');
const http = require('http');

/**
 * Upload PDF buffer to government API endpoint
 * @param {Buffer} pdfBuffer - The PDF file as a Buffer
 * @param {Object} metadata - Report metadata to send alongside PDF
 * @param {Object} config - Government API configuration
 * @returns {Promise<Object>} Result object with success status and data/error
 */
function uploadPDFToGovernment(pdfBuffer, metadata, config) {
  return new Promise((resolve, reject) => {
    // Check if upload is enabled
    if (!config.enabled || !config.apiUrl || !config.apiKey) {
      resolve({ success: false, reason: 'Government upload not configured or disabled' });
      return;
    }

    // Parse the URL
    let url;
    try {
      url = new URL(config.apiUrl);
    } catch (e) {
      resolve({ success: false, error: `Invalid government API URL: ${config.apiUrl}` });
      return;
    }

    // Prepare form data (multipart/form-data)
    const boundary = `----WebKitFormBoundary${Date.now()}`;
    const payloadParts = [];

    // Add PDF file part
    payloadParts.push(`--${boundary}`);
    payloadParts.push(`Content-Disposition: form-data; name="report"; filename="RoadBump-Report-${metadata.pinId || 'unknown'}.pdf"`);
    payloadParts.push('Content-Type: application/pdf');
    payloadParts.push('');
    payloadParts.push(pdfBuffer.toString('binary')); // Note: For large files, better to stream
    payloadParts.push(`--${boundary}`);

    // Add metadata part
    payloadParts.push(`Content-Disposition: form-data; name="metadata"`);
    payloadParts.push('Content-Type: application/json');
    payloadParts.push('');
    payloadParts.push(JSON.stringify(metadata));
    payloadParts.push(`--${boundary}--`);

    const payload = payloadParts.join('\r\n');

    // Prepare request options
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${config.apiKey}`,
        // Optional: Add other headers as required by specific government APIs
        // 'X-API-Key': config.apiKey, // Alternative auth method
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    // Choose http or https module based on protocol
    const client = url.protocol === 'https:' ? https : http;

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: parsedData });
          } else {
            resolve({ success: false, error: `Government API returned status ${res.statusCode}`, details: parsedData });
          }
        } catch (e) {
          // If response is not JSON
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: data });
          } else {
            resolve({ success: false, error: `Government API returned status ${res.statusCode}`, details: data });
          }
        }
      });
    });

    req.on('error', (err) => {
      reject({ success: false, error: `Request failed: ${err.message}` });
    });

    // Write payload and end request
    req.write(payload);
    req.end();
  });
}

module.exports = { uploadPDFToGovernment };