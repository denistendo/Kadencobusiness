import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Receipt, Wallet, Plus, TrendingUp, ArrowRight, Truck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchApi } from "@/lib/api";

interface Sale {
  id: number;
  product: string;
  quantity: number;
  sellingPrice: number;
  total: number;
}

interface DashboardData {
  today_sales: Sale[];
  today_expenses: Sale[];
  total_sales_today: number;
  total_expenses_today: number;
  total_debt_payments?: number;
  cash_on_hand: number;
  monthly_data: { month: string; sales: number; expenses: number }[];
}

const Index = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    today_sales: [],
    today_expenses: [],
    total_sales_today: 0,
    total_expenses_today: 0,
    cash_on_hand: 0,
    monthly_data: [],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await fetchApi("/dashboard/");
        
        // Map today_sales from backend to frontend representation
        const mappedTodaySales = (data.today_sales || []).map((s: any) => ({
            id: s.id,
            product: s.product_name,
            quantity: Number(s.quantity),
            sellingPrice: Number(s.selling_price),
            total: Number(s.total),
        }));

        setDashboardData({
          today_sales: mappedTodaySales,
          today_expenses: [],
          total_sales_today: Number(data.total_sales_today) || 0,
          total_expenses_today: Number(data.total_expenses_today) || 0,
          total_debt_payments: Number(data.total_debt_payments) || 0,
          cash_on_hand: (Number(data.total_sales) || 0) + (Number(data.total_debt_payments) || 0) - (Number(data.total_expenses) || 0),
          monthly_data: data.monthly_data?.map((m: any) => ({
            month: m.month,
            sales: Number(m.sales) || 0,
            expenses: Number(m.expenses) || 0,
          })) || [],
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    
    loadDashboard();
  }, []);

  const { today_sales, total_sales_today, total_expenses_today, cash_on_hand, monthly_data } = dashboardData;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back. Here's your business overview for today.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Today's Sales" value={`UGX ${total_sales_today.toLocaleString()}`} icon={ShoppingCart} variant="success" />
        <StatCard title="Today's Expenses" value={`UGX ${total_expenses_today.toLocaleString()}`} icon={Receipt} variant="warning" />
        <StatCard title="Cash on Hand" value={`UGX ${cash_on_hand.toLocaleString()}`} icon={Wallet} variant="default" />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/sales">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-success hover:bg-success/5 transition-colors">
            <Plus className="h-5 w-5 text-success" />
            <span className="text-sm font-medium">Record Sales</span>
          </Button>
        </Link>

        <Link to="/expenses">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-warning hover:bg-warning/5 transition-colors">
            <Receipt className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium">Record Expenses</span>
          </Button>
        </Link>

        <Link to="/stock">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-info hover:bg-info/5 transition-colors">
            <Truck className="h-5 w-5 text-info" />
            <span className="text-sm font-medium">Add Shipment</span>
          </Button>
        </Link>
      </div>

      {/* SALES VS EXPENSES CHART */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" /> Sales vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="sales" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expenses" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TODAY SALES TABLE */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-display">Today's Sales</CardTitle>
            <Link to="/sales">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
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
                {today_sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-border/50">
                    <td className="py-2.5">{sale.product}</td>
                    <td className="text-right py-2.5">{sale.quantity} kg</td>
                    <td className="text-right py-2.5">UGX {sale.sellingPrice.toLocaleString()}</td>
                    <td className="text-right py-2.5 font-medium">UGX {sale.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2.5 font-semibold">
                    Total
                  </td>
                  <td className="text-right py-2.5 font-bold text-success">
                    UGX {total_sales_today.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
