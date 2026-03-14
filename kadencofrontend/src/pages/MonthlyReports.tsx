import React, { useState, useMemo, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";
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
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [monthlyAggregatedData, setMonthlyAggregatedData] = useState<{month: string, sales: number, expenses: number}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await fetchApi("/monthly-reports/");
        const mappedSales = (data.sales || []).map((s: any) => ({
          ...s,
          quantity: Number(s.quantity),
          selling_price: Number(s.selling_price),
          total: Number(s.total)
        }));
        
        const mappedExpenses = (data.expenses || []).map((e: any) => ({
          ...e,
          amount: Number(e.amount)
        }));

        setSalesData(mappedSales);
        setExpensesData(mappedExpenses);
        
        const mData = data.monthly_data || [];
        setMonthlyAggregatedData(mData);
        setSelectedMonth(MONTHS[new Date().getMonth()]);
      } catch (err) {
        console.error("Failed to load monthly reports:", err);
      }
    };
    loadReports();
  }, []);

  // Parse ISO date "YYYY-MM-DD" and return month index (0-based)
  const getMonthFromDate = (dateStr: string) => {
    if (!dateStr) return -1;
    const parts = String(dateStr).split("-");
    if (parts.length !== 3) return -1;
    const month = parseInt(parts[1], 10);
    return isNaN(month) ? -1 : month - 1;
  };

  const selectedMonthIndex = MONTHS.indexOf(selectedMonth);

  const salesThisMonth = useMemo(
    () =>
      salesData.filter((s) => getMonthFromDate(s.date) === selectedMonthIndex),
    [selectedMonthIndex, salesData],
  );

  const expensesThisMonth = useMemo(
    () =>
      expensesData.filter(
        (e) => getMonthFromDate(e.date) === selectedMonthIndex,
      ),
    [selectedMonthIndex, expensesData],
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

  const groupedSales = useMemo(() => {
    const groups: Record<string, any[]> = {};
    salesThisMonth.forEach((s) => {
      const date = s.date || "Unknown";
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [salesThisMonth]);

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, any[]> = {};
    expensesThisMonth.forEach((e) => {
      const cat = e.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [expensesThisMonth]);

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
          {monthlyAggregatedData.map((m) => (
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

      {/* DETAILED DATA TABLES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Sales Table Grouped by Day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Sales By Day ({selectedMonth})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10 shadow-sm">
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground w-1/4">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Product</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Qty (kg)</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedSales.length > 0 ? groupedSales.map(([date, dailySales]) => (
                    <React.Fragment key={date}>
                      <tr className="bg-muted/30 border-b">
                        <td colSpan={4} className="py-2.5 px-3 font-semibold text-sm">
                          {date} — Total: <span className="text-success font-bold">UGX {dailySales.reduce((sum, s) => sum + s.total, 0).toLocaleString()}</span>
                        </td>
                      </tr>
                      {dailySales.map((s, i) => (
                        <tr key={s.id || i} className="border-b border-border/20 last-of-type:border-b-0">
                          <td className="py-2 pl-4 text-muted-foreground text-xs">└─</td>
                          <td className="py-2 font-medium">{s.product_name}</td>
                          <td className="text-right py-2">{s.quantity}</td>
                          <td className="text-right py-2 text-success">UGX {s.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )) : (
                    <tr><td colSpan={4} className="text-center text-sm text-muted-foreground py-8">No sales recorded this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table Categorized by Name */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Expenses Categorized By Name ({selectedMonth})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10 shadow-sm">
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground w-1/4">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedExpenses.length > 0 ? groupedExpenses.map(([category, catExpenses]) => (
                    <React.Fragment key={category}>
                      <tr className="bg-muted/30 border-b">
                        <td colSpan={4} className="py-2.5 px-3 font-semibold text-sm">
                          {category} — Total: <span className="text-warning font-bold">UGX {catExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                        </td>
                      </tr>
                      {catExpenses.map((e, i) => (
                        <tr key={e.id || i} className="border-b border-border/20 last-of-type:border-b-0">
                          <td className="py-2 pl-4 text-muted-foreground text-xs">{e.date}</td>
                          <td className="py-2 text-muted-foreground text-xs text-center">-</td>
                          <td className="py-2 truncate max-w-[150px]" title={e.description}>{e.description || "-"}</td>
                          <td className="text-right py-2 text-warning font-medium">UGX {e.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )) : (
                    <tr><td colSpan={4} className="text-center text-sm text-muted-foreground py-8">No expenses recorded this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyReports;
