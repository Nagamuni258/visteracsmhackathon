# Automatic Municipal PDF Upload Implementation

## Current State
The RoadBump system currently generates PDF municipal reports on-demand via `/api/pins/:id/report` endpoint, but requires manual user action to share/send the PDF to municipal authorities. There is no automatic upload to municipal corporation APIs.

## Proposed Implementation
To enable automatic PDF upload to municipal corporation systems, we need to add:

### 1. Backend Modifications (`backend/index.js`)

#### Add Environment Variables
```javascript
// In .env file:
MUNICIPAL_API_URL=https://ghmc.telangana.gov.in/api/roadbump/reports
MUNICIPAL_API_KEY=your_api_key_here
MUNICIPAL_AUTO_UPLOAD_ENABLED=true
```

#### Add PDF Upload Service
```javascript
// Add after other service initializations
const uploadToMunicipalAPI = async (pdfBuffer, pinId, metadata) => {
  if (!process.env.MUNICIPAL_API_URL || !process.env.MUNICIPAL_API_AUTO_UPLOAD_ENABLED === 'true') {
    return { success: false, reason: 'Municipal upload not configured or disabled' };
  }

  try {
    const formData = new FormData();
    formData.append('report', pdfBuffer, `RoadBump-Report-${pinId}.pdf`);
    formData.append('pinId', pinId);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await fetch(process.env.MUNICIPAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MUNICIPAL_API_KEY}`,
        // Note: FormData will set correct boundary automatically
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Municipal API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Failed to upload PDF to municipal API:', error);
    return { success: false, error: error.message };
  }
};
```

#### Modify Report Generation Endpoint
Update the `/api/pins/:id/report` endpoint to optionally auto-upload:

```javascript
// GET /api/pins/:id/report - Generate formatted municipal PDF report
app.get('/api/pins/:id/report', async (req, res) => {
  try {
    // ... [existing pin retrieval logic] ...

    const doc = new PDFDocument({ margin: 50 });
    let pdfBuffers = [];
    
    // Capture PDF chunks instead of piping directly to res
    doc.on('data', chunk => pdfBuffers.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(pdfBuffers);
      
      // Set headers for direct download (maintains existing functionality)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=RoadBump-Report-${pin.id}.pdf`);
      
      // Pipe PDF to user (existing behavior)
      doc.pipe(res);
      doc.end();

      // Optional: Auto-upload to municipal API (non-blocking)
      if (process.env.MUNICIPAL_API_AUTO_UPLOAD_ENABLED === 'true') {
        try {
          const uploadResult = await uploadToMunicipalAPI(
            pdfBuffer, 
            pin.id, 
            {
              timestamp: pin.createdAt,
              location: { latitude: pin.latitude, longitude: pin.longitude },
              hazardType: pin.type,
              severity: pin.severity,
              reportCount: pin.reportCount,
              reporterId: pin.reporterId
            }
          );
          
          if (uploadResult.success) {
            console.log(`✅ Auto-uploaded PDF for pin ${pin.id} to municipal API`);
          } else {
            console.warn(`⚠️ Failed to auto-upload PDF for pin ${pin.id}:`, uploadResult.reason || uploadResult.error);
          }
        } catch (uploadError) {
          console.error('❌ Error in municipal PDF upload process:', uploadError);
          // Don't fail the user request if upload fails
        }
      }
    });

    // ... [existing PDF content generation logic] ...
  } catch (error) {
    // ... [existing error handling] ...
  }
});
```

### 2. Frontend Modifications (Optional Enhancement)

#### Add Configuration Toggle
In `freellmapi/client/src/settings-dialog.tsx` or similar, add:
```typescript
// Municipal auto-upload toggle
<FormControlLabel
  control={
    <Switch
      checked={municipalAutoUpload}
      onChange={e => setMunicipalAutoUpload(e.target.checked)}
      color="primary"
    />
  }
  label="Auto-submit reports to municipal corporation"
/>
```

#### Update Settings Persistence
When saving settings, include:
```typescript
localStorage.setItem('roadbump_municipal_auto_upload', municipalAutoUpload.toString());
```

#### Modify Report Generation Flow
In the report generation code (likely in `ReportScreen.jsx` or similar), after generating PDF blob:
```typescript
// After generating PDF blob:
if (municipalAutoUpload) {
  try {
    const formData = new FormData();
    formData.append('report', pdfBlob, `RoadBump-Report-${pinId}.pdf`);
    formData.append('pinId', pinId);
    
    const response = await fetch(
      `${getApiBase()}/pins/${pinId}/report/municipal`, 
      {
        method: 'POST',
        body: formData,
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('roadbump_municipal_api_key') || ''}`
        }
      }
    );
    
    if (response.ok) {
      toast.success('Report auto-submitted to municipal corporation');
    } else {
      toast.error('Failed to auto-submit report to municipal corporation');
    }
  } catch (error) {
    toast.error('Error auto-submitting report: ' + error.message);
  }
}

// Then proceed with normal share options
```

### 3. Municipal API Endpoint Expectations
The municipal corporation would need to provide an endpoint that accepts:
- **Method**: POST
- **URL**: `/api/roadbump/reports` (or similar)
- **Headers**: 
  - `Authorization: Bearer <api_key>`
  - `Content-Type: multipart/form-data`
- **Body**: 
  - `report`: PDF file (with filename like `RoadBump-Report-<pinId>.pdf`)
  - `pinId`: String identifier
  - `metadata`: JSON string containing hazard details

Expected response:
```json
{
  "success": true,
  "message": "Report received and processed",
  "reportId": "GHMC-2026-10-09-00123",
  "estimatedResponseTime": "24-48 hours"
}
```

### 4. Security Considerations
- API keys should be stored securely (not in client-side code)
- Use HTTPS for all municipal API communications
- Implement rate limiting to prevent abuse
- Validate PDF file type and size on municipal server
- Consider digital signatures for report authenticity

### 5. Implementation Timeline
1. **Backend**: Add upload service and modify report endpoint (2-4 hours)
2. **Frontend**: Add settings toggle and optional auto-upload flow (4-6 hours)
3. **Testing**: Verify with mock municipal API endpoint (2-3 hours)
4. **Documentation**: Update user manual and admin guide (1-2 hours)

### 6. Alternative Approach: Webhook Instead of Direct PDF Upload
Some municipalities may prefer to receive structured data rather than PDF. Alternative implementation:
- Send JSON report data via POST to municipal webhook endpoint
- Municipal system generates its own PDF or stores in database
- Reduces bandwidth and simplifies municipal processing

This would require:
```javascript
// Instead of uploading PDF, send JSON data
await fetch(process.env.MUNICIPAL_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.MUNICIPAL_API_KEY}`
  },
  body: JSON.stringify({
    pinId: pin.id,
    timestamp: pin.createdAt,
    location: { latitude: pin.latitude, longitude: pin.longitude },
    hazardType: pin.type,
    severity: pin.severity,
    severityLevel: pin.severityLevel,
    reportCount: pin.reportCount,
    reporterId: pin.reporterId,
    photoUrl: pin.photoUrl,
    address: pin.address
  })
});
```

## Recommendation
For maximum compatibility with existing municipal systems, implement **both** options:
1. **PDF upload** (for municipalities that want the formatted report)
2. **JSON webhook** (for municipalities with automated processing systems)

Let the user choose which method to use in settings, or support both simultaneously.

## Current Workaround
Until municipal auto-upload is implemented, users can:
1. Generate PDF report via long-press on verified pin → "Generate Complaint"
2. Use "Share" option to send via email to municipal GHMC address
3. Use WhatsApp/Telegram to forward PDF to municipal hotline numbers
4. Use the CSV export feature (`/api/export/csv`) to send bulk reports periodically

## Verification
To test this feature once implemented:
1. Set `MUNICIPAL_API_AUTO_UPLOAD_ENABLED=true` in `.env`
2. Provide mock municipal API endpoint (use webhook.site or similar)
3. Generate a report via `/api/pins/:id/report`
4. Verify the mock endpoint receives the PDF file with correct metadata
5. Confirm user still receives the downloadable PDF (functionality unchanged)

This implementation maintains backward compatibility while adding the requested automatic municipal upload capability.