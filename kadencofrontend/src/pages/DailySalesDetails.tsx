import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DailySale = {
  id: string;
  product: string;
  quantity: number; // in kgs
  sellingPrice: number;
  total: number;
  date: string; // DD/MM/YYYY
};

const DailySalesDetails = () => {
  const [sales, setSales] = useState<DailySale[]>([]);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // --- Fetch sales from API ---
  useEffect(() => {
    fetch("/api/daily-sales/")
      .then(res => res.json())
      .then(data => setSales(data.sales))
      .catch(err => console.error(err));
  }, []);

  // --- Adjust month for negatives ---
  const adjustedMonth = month > 0 ? month : 12 + ((month % 12) || 0);

  // --- Days in month ---
  const daysInMonth = new Date(year, adjustedMonth, 0).getDate();

  // --- Calculate daily totals ---
  const dailyTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let day = 1; day <= daysInMonth; day++) totals[day] = 0;

    sales.forEach(sale => {
      const [d, m, y] = sale.date.split("/").map(Number);
      if (m === adjustedMonth && y === year) {
        totals[d] += sale.total;
      }
    });
    return totals;
  }, [sales, adjustedMonth, year, daysInMonth]);

  // --- Monthly total ---
  const monthlyTotal = useMemo(
    () => Object.values(dailyTotals).reduce((sum, val) => sum + val, 0),
    [dailyTotals]
  );

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <h1 className="text-2xl font-display font-bold">Daily Sales Details</h1>
      <div className="flex gap-3 items-center">
        <Input
          type="number"
          placeholder="Month (-12 to 12)"
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="sm:w-[120px]"
        />
        <Input
          type="number"
          placeholder="Year"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="sm:w-[120px]"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{`Sales for Month ${adjustedMonth}, ${year}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Day</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Total Sales (UGX)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  return (
                    <tr key={day} className="border-b border-border/50">
                      <td className="py-2.5">{day}</td>
                      <td className="text-right py-2.5 font-semibold">
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
    </div>
  );
};

export default DailySalesDetails;
