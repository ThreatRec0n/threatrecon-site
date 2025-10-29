export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In a real app, this would query a database
  // For now, we'll return a mock response indicating the endpoint exists
  // The frontend will manage its own history via localStorage
  
  res.status(200).json({
    message: 'Event history is managed client-side via localStorage',
    endpoint: '/api/events/history',
  });
}

