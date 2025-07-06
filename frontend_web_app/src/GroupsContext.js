import React, { createContext, useContext, useState } from "react";

// PUBLIC_INTERFACE
const GroupsContext = createContext();

/**
 * Returns grouped balances in the format:
 * {userId: {name, netOwes: [{to: userId, amount: number}]}}
 * using a simple "settle-up" netting algorithm.
 * @param {object[]} expenses - List of expenses in the group.
 * @param {object[]} members  - Member data: {id, name}
 * @returns {object} Map of memberId -> { name, balance, owes: [ {...} ] }
 */
function calculateNetBalances(expenses, members) {
  // 1. Compute each member's total paid and owed
  const memberTotals = {};
  members.forEach(m => {
    memberTotals[m.id] = { paid: 0, owed: 0, name: m.name };
  });

  expenses.forEach(exp => {
    const { payer, amount, splitWith } = exp;
    const share = amount / splitWith.length;
    splitWith.forEach(mid => {
      memberTotals[mid].owed += share;
    });
    memberTotals[payer].paid += amount;
  });

  // 2. Net up per member: positive = others owe them, negative = they owe others
  const net = {};
  members.forEach(m => {
    net[m.id] = {
      name: m.name,
      net: Math.round((memberTotals[m.id].paid - memberTotals[m.id].owed) * 100) / 100
    };
  });

  // 3. Create "who owes whom" breakdown (greedy settle)
  // List of debtors (net < 0) and creditors (net > 0)
  const debtors = Object.entries(net)
    .filter(([, v]) => v.net < -0.009)
    .map(([id, v]) => ({ id, ...v }));
  const creditors = Object.entries(net)
    .filter(([, v]) => v.net > 0.009)
    .map(([id, v]) => ({ id, ...v }));

  // Who owes whom: array of {from, to, amount}
  const transactions = [];
  let d = 0, c = 0;
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const debt = Math.min(-debtor.net, creditor.net);
    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(debt * 100) / 100
    });
    debtor.net += debt; // this will get closer to 0
    creditor.net -= debt;
    if (Math.abs(debtor.net) < 0.009) d++;
    if (creditor.net < 0.009) c++;
  }

  // For easier UI rendering, provide per member summary:
  // { [memberId]: { name, owes: [{ to, amount }], gets: [{ from, amount }] } }
  const res = {};
  members.forEach(m => {
    res[m.id] = { name: m.name, owes: [], gets: [] };
  });
  transactions.forEach(tr => {
    res[tr.from].owes.push({ to: tr.to, amount: tr.amount });
    res[tr.to].gets.push({ from: tr.from, amount: tr.amount });
  });

  // Add per-member balance for easy display (who is net-positive/negative)
  Object.keys(res).forEach(mid => {
    res[mid].balance = net[mid].net;
  });
  return res;
}

/**
 * Provides application-wide context for managing groups and expenses.
 */
// PUBLIC_INTERFACE
export function GroupsProvider({ children }) {
  // Mock, static friend/member data (simulate users)
  const MOCK_USERS = [
    { id: "u1", name: "Alice" },
    { id: "u2", name: "Bob" },
    { id: "u3", name: "Charlie" },
    { id: "u4", name: "Dana" }
  ];
  // Groups in { id, name, members: [userId], expenses: [{...}] }
  const [groups, setGroups] = useState([
    // Example default group (starter)
    {
      id: "g1",
      name: "Trip to Goa",
      members: ["u1", "u2", "u3"],
      expenses: [
        {
          id: "e1",
          title: "Hotel",
          amount: 3000,
          date: "2024-05-10",
          payer: "u1",
          splitWith: ["u1", "u2", "u3"]
        },
        {
          id: "e2",
          title: "Taxi",
          amount: 900,
          date: "2024-05-11",
          payer: "u2",
          splitWith: ["u1", "u2", "u3"]
        }
      ]
    }
  ]);

  // Add a new group
  // PUBLIC_INTERFACE
  const addGroup = (name, members) => {
    const id = "g" + (Date.now() + Math.floor(Math.random() * 100000));
    setGroups(g => [
      ...g,
      { id, name, members, expenses: [] }
    ]);
  };

  // Add an expense to a specific group
  // PUBLIC_INTERFACE
  const addExpense = (groupId, expenseData) => {
    setGroups(oldGroups =>
      oldGroups.map(gr => {
        if (gr.id !== groupId) return gr;
        return {
          ...gr,
          expenses: [
            ...gr.expenses,
            {
              ...expenseData,
              id: "e" + (Date.now() + Math.floor(Math.random() * 100000))
            }
          ]
        };
      })
    );
  };

  // Helpers for finding group/member objects
  // PUBLIC_INTERFACE
  const getGroupById = groupId => groups.find(g => g.id === groupId);

  // PUBLIC_INTERFACE
  const getMembersForGroup = group => (group ? group.members.map(uid => MOCK_USERS.find(u => u.id === uid)) : []);

  // PUBLIC_INTERFACE - returns list of all users (simulate current user as "u1")
  const getAllUsers = () => MOCK_USERS;

  return (
    <GroupsContext.Provider
      value={{
        groups,
        addGroup,
        addExpense,
        getGroupById,
        getMembersForGroup,
        getAllUsers,
        calculateNetBalances,
        MOCK_USERS,
        currentUserId: "u1"
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useGroups() {
  return useContext(GroupsContext);
}
