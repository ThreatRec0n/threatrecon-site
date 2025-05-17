// Example of how to use the rate limiter in your form submission API

// pages/api/submit-report.js
import { withRateLimit } from '../../utils/withRateLimit';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Process form submission
    const { name, email, reportType, description } = req.body;
    
    // Validate inputs (basic example)
    if (!name || !email || !reportType || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // In a real implementation, you would save to a database and/or send an email
    // For this example, we'll just return success
    
    return res.status(200).json({ 
      success: true, 
      message: 'Report submitted successfully' 
    });
    
  } catch (error) {
    console.error('Error submitting form:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while submitting your report' 
    });
  }
}

// Apply rate limiting middleware
export default withRateLimit(handler);
