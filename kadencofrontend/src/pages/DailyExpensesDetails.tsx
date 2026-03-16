import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/lib/api";

type DailyExpense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string; // DD/MM/YYYY
};

const DailyExpensesDetails = () => {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [monthStr, setMonthStr] = useState<string>(String(new Date().getMonth() + 1));
  const [yearStr, setYearStr] = useState<string>(String(new Date().getFullYear()));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const month = parseInt(monthStr) || new Date().getMonth() + 1;
  const year = parseInt(yearStr) || new Date().getFullYear();

  // Ensure month is strictly between 1 and 12 without weird JS wraps
  const validMonth = Math.max(1, Math.min(12, month));

  // --- Fetch expenses from API ---
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await fetchApi("/expenses/");
        if (Array.isArray(data)) {
          const mappedExpenses = data.map((e: any) => ({
            id: String(e.id),
            category: e.category,
            description: e.description || "-",
            amount: Number(e.amount),
            date: new Date(e.date).toLocaleDateString("en-GB"),
          }));
          setExpenses(mappedExpenses);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchExpenses();
  }, []);

  // --- Adjust month for negatives ---
  const adjustedMonth = validMonth;

  // --- Days in month ---
  const daysInMonth = new Date(year, adjustedMonth, 0).getDate();

  // --- Calculate daily totals ---
  const dailyTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let day = 1; day <= daysInMonth; day++) totals[day] = 0;

    expenses.forEach(exp => {
      const [d, m, y] = exp.date.split("/").map(Number);
      if (m === adjustedMonth && y === year) {
        totals[d] += exp.amount;
      }
    });
    return totals;
  }, [expenses, validMonth, year, daysInMonth]);

  // --- Specific day expenses ---
  const specificDayExpenses = useMemo(() => {
    if (selectedDay === null) return [];
    return expenses.filter(exp => {
      const [d, m, y] = exp.date.split("/").map(Number);
      return d === selectedDay && m === validMonth && y === year;
    });
  }, [expenses, selectedDay, validMonth, year]);

  // --- Monthly total ---
  const monthlyTotal = useMemo(
    () => Object.values(dailyTotals).reduce((sum, val) => sum + val, 0),
    [dailyTotals]
  );

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <h1 className="text-2xl font-display font-bold">Daily Expenses Details</h1>
      <div className="flex gap-3 items-center">
        <Input
          type="number"
          placeholder="Month (1-12)"
          min={1}
          max={12}
          value={monthStr}
          onChange={e => setMonthStr(e.target.value)}
          className="sm:w-[120px]"
        />
        <Input
          type="number"
          placeholder="Year"
          value={yearStr}
          onChange={e => setYearStr(e.target.value)}
          className="sm:w-[120px]"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses Totals for {validMonth}/{year}</CardTitle>
          <p className="text-sm text-muted-foreground">Click on a day's row to view its specific expenses.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Day</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Total Expenses (UGX)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const hasExpenses = dailyTotals[day] > 0;
                  return (
                    <tr 
                      key={day} 
                      className={`border-b border-border/50 ${hasExpenses ? 'cursor-pointer hover:bg-muted/50' : ''} ${selectedDay === day ? 'bg-muted/50' : ''}`}
                      onClick={() => hasExpenses && setSelectedDay(day)}
                    >
                      <td className="py-2.5">{day}</td>
                      <td className={`text-right py-2.5 ${hasExpenses ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {dailyTotals[day].toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {/* Monthly total */}
                <tr className="border-t font-bold text-success">
                  <td className="py-2.5">Monthly Total</td>
                  <td className="text-right py-2.5">{monthlyTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Break down for specific day */}
      {selectedDay !== null && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle>Expenses Breakdown for {selectedDay}/{validMonth}/{year}</CardTitle>
          </CardHeader>
          <CardContent>
            {specificDayExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No specific expense records found for this day.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Amount (UGX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specificDayExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-border/50">
                        <td className="py-2.5 font-medium">{exp.category}</td>
                        <td className="py-2.5">{exp.description}</td>
                        <td className="text-right py-2.5">{exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="py-3 font-bold">Day Total</td>
                      <td className="text-right py-3 font-bold text-success text-base">
                        {specificDayExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyExpensesDetails;
