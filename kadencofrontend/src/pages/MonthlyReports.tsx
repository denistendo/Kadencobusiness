import { useState, useMemo } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dailySales, dailyExpenses, monthlyData } from "@/lib/data";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MonthlyReports = () => {
  const [selectedMonth, setSelectedMonth] = useState(
    monthlyData[monthlyData.length - 1].month,
  );

  // Parse ISO date "YYYY-MM-DD" and return month index (0-based)
  const getMonthFromDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return -1;
    const month = parseInt(parts[1], 10);
    return isNaN(month) ? -1 : month - 1;
  };

  const selectedMonthIndex = MONTHS.indexOf(selectedMonth);

  const salesThisMonth = useMemo(
    () =>
      dailySales.filter((s) => getMonthFromDate(s.date) === selectedMonthIndex),
    [selectedMonthIndex],
  );

  const expensesThisMonth = useMemo(
    () =>
      dailyExpenses.filter(
        (e) => getMonthFromDate(e.date) === selectedMonthIndex,
      ),
    [selectedMonthIndex],
  );

  const totalSales = useMemo(
    () => salesThisMonth.reduce((sum, s) => sum + s.total, 0),
    [salesThisMonth],
  );

  const totalExpenses = useMemo(
    () => expensesThisMonth.reduce((sum, e) => sum + e.amount, 0),
    [expensesThisMonth],
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    expensesThisMonth.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  }, [expensesThisMonth]);

  const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  const totalExpensesByCategory = Object.values(categoryTotals).reduce(
    (sum, v) => sum + v,
    0,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Monthly Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedMonth} — Aggregated financial summary
          </p>
        </div>

        <select
          className="border rounded p-1 text-sm"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {monthlyData.map((m) => (
            <option key={m.month} value={m.month}>
              {m.month}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <StatCard
          title="Total Sales"
          value={`UGX ${totalSales.toLocaleString()}`}
          variant="success"
          icon={undefined}
        />
        <StatCard
          title="Total Expenses"
          value={`UGX ${totalExpenses.toLocaleString()}`}
          variant="warning"
          icon={undefined}
        />
      </div>

      {/* Expenses by Category */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">
            Expenses by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-3 mt-2">
                {categoryData.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">
                      {d.name}: UGX {d.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total of all expenses */}
              <div className="mt-4 text-right font-semibold text-base">
                Total Expenses: UGX {totalExpensesByCategory.toLocaleString()}
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No expenses recorded for this month.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyReports;
