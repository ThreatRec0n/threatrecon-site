import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DesktopGate } from '@/components/shared/DesktopGate';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { GameProvider } from '@/contexts/GameContext';
import { EvidenceProvider } from '@/contexts/EvidenceContext';
import { HomeScreen } from '@/screens/Home/HomeScreen';
import { CasesScreen } from '@/screens/Cases/CasesScreen';
import { BriefingScreen } from '@/screens/Briefing/BriefingScreen';
import { InvestigationScreen } from '@/screens/Investigation/InvestigationScreen';
import { VerdictScreen } from '@/screens/Verdict/VerdictScreen';
import { DebriefScreen } from '@/screens/Debrief/DebriefScreen';
import { VerifyScreen } from '@/screens/Verify/VerifyScreen';

export default function App() {
  return (
    <PlayerProvider>
      <GameProvider>
        <EvidenceProvider>
          <BrowserRouter>
            <DesktopGate>
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/cases" element={<CasesScreen />} />
                <Route path="/case/:caseId/briefing" element={<BriefingScreen />} />
                <Route
                  path="/case/:caseId/workspace"
                  element={<InvestigationScreen />}
                />
                <Route path="/case/:caseId/verdict" element={<VerdictScreen />} />
                <Route path="/case/:caseId/debrief" element={<DebriefScreen />} />
                <Route path="/verify/:id" element={<VerifyScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DesktopGate>
          </BrowserRouter>
        </EvidenceProvider>
      </GameProvider>
    </PlayerProvider>
  );
}
