import React, { useMemo } from "react";

/**
 * Leaderboard for showing fun, dynamic titles/emojis per group, based on expense history and balances.
 * Awards:
 *   - "Big Spender" (🤑): Most total paid (sum of 'paid' per expenses)
 *   - "Budget Boss" (🏆): Best net balance (least owes, most gets paid back)
 *   - "Always Owes" (🐢): Largest net owed or owes most to others
 *   - Also displays total paid, net owed, and last expense date for extra flavor.
 * All stats recompute live.
 */
// PUBLIC_INTERFACE
export default function GroupLeaderboard({ group, members, balances }) {
  // All logic is mocked/derived from local expenses data, but uses provided group.members.

  const leaderboard = useMemo(() => {
    if (!group || !group.expenses || !members.length) return [];
    // Build stats per user
    const userStats = {};
    members.forEach(m => {
      userStats[m.id] = {
        id: m.id,
        name: m.name,
        totalPaid: 0,
        netOwed: 0,
        owesTo: 0,
        getsFrom: 0,
        latestExpense: null,
      };
    });
    group.expenses.forEach(e => {
      if (userStats[e.payer]) {
        userStats[e.payer].totalPaid += e.amount;
        userStats[e.payer].latestExpense =
          !userStats[e.payer].latestExpense ||
          new Date(e.date) > new Date(userStats[e.payer].latestExpense)
            ? e.date
            : userStats[e.payer].latestExpense;
      }
      const share = e.amount / e.splitWith.length;
      e.splitWith.forEach(mid => {
        if (mid !== e.payer) {
          userStats[mid].netOwed += share;
        }
      });
    });
    // Use balances to get actual 'owes', 'gets' breakdowns.
    Object.keys(balances || {}).forEach(uid => {
      const bal = balances[uid];
      if (!userStats[uid]) return;
      userStats[uid].balance = bal.balance || 0;
      userStats[uid].owesTo = (bal.owes || []).reduce((sum, o) => sum + o.amount, 0);
      userStats[uid].getsFrom = (bal.gets || []).reduce((sum, o) => sum + o.amount, 0);
    });
    const sortedByPaid = Object.values(userStats).slice().sort((a, b) => b.totalPaid - a.totalPaid);
    const sortedByBalance = Object.values(userStats).slice().sort((a, b) => (b.balance||0) - (a.balance||0));
    const sortedByOwes = Object.values(userStats).slice().sort((a, b) => b.owesTo - a.owesTo);

    if (sortedByPaid[0]) sortedByPaid[0].award = { emoji: "🤑", title: "Big Spender" };
    if (sortedByBalance[0]) sortedByBalance[0].award = { emoji: "🏆", title: "Budget Boss" };
    if (sortedByOwes[0]) sortedByOwes[0].award = { emoji: "🐢", title: "Always Owes" };
    const awardAssigned = {};
    Object.values(userStats).forEach(us => {
      if (us.award) {
        if (awardAssigned[us.award.title]) us.award = null;
        else awardAssigned[us.award.title] = us.id;
      }
    });

    if (group.expenses.length === 0) {
      return members.map(m => ({
        ...userStats[m.id],
        fun: "Invite friends and add expenses to unlock rankings!",
      }));
    }

    return Object.values(userStats).map(us => ({
      ...us,
      badge: us.award?.emoji,
      badgeTitle: us.award?.title,
      stats: [
        `Paid ₹${us.totalPaid}`,
        `Owes ₹${us.owesTo}`,
        `Gets ₹${us.getsFrom}`,
        `Net: ₹${(us.balance || 0)}`,
      ],
      latestExpense: us.latestExpense,
    }));
  }, [group, members, balances]);

  // Gamified, playful visual style
  return (
    <div style={{
      background: "var(--background-light, #fafafe)",
      borderRadius: 16,
      padding: "1.5rem",
      marginBottom: "1.2rem",
      boxShadow: "0 2px 13px #FFD2700c",
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: "1.3rem",
        color: "var(--color-accent, #FF5959)",
        letterSpacing: "0.5px"
      }}>
        Group Leaderboard <span role="img" aria-label="Leaderboard">🏅</span>
      </h3>
      {leaderboard.length ? (
        <div style={{display:"flex", flexDirection:"column", gap: "13px"}}>
          {leaderboard.map(u => (
            <div key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                background: u.badge ? "var(--color-secondary, #FBD46D)" : "#fbfdf9",
                borderRadius: "10px",
                boxShadow: u.badge ? "0 2px 10px #FFD27044" : "none",
                padding: u.badge ? "0.75rem 1.2rem" : "0.5rem 1.05rem",
                fontWeight: 600,
                color: u.badge ? "var(--color-accent, #FF5959)" : "#4F8A8B",
                fontSize: u.badge ? "1.18rem" : "1.09rem"
              }}
            >
              <span style={{fontSize: "1.48em", marginRight:7}} role="img" aria-label={u.badgeTitle || "member"}>
                {u.badge ? u.badge : "🧑"}
              </span>
              <span style={{marginRight: 10}}>
                {u.name} {u.badge && <span style={{
                  background: "#fff6e2",
                  color: "#ff9529",
                  borderRadius: "8px",
                  padding: "2.5px 7px",
                  fontWeight: 500,
                  fontSize: "0.97em",
                  marginLeft: 8
                }}>{u.badgeTitle}</span>}
              </span>
              <span style={{ opacity: 0.75, fontSize: "0.91em", marginRight: 12 }}>
                {u.stats?.join(" | ")}
              </span>
              {u.latestExpense &&
                <span style={{marginLeft:"auto",fontSize:"0.91em",color:"#bbb"}}>
                  Expense last: {u.latestExpense}
                </span>
              }
              {u.fun && <span style={{marginLeft: 12, color: "#bbb"}}>{u.fun}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign:"center",
          color:"var(--color-secondary, #FBD46D)"
        }}>
          No members or expenses yet.
        </div>
      )}
    </div>
  );
}
