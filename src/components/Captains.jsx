import React from 'react';
import BatchCaptainsLeaderboard from './BatchCaptainsLeaderboard';

/**
 * Captains Component
 * The Elite Batch Captain Leaderboard with the 25 verified active recruits gate,
 * non-monetary Feed Drops virtual economy, and grand Status Progress Bar.
 */
export default function Captains({
  user,
  API,
  onBack,
  renderProfilePic,
  ...props
}) {
  return (
    <BatchCaptainsLeaderboard
      user={user}
      API={API}
      onBack={onBack}
      renderProfilePic={renderProfilePic}
      {...props}
    />
  );
}

export { BatchCaptainsLeaderboard };
