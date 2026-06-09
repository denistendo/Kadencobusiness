import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Wallet, ArrowUpCircle, ArrowDownCircle, Calendar, ArrowRightLeft } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

type BankTransaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  description: string;
  date: string;
};

const BankTransactionsPage = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Set default filters to current month and year
  const currentMonthStr = format(new Date(), "MM");
  const currentYearStr = format(new Date(), "yyyy");
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ type: "deposit", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
  
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ type: "deposit", amount: "", description: "", date: "" });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/bank-transactions/");
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bank transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleAddTransaction = () => {
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0 || !form.description) {
      alert("Please enter a valid positive amount and a description.");
      return;
    }

    fetchApi("/bank-transactions/add/", {
      method: "POST",
      body: JSON.stringify({
        type: form.type,
        amount: amt,
        description: form.description,
        date: form.date,
      }),
    })
      .then(data => {
        if (data.transaction_id) {
          setForm({ type: "deposit", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
          setOpenAdd(false);
          toast.success(`Bank ${form.type} added successfully!`);
          fetchTransactions();
        } else alert("Error adding transaction");
      })
      .catch(err => alert("Error adding transaction: " + err));
  };

  const handleSaveEdit = async (id: string) => {
    const amt = parseFloat(editForm.amount);
    if (isNaN(amt) || amt <= 0 || !editForm.description) {
      toast.error("Valid positive number required for Amount and a description must be provided.");
      return;
    }

    try {
      const res = await fetchApi(`/bank-transactions/${id}/edit/`, {
        method: "PUT",
        body: JSON.stringify({ type: editForm.type, amount: amt, description: editForm.description, date: editForm.date })
      });
      if (res?.status === "success") {
        toast.success("Transaction updated successfully");
        setEditingItem(null);
        fetchTransactions();
      }
    } catch (err) {
      toast.error("Error updating transaction");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bank transaction?")) return;
    try {
      const res = await fetchApi(`/bank-transactions/${id}/delete/`, { method: "DELETE" });
      if (res?.status === "success") {
        toast.success("Transaction deleted successfully");
        fetchTransactions();
      }
    } catch (err) {
      toast.error("Error deleting transaction");
    }
  };

  const startEditing = (t: BankTransaction) => {
    setEditingItem(t.id);
    setEditForm({
      type: t.type,
      amount: Number(t.amount).toString(),
      description: t.description,
      date: t.date,
    });
  };

  // Generate Year dropdown options dynamically from transaction history
  const yearsOptions = Array.from(
    new Set(transactions.map(t => t.date ? t.date.split("-")[0] : ""))
  )
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a));

  // Always include the current year in the dropdown options
  if (!yearsOptions.includes(currentYearStr)) {
    yearsOptions.push(currentYearStr);
    yearsOptions.sort((a, b) => Number(b) - Number(a));
  }

  // Filter transactions based on selection
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const [y, m] = t.date.split("-");
    const matchMonth = selectedMonth === "all" || m === selectedMonth;
    const matchYear = selectedYear === "all" || y === selectedYear;
    return matchMonth && matchYear;
  });

  // Calculate opening balance: cumulative balance of all transactions BEFORE the selected month/year
  const openingBalance = transactions.reduce((acc, t) => {
    if (!t.date) return acc;
    const [yStr, mStr] = t.date.split("-");
    const y = Number(yStr);
    const m = Number(mStr);

    const targetY = selectedYear !== "all" ? Number(selectedYear) : null;
    const targetM = selectedMonth !== "all" ? Number(selectedMonth) : null;

    let isBefore = false;

    if (targetY !== null && targetM !== null) {
      if (y < targetY) {
        isBefore = true;
      } else if (y === targetY && m < targetM) {
        isBefore = true;
      }
    } else if (targetY !== null) {
      if (y < targetY) {
        isBefore = true;
      }
    } else if (targetM !== null) {
      if (m < targetM) {
        isBefore = true;
      }
    }

    if (isBefore) {
      const amt = Number(t.amount) || 0;
      return t.type === "deposit" ? acc + amt : acc - amt;
    }
    return acc;
  }, 0);

  // Activity within the filtered scope (selected month/year)
  const monthlyDeposits = filteredTransactions.reduce((acc, t) => {
    if (t.type === "deposit") {
      return acc + (Number(t.amount) || 0);
    }
    return acc;
  }, 0);

  const monthlyWithdrawals = filteredTransactions.reduce((acc, t) => {
    if (t.type === "withdrawal") {
      return acc + (Number(t.amount) || 0);
    }
    return acc;
  }, 0);

  // Closing balance: cumulative balance up to the END of the selected month/year
  const closingBalance = openingBalance + monthlyDeposits - monthlyWithdrawals;

  // Actual absolute balance today (all time)
  const absoluteCurrentBalance = transactions.reduce((acc, t) => {
    const amt = Number(t.amount) || 0;
    return t.type === "deposit" ? acc + amt : acc - amt;
  }, 0);

  // Helpers to format currency
  const formatUGX = (val: number) => {
    return `UGX ${Math.round(val).toLocaleString()}`;
  };

  // Month names mapping
  const monthNames: { [key: string]: string } = {
    "all": "All Months",
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  };

  const getSelectedPeriodLabel = () => {
    if (selectedMonth === "all" && selectedYear === "all") {
      return "All-Time";
    }
    const mLabel = monthNames[selectedMonth];
    const yLabel = selectedYear === "all" ? "All Years" : selectedYear;
    if (selectedMonth === "all") return yLabel;
    if (selectedYear === "all") return mLabel;
    return `${mLabel} ${yLabel}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Bank Account Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track business deposits, withdrawals, and bank balances. Current actual balance:{" "}
            <span className="font-semibold text-foreground">{formatUGX(absoluteCurrentBalance)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" /> New Bank Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Bank Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Transaction Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Amount (UGX)" type="number" min={0} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                <Input placeholder="Description or Reference" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <Button className="w-full" onClick={handleAddTransaction}>Save Record</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sleek Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-4 rounded-xl border border-border/60 shadow-sm">
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Select Period
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="01">January</SelectItem>
                  <SelectItem value="02">February</SelectItem>
                  <SelectItem value="03">March</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">May</SelectItem>
                  <SelectItem value="06">June</SelectItem>
                  <SelectItem value="07">July</SelectItem>
                  <SelectItem value="08">August</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {yearsOptions.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(selectedMonth !== "all" || selectedYear !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSelectedMonth("all"); setSelectedYear("all"); }} 
                className="text-muted-foreground hover:text-foreground h-9"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-right hidden md:block">
          <span className="text-xs text-muted-foreground block">Ledger Period</span>
          <span className="text-sm font-semibold text-primary">{getSelectedPeriodLabel()}</span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Opening Balance */}
        <Card className="bg-muted/30 hover:bg-muted/40 transition-colors border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Opening Balance</p>
            </div>
            <div className="mt-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{formatUGX(openingBalance)}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Prior to {getSelectedPeriodLabel()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Deposits */}
        <Card className="bg-success/5 hover:bg-success/10 transition-colors border-success/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center space-x-2">
              <ArrowUpCircle className="h-4 w-4 text-success" />
              <p className="text-sm font-medium text-success">Deposits in Period</p>
            </div>
            <div className="mt-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-success">+{formatUGX(monthlyDeposits)}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Total additions</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Withdrawals */}
        <Card className="bg-warning/5 hover:bg-warning/10 transition-colors border-warning/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center space-x-2">
              <ArrowDownCircle className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-warning">Withdrawals in Period</p>
            </div>
            <div className="mt-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-warning">-{formatUGX(monthlyWithdrawals)}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Total deductions</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Closing Balance */}
        <Card className="bg-primary/5 hover:bg-primary/10 transition-colors border-primary/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-primary">Closing Bank Balance</p>
            </div>
            <div className="mt-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-primary">{formatUGX(closingBalance)}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Still in bank at end of period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 py-4 px-6">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            Transaction History ({getSelectedPeriodLabel()})
          </CardTitle>
          <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
            {filteredTransactions.length} records
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground font-medium">
                  <th className="text-left py-3 px-6 w-32">Date</th>
                  <th className="text-left py-3 px-6 w-36">Type</th>
                  <th className="text-left py-3 px-6">Description / Reference</th>
                  <th className="text-right py-3 px-6 w-44">Amount</th>
                  <th className="text-right py-3 px-6 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">Loading transactions...</td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      No bank transactions recorded for {getSelectedPeriodLabel()}.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(t => (
                    <tr key={t.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-6 whitespace-nowrap">
                        {editingItem === t.id ? (
                          <Input 
                            type="date" 
                            value={editForm.date} 
                            onChange={e => setEditForm({...editForm, date: e.target.value})} 
                            className="h-9 text-sm p-2" 
                          />
                        ) : (
                          t.date
                        )}
                      </td>
                      <td className="py-3 px-6">
                        {editingItem === t.id ? (
                          <Select value={editForm.type} onValueChange={v => setEditForm({ ...editForm, type: v as any})}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="deposit">Deposit</SelectItem>
                              <SelectItem value="withdrawal">Withdrawal</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.type === 'deposit' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {t.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 max-w-xs truncate">
                        {editingItem === t.id ? (
                          <Input 
                            value={editForm.description} 
                            onChange={e => setEditForm({...editForm, description: e.target.value})} 
                            className="h-9 text-sm p-2" 
                          />
                        ) : (
                          t.description
                        )}
                      </td>
                      <td className="py-3 px-6 text-right font-medium text-base">
                        {editingItem === t.id ? (
                          <Input 
                            type="number" 
                            value={editForm.amount} 
                            onChange={e => setEditForm({...editForm, amount: e.target.value})} 
                            className="h-9 text-sm p-2 text-right" 
                          />
                        ) : (
                          <span className={t.type === 'deposit' ? 'text-success' : 'text-warning'}>
                            {t.type === 'deposit' ? '+' : '-'} {Number(t.amount).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        {editingItem === t.id ? (
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => handleSaveEdit(t.id)} className="h-8 text-success hover:text-success border-success/30 hover:bg-success/5">Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="h-8">Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(t)} className="h-8 w-8 hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(t.id)} className="h-8 w-8 hover:bg-destructive/5 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankTransactionsPage;
