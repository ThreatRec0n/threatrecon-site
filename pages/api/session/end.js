export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mock session end data with grade and summary
  const { sessionId, actions = [] } = req.body;

  const grade = calculateGrade(actions);
  const xpAwarded = calculateXP(grade);

  const sessionEndData = {
    grade: grade,
    xpAwarded: xpAwarded,
    summary: {
      incident: "RDP Brute Force with C2 Beacon",
      attacker: "185.12.33.4",
      actionsTaken: actions,
      containmentTime: Math.floor(Math.random() * 300) + 60, // 60-360 seconds
    },
    promoted: grade === 'A+' && Math.random() > 0.7,
    newRank: grade === 'A+' ? "Analyst" : "Trainee",
    timestamp: (await import('../../../lib/safe-time')).safeIso(Date.now())
  };

  res.status(200).json(sessionEndData);
}

function calculateGrade(actions) {
  if (!actions || actions.length === 0) return 'F';
  
  // Simple grading logic based on actions taken
  const actionCount = actions.length;
  if (actionCount >= 3) return 'A+';
  if (actionCount >= 2) return 'A';
  if (actionCount >= 1) return 'B';
  return 'C';
}

function calculateXP(grade) {
  const baseXP = {
    'A+': 500,
    'A': 400,
    'B': 300,
    'C': 200,
    'F': 100
  };
  return baseXP[grade] || 100;
}

