/**
 * Fake Google Sheets API Mock Server
 *
 * This simulates a Google Sheets webhook endpoint that receives RoadBump PDF reports.
 * It accepts the multipart/form-data upload that the backend sends when
 * GOOGLE_SHEETS_AUTO_UPLOAD_ENABLED=true.
 *
 * Useful for testing the auto-upload flow without a real Google Sheets account.
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

// In-memory storage for received reports
const receivedReports = [];
let webhookUrl = '';

const PORT = process.env.PORT || 3001;

// Store the webhook URL that was provided
function setWebhookUrl(urlStr) {
  webhookUrl = urlStr;
  console.log(`📝 Fake Google Sheets webhook URL set: ${urlStr}`);
}

// Helper to parse form data from multipart request
function parseMultipartFormData(request) {
  return new Promise((resolve, reject) => {
    let data = '';
    let boundary;

    request.on('data', chunk => {
      data += chunk;
    });

    request.on('end', () => {
      // Extract boundary from content-type header
      const contentType = request.headers['content-type'];
      if (!contentType || !contentType.includes('multipart')) {
        reject(new Error('No multipart form data'));
        return;
      }

      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      if (!boundaryMatch) {
        reject(new Error('No boundary found'));
        return;
      }

      boundary = '--' + boundaryMatch[1];

      // Split by boundary
      const parts = data.split(boundary).filter(part => part.trim());

      const result = {
        report: null,      // PDF buffer as base64
        metadata: null,    // JSON metadata
        filename: null
      };

      for (const part of parts) {
        // Each part starts with headers followed by \r\n and then the content
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headers = part.substring(0, headerEnd);
        const content = part.substring(headerEnd + 4);

        // Get the content-disposition to find the field name
        const cdMatch = headers.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/);
        if (!cdMatch) continue;

        const fieldName = cdMatch[1];
        const filename = cdMatch[2];

        // The actual content follows another \r\n after the headers
        const contentStart = headers.lastIndexOf('\r\n') + 2;
        const contentBody = content.trim();

        if (fieldName === 'report' && filename) {
          // This is the PDF file - decode from base64
          try {
            result.report = Buffer.from(contentBody, 'base64');
            result.filename = filename;
          } catch (e) {
            console.error('Failed to decode PDF base64:', e.message);
          }
        } else if (fieldName === 'metadata') {
          // This is the JSON metadata
          try {
            result.metadata = JSON.parse(contentBody);
          } catch (e) {
            console.error('Failed to parse metadata JSON:', e.message);
          }
        }
      }

      resolve(result);
    });

    request.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  // Allow CORS for local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed, use POST' }));
    return;
  }

  try {
    const parsed = await parseMultipartFormData(req);

    if (!parsed.report || !parsed.metadata) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing report or metadata in payload' }));
      return;
    }

    // Store the received report
    const reportEntry = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: new Date().toISOString(),
      filename: parsed.filename || 'RoadBump-Report.pdf',
      pinId: parsed.metadata.pinId || 'unknown',
      metadata: parsed.metadata,
      pdfSize: parsed.report ? parsed.report.length : 0
    };

    receivedReports.push(reportEntry);

    console.log(`📥 Received report: ${reportEntry.filename} for pin ${reportEntry.pinId}`);
    console.log(`📊 Total reports received: ${receivedReports.length}`);

    // Log some metadata
    console.log(`   - Pin ID: ${reportEntry.pinId}`);
    console.log(`   - Timestamp: ${reportEntry.metadata.timestamp}`);
    console.log(`   - Hazard Type: ${reportEntry.metadata.hazardType}`);
    console.log(`   - Severity: ${reportEntry.metadata.severity}`);

    // Respond success
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Report received and cached',
      reportId: reportEntry.id,
      totalReports: receivedReports.length
    }));

  } catch (err) {
    console.error('❌ Error parsing request:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}).listen(PORT, () => {
  console.log(`🚀 Fake Google Sheets API mock running on port ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/`);
  console.log(`📋 Use this URL in your backend .env as GOOGLE_SHEETS_WEBHOOK_URL`);
  console.log('');
  console.log('Test with:');
  console.log('  curl -X POST -H "Content-Type: multipart/form-data" -F "report=@report.pdf" -F "metadata={\\"pinId\\":\\"test123\\",\\"type\\":\\"pothole\\"}" http://localhost:3000/');
});