import React from 'react';

// PUBLIC_INTERFACE
export default function Invite() {
  /**
   * Invite friends to join via link (stub, to include functionality later).
   */
  return (
    <div style={{maxWidth:"570px",margin:"0 auto",padding:"2rem"}}>
      <h2>Invite Friends <span role="img" aria-label="Invite">➕</span></h2>
      <div>Share your invite link to add more friends to SplitQuest!</div>
      <button className="theme-toggle" style={{marginTop:"1.5rem"}}>Copy Invite Link</button>
    </div>
  );
}
