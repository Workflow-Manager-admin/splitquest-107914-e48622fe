import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend as ReLegend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { FaMedal, FaCrown, FaWallet, FaUsers, FaArrowUp, FaArrowDown } from "react-icons/fa";
import SummaryCard from "../components/SummaryCard";
import { useGroups } from "../GroupsContext";

// Chart color palettes
const COLORS = [
  "#4F8A8B", "#FF5959", "#FFD046", "#24BDAA", "#fd436c",
  "#2d7ef0", "#19b859", "#BC71F5", "#fc7f51", "#e87a41",
];
const PIE_COLORS = ["#FF5959", "#4f8a8b", "#FFD046", "#bc71f5"];

// Utility: group by month from date string "YYYY-MM-DD"
function getMonth(date) {
  const [y, m] = date.split("-");
  return `${y}-${m}`;
}

// PUBLIC_INTERFACE
export default function Analytics() {
  /**
   * Analytics dashboard: colorful bar & pie charts, payer/debtor rankings, responsive visuals.
   * Uses recharts for interactive SVG charts.
   */
  const { groups, getAllUsers, calculateNetBalances } = useGroups();

  // Gather all expenses and members from all groups (mock/demo mode)
  const allUsers = getAllUsers();
  const allExpenses = useMemo(
    () => groups.flatMap((g) =>
      g.expenses.map((e) => ({
        ...e,
        groupId: g.id,
        groupName: g.name,
      }))
    ),
    [groups]
  );
  const demoMonths = Array.from(
    new Set(allExpenses.map((e) => getMonth(e.date)))
  );

  // Group bar chart: sum paid per user per month
  const monthlySpendPerUser = useMemo(() => {
    // { "2024-05": { u1: 100, u2: 90, ... }, ... }
    const result = {};
    allExpenses.forEach((e) => {
      const m = getMonth(e.date);
      if (!result[m]) result[m] = {};
      if (!result[m][e.payer]) result[m][e.payer] = 0;
      result[m][e.payer] += e.amount;
    });
    // Build chart data array for Recharts
    return Object.entries(result).map(([month, users]) => {
      const entry = { month };
      allUsers.forEach((u) => {
        entry[u.name] = users[u.id] || 0;
      });
      return entry;
    });
  }, [allExpenses, allUsers]);

  // Pie chart: total net "owed"/"gets" for all users, for debt/owed breakdown
  const { debtsPieData, payersRanking, debtorsRanking } = useMemo(() => {
    // Sum all balances across groups
    const memberSums = {};
    allUsers.forEach((u) => {
      memberSums[u.id] = {
        ...u,
        totalPaid: 0,
        netBalance: 0, // If negative: owes, positive: gets
      };
    });
    groups.forEach((g) => {
      const members = allUsers.filter((u) => g.members.includes(u.id));
      const balances = calculateNetBalances(g.expenses, members);
      Object.entries(balances || {}).forEach(([id, bal]) => {
        if (!memberSums[id]) return;
        // Sum all balances (can be negative or positive)
        memberSums[id].netBalance += bal.balance || 0;
      });
      g.expenses.forEach((e) => {
        if (memberSums[e.payer]) {
          memberSums[e.payer].totalPaid += e.amount;
        }
      });
    });
    // Pie chart for debts/owed: sum up positive (gets) and negative (owes)
    let totalOwed = 0, totalOwes = 0;
    Object.values(memberSums).forEach((u) => {
      if (u.netBalance < 0) totalOwes += -u.netBalance;
      if (u.netBalance > 0) totalOwed += u.netBalance;
    });

    const pieData = [
      { name: "Total Debts", value: Math.round(totalOwes * 100) / 100 },
      { name: "Total Owed", value: Math.round(totalOwed * 100) / 100 },
    ];

    // Ranking: sort by highest payer or debtor
    const payers = Object.values(memberSums)
      .slice()
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .map((u, idx) => ({
        ...u,
        rank: idx + 1,
      }));

    const debtors = Object.values(memberSums)
      .slice()
      .sort((a, b) => a.netBalance - b.netBalance)
      .map((u, idx) => ({
        ...u,
        absDebt: -u.netBalance > 0 ? -u.netBalance : 0,
        rank: idx + 1,
      }));

    return {
      debtsPieData: pieData,
      payersRanking: payers,
      debtorsRanking: debtors,
    };
  }, [groups, allUsers, calculateNetBalances]);

  // Responsive grid for summary cards
  const flexRowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    justifyContent: "center",
    marginBottom: 24,
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h2 className="sq-header" style={{
        color: "var(--color-accent, #FF5959)",
        fontSize: "2.14rem",
        fontWeight: 800,
        letterSpacing: "1px",
        marginBottom: 10,
      }}>
        Analytics <span role="img" aria-label="Analytics">📊</span>
      </h2>
      <div style={{ color: "#4F8A8B", fontSize: "1.05rem", marginBottom: 24 }}>
        View summarized spend and debt across groups. All data is demo/mock for now!
      </div>
      {/* Responsive: row turns to col on mobile */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1.7rem",
        marginBottom: "2.5rem",
        justifyContent: "center",
        alignItems: "stretch",
      }}>
        {/* Bar Chart: Monthly spend per user */}
        <div style={{
          flex: "1 1 350px",
          minWidth: 320,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 3px 22px #ffd27024",
          padding: "1.3rem 1.2rem 1.5rem 1.2rem",
          marginBottom: 9,
          maxWidth: 500,
        }}>
          <h4 style={{ color: "#4f8a8b", marginBottom: 6, fontWeight: 800 }}>Monthly Spend per User</h4>
          <ResponsiveContainer width="100%" aspect={1.9}>
            <BarChart
              data={monthlySpendPerUser}
              margin={{ top: 20, right: 12, left: 0, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="2" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis label={{
                value: "₹",
                angle: -90,
                position: "insideLeft",
                fontWeight: "bold",
                fill: "#888"
              }} />
              <ReTooltip
                contentStyle={{ background: "#fff4ed", borderRadius: 7, fontWeight: 600, border: "none", color: "#222" }}
                cursor={{ fill: "#ffd27022" }}
              />
              <ReLegend />
              {allUsers.map((u, idx) => (
                <Bar key={u.name} dataKey={u.name} stackId="a"
                  fill={COLORS[idx % COLORS.length]} radius={7}
                  name={u.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Pie Chart: Debt/Owed Distribution */}
        <div style={{
          flex: "1 1 290px",
          minWidth: 240,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 3px 20px #ffd27021",
          padding: "1.3rem 1.2rem 1.5rem 1.2rem",
          marginBottom: 9,
          maxWidth: 340,
        }}>
          <h4 style={{ color: "#FF5959", marginBottom: 6, fontWeight: 800 }}>Debt vs Owed Distribution</h4>
          <ResponsiveContainer width="100%" aspect={1.45}>
            <PieChart>
              <Pie
                data={debtsPieData}
                cx="50%" cy="50%"
                innerRadius={33}
                outerRadius={66}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                isAnimationActive
              >
                {debtsPieData.map((entry, idx) => (
                  <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip
                formatter={(val, name) => [`₹${val}`, name]}
                contentStyle={{ background: "#fff9ee", borderRadius: 7, fontWeight: 600, border: "none", color: "#222" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "0.98em",
              color: "#8B8381",
              marginTop: 12,
              gap: 15
            }}
          >
            {debtsPieData.map((seg, idx) => (
              <span key={seg.name} style={{
                display: "flex", alignItems: "center", gap: 6
              }}>
                <span style={{
                  width: 14, height: 14, display: "inline-block",
                  background: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: "50%"
                }}></span>
                {seg.name}: <b>₹{seg.value}</b>
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Rankings: Top payers and debtors */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.3rem",
          marginBottom: "2.7rem",
          justifyContent: "center"
        }}
      >
        <RankingList
          title="Top Payers"
          items={payersRanking.slice(0, 3)}
          icon={FaCrown}
          color="#FFD046"
          valueKey="totalPaid"
          labelPref="Paid"
          rankTheme={["#FFD046", "#bc71f5", "#4F8A8B"]}
        />
        <RankingList
          title="Top Debtors"
          items={debtorsRanking.filter(i => i.absDebt > 0).slice(0, 3)}
          icon={FaArrowDown}
          color="#FF5959"
          valueKey="absDebt"
          labelPref="Owes"
          rankTheme={["#FF5959", "#fc7f51", "#ffc5bb"]}
        />
      </div>
      <div style={{ textAlign: "center", fontSize: "1.04em", color: "#aaa", marginTop: 32 }}>
        <span role="img" aria-label="tip">💡</span> All statistics are demo/sample data. Add more groups/expenses for richer charts!
      </div>
    </div>
  );
}

// Summary card row for rankings (top payers/debtors)
function RankingList({ title, items, icon: Icon, color, valueKey, labelPref, rankTheme = [] }) {
  return (
    <div style={{
      minWidth: 215,
      flex: "1 1 233px",
      display: "flex", flexDirection: "column", alignItems: "flex-start"
    }}>
      <div
        style={{
          color: "var(--color-primary,#4F8A8B)",
          fontWeight: 700,
          fontSize: "1.14em",
          marginBottom: 7,
          letterSpacing: 0.1,
        }}
      >
        {title}
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 9 }}>
        {items.map((item, idx) => (
          <SummaryCard
            key={item.id}
            icon={<Icon size={30} />}
            value={`₹${item[valueKey]}`}
            label={
              <>
                <span style={{ fontWeight: 700 }}>
                  {/* Medal emoji for top rank */}
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null}
                  {item.name}
                </span>
                <span style={{ display: "block", fontSize: "0.98em", fontWeight: 400 }}>
                  {labelPref}
                </span>
              </>
            }
            color={rankTheme[idx] || color}
            style={{
              minWidth: 0,
              background: `linear-gradient(120deg, ${(rankTheme[idx] || color)}14 50%, #fff 99%)`,
            }}
            loading={false}
          />
        ))}
        {!items.length && (
          <div style={{ color: "#bbb", margin: "0.5em 0" }}>(No data to show)</div>
        )}
      </div>
    </div>
  );
}
