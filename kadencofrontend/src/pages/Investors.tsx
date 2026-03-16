import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, TrendingUp } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-4))"];

interface Investor {
  id: string;
  name: string;
  capitalContributed: number;
  withdrawals: number;
  currentBalance: number;
}

const FALLBACK_INVESTORS: Investor[] = [
  { id: "inv_1", name: "Chris", capitalContributed: 5000000, withdrawals: 0, currentBalance: 5000000 },
  { id: "inv_2", name: "Derrick", capitalContributed: 3000000, withdrawals: 500000, currentBalance: 2500000 },
  { id: "inv_3", name: "Mzee Boss", capitalContributed: 10000000, withdrawals: 0, currentBalance: 10000000 },
];

const Investors = () => {
  const [shareholders, setShareholders] = useState<Investor[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState("");
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<"contribution" | "withdrawal">("contribution");

  // Fetch investors from backend
  const fetchInvestors = async () => {
    try {
      const data = await fetchApi("/investors/");
      const sourceArray = data.investors || data;
      if (Array.isArray(sourceArray)) {
        setShareholders(sourceArray.map((sh: any) => ({
          id: String(sh.id),
          name: sh.name,
          capitalContributed: Number(sh.capital_contributed || sh.capitalContributed) || 0,
          withdrawals: Number(sh.withdrawals) || 0,
          currentBalance: Number(sh.current_balance || sh.currentBalance) || 0,
        })));
      }
    } catch (err) {
      console.error("Error fetching investors:", err);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const totalCapital = shareholders.reduce((s, sh) => s + sh.capitalContributed, 0);
  const totalBalance = shareholders.reduce((s, sh) => s + sh.currentBalance, 0);


  const handleTransaction = async () => {
    if (!selectedInvestor || !amount) {
      toast.error("Please select an investor and enter an amount");
      return;
    }
    const amt = parseFloat(amount);

    try {
      await fetchApi("/investors/transaction/", {
        method: "POST",
        body: JSON.stringify({ investor_id: selectedInvestor, type: txType, amount: amt }),
      });
      
      fetchInvestors();
      toast.success("Transaction saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save transaction to backend");
    }

    setOpen(false);
    setAmount("");
    setSelectedInvestor("");
  };

  const pieData = shareholders.map(sh => ({
    name: sh.name,
    value: sh.currentBalance,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Investors & Capital
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage shareholder contributions and withdrawals
          </p>
        </div>

        {/* TRANSACTION DIALOG */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Transaction
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Record Transaction</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investor" />
                </SelectTrigger>
                <SelectContent>
                  {shareholders.length === 0 ? (
                    <SelectItem value="none" disabled>No investors available</SelectItem>
                  ) : (
                    shareholders.map(sh => (
                      <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Select value={txType} onValueChange={(v: "contribution" | "withdrawal") => setTxType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribution">Contribution</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Amount (UGX)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />

              <Button className="w-full" onClick={handleTransaction}>Save Transaction</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Capital" value={`UGX ${totalCapital.toLocaleString()}`} icon={Users} variant="default" />
        <StatCard title="Total Balance" value={`UGX ${totalBalance.toLocaleString()}`} icon={TrendingUp} variant="success" />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* TABLE */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Shareholder Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Capital</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Withdrawals</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-muted-foreground">
                        No shareholders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    shareholders.map(sh => (
                      <tr key={sh.id} className="border-b border-border/50">
                        <td className="py-3 font-medium">{sh.name}</td>
                        <td className="text-right py-3">UGX {sh.capitalContributed.toLocaleString()}</td>
                        <td className="text-right py-3 text-destructive">UGX {sh.withdrawals.toLocaleString()}</td>
                        <td className="text-right py-3 font-semibold">UGX {sh.currentBalance.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* PIE CHART */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Capital Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

            <div className="flex flex-col gap-1.5 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Investors;
