'use client';

// Sprint 1: UI-only PIN gate — no server auth logic yet.
// Sprint 3: Replace handlePinComplete with verifyPinAction Server Action
//           and read real pin state from session cookie via middleware.ts.

import { useState } from 'react';
import { PinKeypad } from '@/components/ui/PinKeypad';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const handlePinComplete = (pin: string): void => {
    // TODO Sprint 3: replace with verifyPinAction Server Action + session cookie
    // Demo PIN hardcoded to 0000 for Sprint 1 scaffolding only — not for production.
    if (pin === '0000') {
      setIsUnlocked(true);
    } else {
      setErrorCount((c) => c + 1);
    }
  };

  return (
    <div className="relative min-h-screen bg-sky-50">
      {/* Children behind the overlay — will be visible once unlocked */}
      {/* Note: children render in DOM while gate is visible (Sprint 1 scaffold).
          Sprint 3: middleware.ts will block the route entirely without a valid session cookie. */}
      <div aria-hidden={!isUnlocked} className={isUnlocked ? '' : 'invisible'}>
        {children}
      </div>

      {/* Full-screen PIN gate overlay */}
      {!isUnlocked && (
        <div className="fixed inset-0 w-screen h-screen z-50 bg-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            {/* Header */}
            <div className="text-center">
              <div className="text-7xl mb-4" aria-hidden="true">🔒</div>
              <h1 className="text-3xl font-bold text-white">Parent Mode</h1>
              <p className="text-slate-400 mt-2 text-lg">Enter your PIN to continue</p>
            </div>

            <PinKeypad onComplete={handlePinComplete} errorCount={errorCount} />

            {/* Sprint 1 dev helper — remove before production */}
            <p className="text-slate-600 text-sm">Sprint 1 demo PIN: 0000</p>
          </div>
        </div>
      )}
    </div>
  );
}
