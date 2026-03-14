import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

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
  const [monthStr, setMonthStr] = useState<string>(String(new Date().getMonth() + 1));
  const [yearStr, setYearStr] = useState<string>(String(new Date().getFullYear()));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const month = parseInt(monthStr) || new Date().getMonth() + 1;
  const year = parseInt(yearStr) || new Date().getFullYear();

  // Ensure month is strictly between 1 and 12 without weird JS wraps
  const validMonth = Math.max(1, Math.min(12, month));

  // --- Fetch sales from API ---
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await fetchApi("/sales/");
        if (Array.isArray(data)) {
          const mappedSales = data.map((s: any) => ({
            id: String(s.id),
            product: s.product_name,
            quantity: Number(s.quantity),
            sellingPrice: Number(s.selling_price),
            total: Number(s.total),
            date: new Date(s.date).toLocaleDateString("en-GB"),
          }));
          setSales(mappedSales);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSales();
  }, []);

  // --- Adjust month for negatives ---
  const adjustedMonth = validMonth;

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
  }, [sales, validMonth, year, daysInMonth]);

  // --- Specific day sales ---
  const specificDaySales = useMemo(() => {
    if (selectedDay === null) return [];
    return sales.filter(sale => {
      const [d, m, y] = sale.date.split("/").map(Number);
      return d === selectedDay && m === validMonth && y === year;
    });
  }, [sales, selectedDay, validMonth, year]);

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
          <CardTitle>Sales Totals for {validMonth}/{year}</CardTitle>
          <p className="text-sm text-muted-foreground">Click on a day's row to view its specific sales.</p>
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
                  const hasSales = dailyTotals[day] > 0;
                  return (
                    <tr 
                      key={day} 
                      className={`border-b border-border/50 ${hasSales ? 'cursor-pointer hover:bg-muted/50' : ''} ${selectedDay === day ? 'bg-muted/50' : ''}`}
                      onClick={() => hasSales && setSelectedDay(day)}
                    >
                      <td className="py-2.5">{day}</td>
                      <td className={`text-right py-2.5 ${hasSales ? 'font-semibold' : 'text-muted-foreground'}`}>
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
            <CardTitle>Sales Breakdown for {selectedDay}/{validMonth}/{year}</CardTitle>
          </CardHeader>
          <CardContent>
            {specificDaySales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No specific sale records found for this day.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Product</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Qty (kg)</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specificDaySales.map((sale) => (
                      <tr key={sale.id} className="border-b border-border/50">
                        <td className="py-2.5 font-medium">{sale.product}</td>
                        <td className="text-right py-2.5">{sale.quantity}</td>
                        <td className="text-right py-2.5">{sale.sellingPrice.toLocaleString()}</td>
                        <td className="text-right py-2.5">{sale.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="py-3 font-bold">Day Total</td>
                      <td className="text-right py-3 font-bold text-success text-base">
                        {specificDaySales.reduce((sum, s) => sum + s.total, 0).toLocaleString()}
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

export default DailySalesDetails;
