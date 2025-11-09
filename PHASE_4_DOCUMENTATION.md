# Phase 4: Submission & Evaluation Engine - Complete Documentation

## Overview

Phase 4 transforms the platform from a passive investigation sandbox into a performance-measurable SOC simulation. Users can now investigate, tag IOCs, submit their findings, and receive detailed evaluation feedback.

## Core Components

### 1. Evaluation Engine (`lib/evaluation-engine/index.ts`)

#### Ground Truth Extraction

The engine extracts malicious IOCs from simulation events using:
- **Threat Score Threshold**: Events with `threat_score >= 60`
- **Explicit Malicious Flag**: Events with `details.isMalicious === true`
- **IOC Types Extracted**: IPs, domains, hashes, PIDs
- **Stage Association**: Each IOC is tied to its MITRE ATT&CK stage

#### Evaluation Logic

**Classification Matrix:**
- ✅ **True Positive**: User tagged malicious IOC correctly
- ❌ **False Positive**: User tagged benign IOC as malicious
- ❌ **False Negative**: User missed a malicious IOC
- ✅ **True Negative**: User correctly left benign IOC untouched

**Partial Credit System:**
- `confirmed-threat` tag on malicious IOC = Full credit (1.0)
- `suspicious` tag on malicious IOC = Partial credit (0.5)
- `suspicious` tag on benign IOC = Smaller penalty (0.3)

#### Score Calculation

**Weighted Formula:**
```
Score = (Weighted TP Rate × 100) - (FP Rate × 50) - (FN Rate × 30)
```

**Impact-Based Weighting:**
- Critical stages (credential-access, exfiltration, impact): 1.5x weight
- High stages (command-and-control, lateral-movement): 1.2-1.3x weight
- Base stages (initial-access, execution): 1.0x weight

This ensures missing a C2 beacon is penalized more than missing a PowerShell execution.

#### Stage-Based Breakdown

Tracks performance per MITRE ATT&CK stage:
- Detection rate per stage
- Missed IOCs per stage
- False positives per stage
- Total IOCs per stage

### 2. Evaluation Report UI (`components/soc-dashboard/EvaluationReport.tsx`)

#### Overview Tab
- **Final Score**: 0-100 with color coding
  - Green (≥90): Excellent
  - Yellow (70-89): Good
  - Orange (50-69): Fair
  - Red (<50): Needs Improvement
- **Metrics Breakdown**: TP, FP, FN, TN counts
- **Stage Performance**: Progress bars showing detection rate per stage

#### Missed Tab
- **Missed IOCs List**: All malicious IOCs not tagged
  - Impact indicator (Critical/High/Medium)
  - Stage and technique context
  - Explanation of why it was missed
- **Over-Flagged IOCs**: Benign IOCs incorrectly tagged
  - User's tag classification
  - Explanation of false positive

#### Red Team Replay Tab
- **Attack Timeline**: Chronological view of attacker actions
- **Detection Status**: ✅ Detected or ❌ Missed per action
- **IOCs Per Action**: All IOCs extracted from each stage
- **Technique Details**: MITRE technique ID, name, description

#### Recommendations Tab
- **Automated Feedback**: Context-aware suggestions
  - Coverage gaps (e.g., "You missed all credential access activity")
  - Accuracy issues (e.g., "You flagged too many benign DNS events")
  - Strengths (e.g., "Your tagging accuracy was high")
  - Improvement areas (e.g., "Focus on correlating events across log sources")

### 3. API Integration (`app/api/simulation/route.ts`)

**Endpoint**: `POST /api/simulation`

**Action**: `complete`

**Request Body**:
```json
{
  "action": "complete",
  "config": {
    "session_id": "session-...",
    "ioc_tags": {
      "185.220.101.0": "confirmed-threat",
      "c2-malicious-domain.com": "suspicious",
      "8.8.8.8": "benign"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "session": { ... }
}
```

### 4. Input Locking Mechanism

**When Investigation is Finalized:**
- All IOC tagging buttons disabled
- Learning Mode toggle disabled
- Enrichment buttons disabled
- "Finalize Investigation" button shows "Investigation Locked"
- Warning message displayed

**Purpose:**
- Prevents score manipulation
- Ensures consistent evaluation
- Maintains replay integrity

## Scoring Details

### Base Metrics
- **True Positives**: Correctly identified malicious IOCs
- **False Positives**: Incorrectly flagged benign IOCs
- **False Negatives**: Missed malicious IOCs
- **True Negatives**: Correctly identified benign IOCs

### Weighted Scoring
1. **Impact-Based Weighting**: Critical stages worth 1.5x, high stages 1.2-1.3x
2. **Partial Credit**: "Suspicious" tags get 0.5x credit for correct identification
3. **Penalty System**: FP penalty max 50 points, FN penalty max 30 points

### Score Interpretation
- **90-100**: Excellent - Strong threat hunting skills
- **70-89**: Good - Solid performance with room for improvement
- **50-69**: Fair - Need to improve detection coverage
- **0-49**: Needs Improvement - Focus on fundamentals

## Known Limitations & Future Enhancements

### Current Limitations
1. **Binary Classification**: No nuanced scoring for ambiguous IOCs
2. **No Replay Video**: Timeline-based only, no visual playback
3. **100% Ground Truth**: All IOCs are definitively malicious/benign (unrealistic)
4. **No Time-Based Scoring**: Speed not factored into score

### Planned Improvements (Future Phases)
1. **Ambiguity Handling**: Some IOCs marked as "uncertain" requiring investigation
2. **Replay Visualization**: Video/animation of attack progression
3. **Time-Based Bonuses**: Faster detection = bonus points
4. **Multi-Stage Correlation**: Bonus for connecting related IOCs across stages
5. **Confidence Scoring**: Users can assign confidence levels to tags

## Reset Behavior

Clicking "Start New Investigation" resets:
- Session state
- All IOC tags
- Selected events
- Stage filters
- Learning Mode
- Evaluation report
- Enriches a fresh simulation

## Why Phase 4 Matters

**Before Phase 4:**
- Platform was a sandbox
- No accountability
- No measurable progress
- No feedback loop

**After Phase 4:**
- Platform is a training simulator
- Performance tracking
- Detailed feedback
- Skill assessment
- Confidence building

This phase transforms the project into a **cyber defense assessment platform** that builds real SOC analyst skills.

