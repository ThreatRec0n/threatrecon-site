// ThreatRecon Labs - After Action Report Generator
// Builds comprehensive AAR from match timeline and outcomes

class AARGenerator {
  generateAAR(match) {
    const duration = match.endedAt 
      ? Math.round((new Date(match.endedAt) - new Date(match.startedAt)) / 60000)
      : Math.round((Date.now() - new Date(match.startedAt)) / 60000);
    
    const playerEvents = match.timeline.filter(e => e.type === 'player_action');
    const aiEvents = match.timeline.filter(e => e.type === 'ai_action');
    
    const winner = match.winner === 'player' ? 'Player Victory' : 'AI Victory';
    const outcome = match.playerRole === 'attacker' 
      ? (match.winner === 'player' ? 'Attacker Successfully Breached System' : 'Defense Stopped Intrusion')
      : (match.winner === 'player' ? 'Defense Successfully Contained Threat' : 'Attacker Compromised System');
    
    return {
      matchId: match.id,
      playerRole: match.playerRole,
      duration: duration,
      winner,
      outcome,
      startedAt: match.startedAt,
      endedAt: match.endedAt || new Date().toISOString(),
      timeline: match.timeline,
      statistics: {
        totalEvents: match.timeline.length,
        playerActions: playerEvents.length,
        aiActions: aiEvents.length,
        detectionLevel: match.playerState.detectionLevel,
        dataExfiltrated: match.playerState.dataStolen.length,
        evidenceCollected: match.aiState.evidenceCollected.length,
        hostsCompromised: match.playerState.foothold.length,
        ipsBlocked: match.aiState.blockList.length,
      },
      keyFindings: this.generateFindings(match),
      recommendations: this.generateRecommendations(match),
    };
  }

  generateFindings(match) {
    const findings = [];
    
    if (match.playerRole === 'attacker') {
      if (match.playerState.dataStolen.length > 0) {
        findings.push('Successfully exfiltrated sensitive data files from multiple hosts');
      }
      if (match.playerState.detectionLevel > 50) {
        findings.push('High detection level - excessive noise from aggressive scanning triggered defensive response');
      }
      if (match.aiState.containmentActive) {
        findings.push('Containment detected - firewall rules activated by defender');
      }
      if (match.playerState.foothold.length > 1) {
        findings.push('Successfully performed lateral movement across multiple systems');
      }
    } else {
      if (match.aiState.evidenceCollected.length > 0) {
        findings.push('Forensic evidence collected with proper chain of custody and cryptographic hashing');
      }
      if (match.aiState.containmentActive) {
        findings.push('Successfully contained threat through firewall rule implementation and host isolation');
      }
      if (match.playerState.detectionLevel < 20) {
        findings.push('Attacker remained below detection threshold for significant duration');
      }
      if (match.aiState.evidenceCollected.length >= 3) {
        findings.push('Comprehensive evidence collection across multiple compromised systems');
      }
    }
    
    return findings;
  }

  generateRecommendations(match) {
    const recommendations = [];
    
    if (match.playerRole === 'attacker') {
      if (match.playerState.detectionLevel < 30) {
        recommendations.push('Stealth maintained - well-executed low-profile approach');
      }
      recommendations.push('Consider establishing additional persistence mechanisms');
      recommendations.push('Review lateral movement techniques used');
    } else {
      if (match.aiState.evidenceCollected.length < 2) {
        recommendations.push('Collect more forensic evidence for investigation');
      }
      recommendations.push('Implement automated alerting on suspicious activity');
      recommendations.push('Deploy additional network segmentation controls');
    }
    
    return recommendations;
  }
}

const aarGenerator = new AARGenerator();
module.exports = aarGenerator;

