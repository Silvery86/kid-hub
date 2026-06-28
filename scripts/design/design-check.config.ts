/**
 * design-check.config.ts
 *
 * Central configuration for all design automation checks.
 * Defines exclusion lists, skip routes, semantic token violation rules,
 * and per-file allowlists so the checks stay precise and noise-free.
 */

export interface SemanticViolation {
  pattern: RegExp
  suggestion: string
  description: string
}

export interface Config {
  /** .jsx files in design/components/ excluded from Check 2 (utility-only files) */
  utilityDesignFiles: string[]

  /** Routes excluded from Check 1 (redirect-only, intentionally code-only) */
  skipRoutes: string[]

  /** Semantic colour classes to flag in Check 4 */
  semanticViolations: SemanticViolation[]

  /** Files exempt from Check 4 (existing violations pending design decision) */
  tokenAllowlist: string[]

  /** Design files exempt from Check 3 viewport completeness (single-viewport or legacy files) */
  viewportExceptions: string[]

  /** Directories excluded from Check 4 scan */
  scanExcludeDirs: string[]
}

export const config: Config = {
  utilityDesignFiles: [
    'shared.jsx',
    'android-frame.jsx',
    'browser-window.jsx',
    'ios-frame.jsx',
    'design-canvas.jsx',
    'tweaks-panel.jsx',
  ],

  skipRoutes: ['/', '/kid-unlock', '/sentry-example-page'],

  semanticViolations: [
    {
      pattern: /\bbg-blue-(5|6)00\b/,
      suggestion: 'bg-btn-primary',
      description: 'Primary button background should use the btn-primary token',
    },
    {
      pattern: /\btext-blue-(5|6)00\b/,
      suggestion: 'text-btn-primary',
      description: 'Primary brand accent text should use the btn-primary token',
    },
  ],

  tokenAllowlist: [
    // Pre-existing violations (allowlisted so CI starts green; remove as each is fixed)
    'components/ui/Badge.tsx',
    'components/ui/KidButton.tsx',
    'components/ui/PinKeypad.tsx',
    'components/ui/ErrorBoundary.tsx',
    'components/grades/GradeCard.tsx',
    'components/grades/GradeTierBadge.tsx',
    'components/dashboard/SubjectCard.tsx',
    'components/parent/GradesManager.tsx',
    'components/parent/ParentDashboardView.tsx',
    'components/parent/ParentSaveButton.tsx',
    'components/parent/ParentPinKeypad.tsx',
    'components/parent/ScheduleManager.tsx',
    'components/parent/kid-access/KidPatternSetup.tsx',
    'components/parent/parent-login/ParentLoginStepIndicator.tsx',
    'components/parent/parent-login/ParentLoginView.tsx',
    'components/parent/parent-pin/ParentPinKeypad.tsx',
  ],

  viewportExceptions: [
    // Single-viewport reference file — Tablet-L only by design
    'dashboard-v2.jsx',
    // Responsive file missing Tablet Landscape — known gap, already implemented
    'dashboard-v2-responsive.jsx',
  ],

  scanExcludeDirs: ['e2e', 'design', 'scripts', 'node_modules', '.next'],
}
