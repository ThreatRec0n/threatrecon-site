// modes/flow/FlowEngine.js
// Stateful manager for Flow game mode.

export default class FlowEngine {
  constructor({ scenarioJson, difficulty = 'intermediate' }) {
    this.scenario = scenarioJson;
    this.difficulty = difficulty;
    this.packets = (scenarioJson.packets || []).map(p => ({ ...p }));
    this.roundStart = Date.now() / 1000;
    this.currentStage = 1;
    this.stageSequence = [
      { stage: 1, pickCount: 3, poolKey: 'stage1' },
      { stage: 2, pickCount: 5, poolKey: 'stage2' },
      { stage: 3, pickCount: 8, poolKey: 'stage3' },
      { stage: 4, pickCount: 10, poolKey: 'stage4' },
      { stage: 5, pickCount: 15, poolKey: 'stage5' },
      { stage: 6, pickCount: 20, poolKey: 'stageFinal' }
    ];
    this.inspected = new Set();
    this.selected = new Set();
    this.evidenceByIp = {};
    this.suspectMap = { ...(scenarioJson.ipMap || {}) };
    this.stageIndex = 0;
  }

  start() {
    this.stageIndex = 0;
    this.currentStage = this.stageSequence[this.stageIndex].stage;
    return {
      packets: this.packets,
      currentStage: this.currentStage,
      allowedPickCount: this.stageSequence[this.stageIndex].pickCount,
      seedNos: this._getPoolPacketNos(this.stageSequence[this.stageIndex].poolKey)
    };
  }

  _getPoolPacketNos(poolKey) {
    const seeds = (this.scenario.stageSeeds && this.scenario.stageSeeds[poolKey]) || [];
    return seeds.filter(n => this.packets.some(p => p.no === n));
  }

  inspectPacket(packetNo) {
    const pkt = this.packets.find(p => p.no === packetNo);
    if (!pkt) throw new Error('Packet not found ' + packetNo);
    this.inspected.add(packetNo);
    if (pkt.evidenceTags && pkt.evidenceTags.length) {
      const ip = pkt.src;
      if (!this.evidenceByIp[ip]) this.evidenceByIp[ip] = new Set();
      for (const t of pkt.evidenceTags) this.evidenceByIp[ip].add(t);
    }
    return { packet: pkt, revealedTags: pkt.evidenceTags || [] };
  }

  selectPacket(packetNo) {
    const poolKey = this.stageSequence[this.stageIndex].poolKey;
    const poolNos = this._getPoolPacketNos(poolKey);
    if (!poolNos.includes(packetNo)) {
      return { ok: false, reason: 'packet not in current stage pool' };
    }
    const allowed = this.stageSequence[this.stageIndex].pickCount;
    if (this.selected.size >= allowed && !this.selected.has(packetNo)) {
      return { ok: false, reason: 'max picks ' + allowed + ' reached' };
    }
    if (this.selected.has(packetNo)) {
      this.selected.delete(packetNo);
    } else {
      this.selected.add(packetNo);
    }
    return { ok: true, selected: Array.from(this.selected) };
  }

  advanceStage() {
    if (this.stageIndex < this.stageSequence.length - 1) {
      this.stageIndex += 1;
      this.currentStage = this.stageSequence[this.stageIndex].stage;
      this.selected.clear();
      return {
        ok: true,
        currentStage: this.currentStage,
        allowedPickCount: this.stageSequence[this.stageIndex].pickCount,
        poolNos: this._getPoolPacketNos(this.stageSequence[this.stageIndex].poolKey)
      };
    }
    return { ok: false, reason: 'Already final stage' };
  }

  finalGuess(assignments, perpetratorSuspectId) {
    const correctAssignments = [];
    const keys = Object.keys(this.scenario.ipMap || {});
    for (const sId of keys) {
      const correctIp = this.scenario.ipMap[sId];
      const playerIp = assignments[sId];
      correctAssignments.push({ suspect: sId, correct: playerIp === correctIp, correctIp, playerIp });
    }
    const correctCount = correctAssignments.filter(a => a.correct).length;
    const perpetratorCorrect = this.scenario.perpSuspectId === perpetratorSuspectId;
    const perpIp = (this.scenario.ipMap || {})[this.scenario.perpSuspectId];
    const perpEvidence = Array.from(this.evidenceByIp[perpIp] || []);
    const assignmentScore = Math.round((keys.length ? (correctCount / keys.length) : 0) * 50);
    const perpScore = perpetratorCorrect ? 40 : 0;
    const efficiencyBonus = Math.max(0, 10 - this.inspected.size);
    const total = assignmentScore + perpScore + efficiencyBonus;
    return {
      assignments: correctAssignments,
      perpetratorCorrect,
      perpEvidence,
      score: total,
      breakdown: { assignmentScore, perpScore, efficiencyBonus }
    };
  }
}


