# ThreatRecon Platform Integration Guide

## ✅ Phase 1 Components Created

### 1. Onboarding Tutorial System
- **File**: `components/tutorial/OnboardingTutorial.tsx`
- **Status**: ✅ Complete
- **Features**: 7-step interactive tutorial with spotlight effects

### 2. Evaluation System
- **File**: `lib/evaluation/investigation-evaluator.ts`
- **Status**: ✅ Complete
- **Features**: Comprehensive scoring with IOC tracking

### 3. Evaluation Results Modal
- **File**: `components/investigation/EvaluationResultsModal.tsx`
- **Status**: ✅ Complete
- **Features**: Animated score, breakdown sections, learning recommendations

### 4. Submit Investigation Button
- **File**: `components/investigation/SubmitInvestigationButton.tsx`
- **Status**: ✅ Complete
- **Features**: IOC count display, confirmation dialog

### 5. MITRE Knowledge Base
- **File**: `lib/learning/mitre-knowledge.ts`
- **Status**: ✅ Complete
- **Features**: 6 comprehensive MITRE techniques

### 6. Technique Explainer Panel
- **File**: `components/learning/TechniqueExplainerPanel.tsx`
- **Status**: ✅ Complete
- **Features**: Sliding panel with technique details

### 7. Alert Analysis Guide
- **File**: `components/learning/AlertAnalysisGuide.tsx`
- **Status**: ✅ Complete
- **Features**: Context-aware help for alerts

### 8. Learning Context Provider
- **File**: `lib/contexts/LearningContext.tsx`
- **Status**: ✅ Complete
- **Features**: Global learning mode state management

## 🔧 Integration Steps Required

### Step 1: Update `app/simulation/page.tsx`
Wrap the SimulationDashboard with LearningProvider:

```tsx
import { LearningProvider } from '@/lib/contexts/LearningContext';

export default function SimulationPage() {
  return (
    <LearningProvider>
      <Suspense fallback={...}>
        <SimulationDashboard />
      </Suspense>
    </LearningProvider>
  );
}
```

### Step 2: Update `components/soc-dashboard/SimulationDashboard.tsx`

#### Add imports:
```tsx
import OnboardingTutorial from '@/components/tutorial/OnboardingTutorial';
import EvaluationResultsModal from '@/components/investigation/EvaluationResultsModal';
import SubmitInvestigationButton from '@/components/investigation/SubmitInvestigationButton';
import TechniqueExplainerPanel from '@/components/learning/TechniqueExplainerPanel';
import AlertAnalysisGuide from '@/components/learning/AlertAnalysisGuide';
import { useLearning } from '@/lib/contexts/LearningContext';
import { evaluateInvestigation } from '@/lib/evaluation/investigation-evaluator';
```

#### Add state:
```tsx
const [showOnboarding, setShowOnboarding] = useState(false);
const [showEvaluationModal, setShowEvaluationModal] = useState(false);
const [showAlertGuide, setShowAlertGuide] = useState(false);
const [investigationStartTime] = useState(new Date());
const { learningModeEnabled, currentTechnique, openTechnique, closeTechnique } = useLearning();
```

#### Update IOC tags to use Map:
```tsx
const [iocTags, setIocTags] = useState<Map<string, IOCTag>>(new Map());
```

#### Add handlers:
```tsx
const handleTagIOC = (ioc: string, tag: IOCTag) => {
  const newTags = new Map(iocTags);
  newTags.set(ioc, tag);
  setIocTags(newTags);
};

const handleSubmitInvestigation = async () => {
  if (!session) return;
  
  setIsSubmitting(true);
  const timeTaken = (Date.now() - investigationStartTime.getTime()) / 1000;
  
  const result = evaluateInvestigation(
    session.alerts || [],
    iocTags,
    timeTaken,
    session.events
  );
  
  setEvaluationResult(result);
  setShowEvaluationModal(true);
  setIsSubmitting(false);
};
```

#### Update handleFinalizeInvestigation to use new evaluator:
Replace the existing evaluation call with:
```tsx
const result = evaluateInvestigation(
  session.alerts || [],
  iocTags,
  timeTaken,
  session.events
);
```

#### Add components to JSX:
```tsx
{/* Onboarding Tutorial */}
{showOnboarding && (
  <OnboardingTutorial
    onComplete={() => setShowOnboarding(false)}
    onSkip={() => setShowOnboarding(false)}
  />
)}

{/* Submit Button */}
<SubmitInvestigationButton
  iocCount={iocTags.size}
  onSubmit={handleSubmitInvestigation}
  isSubmitting={isSubmitting}
/>

{/* Evaluation Modal */}
{evaluationResult && (
  <EvaluationResultsModal
    result={evaluationResult}
    isOpen={showEvaluationModal}
    onClose={() => setShowEvaluationModal(false)}
    onTryAgain={() => {
      setIocTags(new Map());
      setShowEvaluationModal(false);
      initializeSimulation();
    }}
    onNextScenario={() => {
      setIocTags(new Map());
      setShowEvaluationModal(false);
      initializeSimulation();
    }}
  />
)}

{/* Technique Explainer Panel */}
<TechniqueExplainerPanel
  technique={currentTechnique}
  isOpen={!!currentTechnique}
  onClose={closeTechnique}
/>

{/* Alert Analysis Guide */}
{selectedAlert && (
  <AlertAnalysisGuide
    alert={selectedAlert}
    isOpen={showAlertGuide}
    onClose={() => setShowAlertGuide(false)}
  />
)}
```

### Step 3: Update `components/soc-dashboard/AlertQueue.tsx`
Add learning icons and data attributes:

```tsx
// Add data attribute for tutorial
<div data-tutorial="alert-queue" className="...">

// Add ? icon next to each alert
<button
  onClick={() => {
    // Extract technique ID from alert and open explainer
    const techniqueId = extractTechniqueFromAlert(alert);
    if (techniqueId) {
      openTechnique(techniqueId);
    } else {
      setShowAlertGuide(true);
    }
  }}
  className="text-[#58a6ff] hover:text-[#4493f8]"
>
  ?
</button>
```

### Step 4: Update `components/LogExplorer.tsx`
Add learning icons next to MITRE technique IDs:

```tsx
{event.technique_id && (
  <button
    onClick={() => openTechnique(event.technique_id)}
    className="text-[#58a6ff] hover:underline"
  >
    {event.technique_id} (Learn)
  </button>
)}
```

### Step 5: Update `components/soc-dashboard/IOCTaggingPanel.tsx`
Update to use Map instead of Record:

```tsx
interface Props {
  userTags: Map<string, IOCTag>;
  onTagIOC: (ioc: string, tag: IOCTag) => void;
}
```

## 📦 Dependencies Installed

- ✅ framer-motion
- ✅ canvas-confetti
- ✅ @types/canvas-confetti

## 🚀 Next Steps

1. Complete integration steps above
2. Test onboarding tutorial
3. Test evaluation system
4. Test learning mode features
5. Add Phase 2 features (Difficulty System, Achievements, Scenarios)

## 📝 Notes

- The new evaluation system uses `Map<string, IOCTag>` instead of `Record<string, IOCTag>`
- Learning mode is enabled by default for new users
- Tutorial progress is saved in localStorage
- All MITRE techniques are stored in `lib/learning/mitre-knowledge.ts`

