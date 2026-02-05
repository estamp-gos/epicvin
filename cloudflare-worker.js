/**
 * Cloudflare Worker to send form entries to email before Paddle checkout
 * 
 * This worker receives VIN/Plate form data and sends it via email
 * using Web3Forms (free email service - no configuration needed)
 * 
 * Setup Instructions:
 * 1. Go to Cloudflare Workers dashboard
 * 2. Create a new Worker
 * 3. Copy and paste this entire code
 * 4. Deploy the worker
 * 5. Get the worker URL (e.g., https://cold-hat-5fd3.rmoto7817.workers.dev/)
 * 6. Update index.html with your worker URL
 *
 * Web3Forms Access Key: 8a31cfe9-5cd5-4f84-8f73-3fe00c6753e2
 * Sends to: car.check.store@gmail.com
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Parse the request body
      const data = await request.json();
      
      // Extract form data
      const { vin, plate, state, vehicleType, searchType, timestamp } = data;

      // Validate that we have at least VIN or Plate
      if (!vin && !plate) {
        return new Response(JSON.stringify({ error: 'VIN or Plate required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Build email content
    const emailSubject = `EpicVIN Site – New ${searchType === 'vin' ? 'VIN' : 'Plate'} Request`;

      
    let emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f6f7fb;
      font-family: "Segoe UI", Roboto, Arial, sans-serif;
      color: #1f2937;
    }
    .wrapper {
      max-width: 620px;
      margin: 40px auto;
      padding: 0 15px;
    }
    .card {
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.07);
    }
    .top-bar {
      background-color: #2563eb;
      padding: 18px 24px;
      color: #ffffff;
    }
    .top-bar h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .sub {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 4px;
    }
    .content {
      padding: 26px 24px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 18px;
      color: #111827;
    }
    .row {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      padding: 10px 0;
    }
    .row:last-child {
      border-bottom: none;
    }
    .row-label {
      width: 40%;
      font-size: 13px;
      color: #6b7280;
    }
    .row-value {
      width: 60%;
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      word-break: break-all;
    }
    .footer {
      background-color: #f9fafb;
      padding: 18px 24px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="card">

      <div class="top-bar">
        <h1>Epicvin Site Entry</h1>
        <div class="sub">New submission received</div>
      </div>

      <div class="content">
        <div class="section-title">Vehicle Details</div>
`;

// VIN
if (vin) {
  emailBody += `
        <div class="row">
          <div class="row-label">VIN Number</div>
          <div class="row-value">${vin}</div>
        </div>
`;
}

// Plate
if (plate) {
  emailBody += `
        <div class="row">
          <div class="row-label">License Plate</div>
          <div class="row-value">${plate}</div>
        </div>
`;
}

// State
if (state) {
  emailBody += `
        <div class="row">
          <div class="row-label">State</div>
          <div class="row-value">${state}</div>
        </div>
`;
}

// Vehicle Type
if (vehicleType) {
  emailBody += `
        <div class="row">
          <div class="row-label">Vehicle Type</div>
          <div class="row-value">${vehicleType}</div>
        </div>
`;
}

// Search Type
emailBody += `
        <div class="row">
          <div class="row-label">Search Type</div>
          <div class="row-value">${searchType || 'N/A'}</div>
        </div>
`;

// Timestamp
if (timestamp) {
  emailBody += `
        <div class="row">
          <div class="row-label">Submitted At</div>
          <div class="row-value">${new Date(timestamp).toLocaleString()}</div>
        </div>
`;
}

emailBody += `
      </div>

      <div class="footer">
        This email was automatically generated from the <strong>EpicVIN Site</strong>.<br>
        Please do not reply to this message.
      </div>

    </div>
  </div>
</body>
</html>
`;



      // Send email using Web3Forms - Free, No configuration needed
      // Web3Forms is completely free and doesn't require any setup
      const formData = new FormData();
      formData.append('access_key', '8a31cfe9-5cd5-4f84-8f73-3fe00c6753e2');
      formData.append('subject', emailSubject);
      formData.append('from_name', 'EpicVIN Report');
      formData.append('to', 'car.check.store@gmail.com');
      formData.append('message', emailBody);
      
      const emailResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      // Check if email was sent successfully
      const result = await emailResponse.json();
      
      if (emailResponse.ok && result.success) {
        console.log('✅ Email sent successfully via Web3Forms to car.check.store@gmail.com');
        return new Response(JSON.stringify({ 
          success: true,
          emailSent: true,
          message: 'Email sent successfully to car.check.store@gmail.com'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        // Log detailed error
        console.error('❌ Web3Forms API error:', result.message || 'Unknown error');
        console.error('Response status:', emailResponse.status);
        console.error('Full response:', result);
        
        // Still return success to not block the checkout, but flag email failure
        return new Response(JSON.stringify({ 
          success: true,  // Don't block user
          emailSent: false,  // But indicate email failed
          message: 'Request processed but email failed',
          error: errorText
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

    } catch (error) {
      console.error('❌ Worker error:', error);
      console.error('Error details:', error.message);
      
      // Return success even on error to not block the user's checkout
      return new Response(JSON.stringify({ 
        success: true,
        emailSent: false,
        message: 'Request processed but encountered error',
        error: error.message
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
