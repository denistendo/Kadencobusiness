import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

type Payment = { amount: number; date: string };
type DebtorItem = { id: string; description: string; quantity: number; unitPrice: number; labour?: number; total: number; dateTaken: string; payments: Payment[] };
type Debtor = { id: string; name: string; phone: string; items: DebtorItem[] };

const DebtorsPage = () => {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openDetails, setOpenDetails] = useState<Debtor | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", description: "", quantity: "", unitPrice: "", labour: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // --- Fetch debtors from API
  const fetchDebtors = () => {
    fetch("/api/debtors/")
      .then(res => res.json())
      .then(data => setDebtors(data.debtors))
      .catch(err => console.error(err));
  };

  useEffect(() => fetchDebtors(), []);

  // --- Add debtor / debt ---
  const handleAddDebtor = () => {
    // --- Validation ---
    const qty = parseFloat(form.quantity);
    const unit = parseFloat(form.unitPrice);
    const labour = parseFloat(form.labour || "0");

    if (!form.name || !form.description || isNaN(qty) || isNaN(unit) || qty <= 0 || unit <= 0 || labour < 0) {
      alert("Please fill all required fields with valid positive values (Quantity in KGs).");
      return;
    }

    fetch("/api/debtors/add/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: qty,
        unit_price: unit,
        labour: labour,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.debtor_id) {
          setForm({ name: "", phone: "", description: "", quantity: "", unitPrice: "", labour: "" });
          setOpenAdd(false);
          fetchDebtors();
        } else alert("Error adding debt");
      });
  };

  // --- Record Payment ---
  const handlePayment = () => {
    if (!selectedDebtor || !paymentAmount) return;
    const amt = parseFloat(paymentAmount);
    if (amt <= 0 || isNaN(amt)) return alert("Enter a valid positive payment amount");

    fetch("/api/debtors/record-payment/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: selectedDebtor.items[0]?.id, amount: amt }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.payment_id) {
          setPaymentAmount("");
          setSelectedDebtor(null);
          setOpenPayment(false);
          fetchDebtors();
        } else alert("Error paying debt");
      });
  };

  const calculateRemaining = (debtor: Debtor) =>
    debtor.items.reduce((sum, item) => sum + (item.total - item.payments.reduce((pSum, p) => pSum + p.amount, 0)), 0);

  const filteredDebtors = debtors.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Debtors / Credit Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track customers on credit and manage payments</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Record Debt</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Debt</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Customer Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <Input placeholder="Item Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="Quantity (KGs)" type="number" min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                <Input placeholder="Unit Price (UGX)" type="number" min={0} value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
                <Input placeholder="Labour Cost (optional, UGX)" type="number" min={0} value={form.labour} onChange={e => setForm({ ...form, labour: e.target.value })} />
                <Button className="w-full" onClick={handleAddDebtor}>Save Debt</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openPayment} onOpenChange={setOpenPayment}>
            <DialogTrigger asChild><Button>Record Payment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Search Customer" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <div className="max-h-40 overflow-y-auto border p-2 rounded space-y-1">
                  {filteredDebtors.map(d => (
                    <Button key={d.id} variant="outline" onClick={() => setSelectedDebtor(d)}>
                      {d.name} — Remaining: UGX {calculateRemaining(d).toLocaleString()}
                    </Button>
                  ))}
                </div>
                {selectedDebtor && (
                  <div className="space-y-2">
                    <p>Paying: <b>{selectedDebtor.name}</b></p>
                    <p>Remaining Balance: UGX {calculateRemaining(selectedDebtor).toLocaleString()}</p>
                    <Input placeholder="Payment Amount" type="number" min={0} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                    <Button className="w-full" onClick={handlePayment}>Submit Payment</Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle>Debtors List</CardTitle>
          <Input placeholder="Search by Name or Phone" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Total Debt (UGX)</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebtors.map(d => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td>{d.name}</td>
                    <td>{d.phone}</td>
                    <td className="font-semibold">UGX {calculateRemaining(d).toLocaleString()}</td>
                    <td><Button variant="outline" size="sm" onClick={() => setOpenDetails(d)}>View Details</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebtorsPage;
