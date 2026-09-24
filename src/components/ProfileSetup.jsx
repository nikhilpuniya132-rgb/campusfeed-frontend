import React from 'react';
import OnboardingWizard from './OnboardingWizard';

/**
 * ProfileSetup Component
 * Refined onboarding flow for CenterInsider.
 * Includes horizontal scroll container for stream selection pills (11th Medical, 11th Non-Med, 12th Commerce, Dropper),
 * searchable Institute Combobox, and hardcoded Bathinda coaching hub defaults.
 */
export default function ProfileSetup({
  googleUser,
  API,
  onComplete,
  ...props
}) {
  return (
    <OnboardingWizard
      googleUser={googleUser}
      API={API}
      onComplete={onComplete}
      {...props}
    />
  );
}

export { OnboardingWizard };
