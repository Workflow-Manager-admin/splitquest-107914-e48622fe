import React, { createContext, useContext, useState } from "react";

// PUBLIC_INTERFACE
const GroupsContext = createContext();

/**
 * Returns grouped balances in the format:
 * {userId: {name, netOwes: [{to: userId, amount: number}]}}
 * using a simple "settle-up" netting algorithm.
 * @param {object[]} expenses - List of expenses in the group.
 * @param {object[]} members  - Member data: {id, name, number?}
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
    debtor.net += debt;
    creditor.net -= debt;
    if (Math.abs(debtor.net) < 0.009) d++;
    if (creditor.net < 0.009) c++;
  }

  const res = {};
  members.forEach(m => {
    res[m.id] = { name: m.name, owes: [], gets: [] };
  });
  transactions.forEach(tr => {
    res[tr.from].owes.push({ to: tr.to, amount: tr.amount });
    res[tr.to].gets.push({ from: tr.from, amount: tr.amount });
  });

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
  // Unique ID generator
  const makeId = (prefix="u") =>
    prefix + (Date.now() + Math.floor(Math.random() * 100000));

  // State: Groups in { id, name, members: [{id, name, number}], expenses: [{ ... }] }
  const [groups, setGroups] = useState([]);

  // Add a new group, members should be: [{name, number}]
  // PUBLIC_INTERFACE
  const addGroup = (name, members) => {
    const groupId = makeId("g");
    // Assign an id to each member (unless already present)
    const membersWithIds = members.map(m =>
      ({ ...m, id: m.id || makeId("u") })
    );
    setGroups(g =>
      [...g, { id: groupId, name, members: membersWithIds, expenses: [] }]
    );
  };

  // Add an expense to a specific group
  // expects: expenseData = {title, amount, date, payer, splitWith} with payer/splitWith as member ids
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
              id: makeId("e")
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
  const getMembersForGroup = group => (group ? group.members : []);

  // Current user is just placeholder
  const currentUserId = "current-user-1";

  // Get all users (flatten all group members, unique by id)
  // PUBLIC_INTERFACE
  const getAllUsers = () => {
    const all = groups.flatMap(g => g.members);
    // De-duplicate by id
    const mapById = {};
    all.forEach(u => { mapById[u.id] = u; });
    return Object.values(mapById);
  };

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
        currentUserId
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
