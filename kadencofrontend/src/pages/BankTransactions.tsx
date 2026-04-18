import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
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
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ type: "deposit", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
  
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ type: "deposit", amount: "", description: "", date: "" });

  const fetchTransactions = async () => {
    try {
      const data = await fetchApi("/bank-transactions/");
      setTransactions(data.transactions || []);
      setTotalBalance(Number(data.total_balance) || 0);
      setTotalDeposits(Number(data.total_deposits) || 0);
      setTotalWithdrawals(Number(data.total_withdrawals) || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bank transactions.");
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Bank Account Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">Track business deposits and withdrawals</p>
        </div>

        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Bank Record</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Bank Record</DialogTitle></DialogHeader>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5 hover:bg-primary/10 transition-colors border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-primary">Current Total Bank Balance</p>
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold tracking-tight">UGX {totalBalance.toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 hover:bg-success/10 transition-colors border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ArrowUpCircle className="h-4 w-4 text-success" />
              <p className="text-sm font-medium text-success">Total Lifetime Deposits</p>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl font-bold tracking-tight">UGX {totalDeposits.toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 hover:bg-warning/10 transition-colors border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ArrowDownCircle className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-warning">Total Lifetime Withdrawals</p>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl font-bold tracking-tight">UGX {totalWithdrawals.toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-2 text-muted-foreground w-24">Date</th>
                  <th className="text-left font-medium py-2 text-muted-foreground">Type</th>
                  <th className="text-left font-medium py-2 text-muted-foreground">Description</th>
                  <th className="text-right font-medium py-2 text-muted-foreground">Amount (UGX)</th>
                  <th className="text-right font-medium py-2 text-muted-foreground w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">No bank transactions found.</td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="border-b border-border/50">
                      <td className="py-2.5">
                        {editingItem === t.id ? (
                          <Input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="h-8 text-xs p-1" />
                        ) : (
                          t.date
                        )}
                      </td>
                      <td className="py-2.5">
                        {editingItem === t.id ? (
                          <Select value={editForm.type} onValueChange={v => setEditForm({ ...editForm, type: v as any})}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="deposit">Deposit</SelectItem>
                              <SelectItem value="withdrawal">Withdrawal</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.type === 'deposit' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {editingItem === t.id ? (
                          <Input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="h-8 text-xs p-1" />
                        ) : (
                          t.description
                        )}
                      </td>
                      <td className="py-2.5 text-right font-medium">
                        {editingItem === t.id ? (
                          <Input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="h-8 text-xs p-1 text-right" />
                        ) : (
                          <span className={t.type === 'deposit' ? 'text-success' : 'text-warning'}>
                            {t.type === 'deposit' ? '+' : '-'}UGX {Number(t.amount).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {editingItem === t.id ? (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(t.id)} className="h-7 w-7 text-success"><Plus className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingItem(null)} className="h-7 w-7 text-muted-foreground"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(t)} className="h-7 w-7"><Edit2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(t.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
