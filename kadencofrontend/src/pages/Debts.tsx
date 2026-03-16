import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

type Payment = { amount: number; date: string };
type DebtorItem = { id: string; description: string; quantity: number; unit_price: number; labour?: number; total: number; date_taken: string; payments: Payment[] };
const PRODUCTS = ["RED G.NUTS", "WHITE G.NUTS", "Other"];
type Debtor = { id: string; name: string; phone: string; items: DebtorItem[] };

const DebtorsPage = () => {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openDetails, setOpenDetails] = useState<Debtor | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", product: "", customProduct: "", quantity: "", unitPrice: "", labour: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  
  // Edit State
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quantity: "", unitPrice: "", labour: "" });

  // --- Fetch debtors from API
  const fetchDebtors = async () => {
    try {
      const data = await fetchApi("/debtors/");
      setDebtors(data.debtors || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchDebtors(); }, []);

  // --- Add debtor / debt ---
  const handleAddDebtor = () => {
    // --- Validation ---
    const qty = parseFloat(form.quantity);
    const unit = parseFloat(form.unitPrice);
    const labour = parseFloat(form.labour || "0");
    const productName = form.product === "Other" ? form.customProduct.trim() : form.product;

    if (!form.name || !productName || isNaN(qty) || isNaN(unit) || qty <= 0 || unit <= 0 || labour < 0) {
      alert("Please fill all required fields with valid positive values (Quantity in KGs).");
      return;
    }

    fetchApi("/debtors/add/", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        description: productName,
        quantity: qty,
        unit_price: unit,
        labour: labour,
      }),
    })
      .then(data => {
        if (data.debtor_id) {
          setForm({ name: "", phone: "", product: "", customProduct: "", quantity: "", unitPrice: "", labour: "" });
          setOpenAdd(false);
          fetchDebtors();
        } else alert("Error adding debt");
      })
      .catch(err => alert("Error adding debt: " + err));
  };

  // --- Record Payment ---
  const handlePayment = () => {
    if (!selectedDebtor || !paymentAmount) return;
    const amt = parseFloat(paymentAmount);
    if (amt <= 0 || isNaN(amt)) return alert("Enter a valid positive payment amount");

    fetchApi("/debtors/record-payment/", {
      method: "POST",
      body: JSON.stringify({ item_id: selectedDebtor.items[0]?.id, amount: amt }),
    })
      .then(data => {
        if (data.payment_id) {
          setPaymentAmount("");
          setSelectedDebtor(null);
          setOpenPayment(false);
          fetchDebtors();
        } else alert("Error paying debt");
      })
      .catch(err => alert("Error paying debt: " + err));
  };

  // --- Edit & Delete Item ---
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this debt item?")) return;
    try {
      const res = await fetchApi(`/debtors/item/${itemId}/delete/`, { method: "DELETE" });
      if (res?.status === "success") {
        toast.success("Debt item deleted successfully");
        fetchDebtors();
        setOpenDetails(null); 
      }
    } catch (err) {
      toast.error("Error deleting item");
    }
  };

  const handleSaveEdit = async (itemId: string) => {
    const qty = parseFloat(editForm.quantity);
    const unit = parseFloat(editForm.unitPrice);
    const labour = parseFloat(editForm.labour || "0");
    
    if (isNaN(qty) || isNaN(unit) || qty <= 0 || unit <= 0 || labour < 0) {
      toast.error("Valid positive numbers required for Quantity and Unit Price.");
      return;
    }

    try {
      const res = await fetchApi(`/debtors/item/${itemId}/edit/`, {
        method: "PUT",
        body: JSON.stringify({ quantity: qty, unit_price: unit, labour: labour })
      });
      if (res?.status === "success") {
        toast.success("Debt item updated successfully");
        setEditingItem(null);
        fetchDebtors();
        setOpenDetails(null);
      }
    } catch (err) {
      toast.error("Error updating item");
    }
  };

  const startEditing = (item: DebtorItem) => {
    setEditingItem(item.id);
    setEditForm({
      quantity: Number(item.quantity).toString(),
      unitPrice: Number(item.unit_price).toString(),
      labour: item.labour ? Number(item.labour).toString() : "0"
    });
  };

  const calculateRemaining = (debtor: Debtor) =>
    debtor.items.reduce((sum, item) => sum + (Number(item.total) - item.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)), 0);

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
                
                <div className="flex gap-2">
                  <Select value={form.product} onValueChange={v => setForm({ ...form, product: v, customProduct: "" })}>
                    <SelectTrigger className="w-1/2"><SelectValue placeholder="Select Product" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {form.product === "Other" && (
                    <Input className="w-1/2" placeholder="Item Description" value={form.customProduct} onChange={e => setForm({ ...form, customProduct: e.target.value })} />
                  )}
                </div>

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
                  <th className="text-left font-medium py-2 text-muted-foreground">Name</th>
                  <th className="text-left font-medium py-2 text-muted-foreground">Phone</th>
                  <th className="text-right font-medium py-2 text-muted-foreground">Total Debt (UGX)</th>
                  <th className="text-center font-medium py-2 text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebtors.map(d => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-2.5">{d.name}</td>
                    <td className="py-2.5">{d.phone}</td>
                    <td className="font-semibold text-right py-2.5">UGX {calculateRemaining(d).toLocaleString()}</td>
                    <td className="text-center py-2.5"><Button variant="outline" size="sm" onClick={() => setOpenDetails(d)}>View Details</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={openDetails !== null} onOpenChange={(open) => !open && setOpenDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debt Details for {openDetails?.name}</DialogTitle>
          </DialogHeader>
          {openDetails && openDetails.items.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No debt records found.</p>
          ) : (
            <div className="space-y-6 mt-4">
              {openDetails?.items.map((item) => {
                const itemTotal = Number(item.total);
                const itemPaid = item.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const itemRemaining = itemTotal - itemPaid;
                return (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="flex justify-between items-start">
                      {editingItem === item.id ? (
                        <div className="flex-1 mr-4 space-y-2">
                          <h4 className="font-semibold text-base">{item.description} (Editing)</h4>
                          <div className="flex gap-2">
                            <Input type="number" placeholder="Qty" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} className="h-8 text-xs" />
                            <Input type="number" placeholder="Unit Price" value={editForm.unitPrice} onChange={e => setEditForm({...editForm, unitPrice: e.target.value})} className="h-8 text-xs" />
                            <Input type="number" placeholder="Labour" value={editForm.labour} onChange={e => setEditForm({...editForm, labour: e.target.value})} className="h-8 text-xs" />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => handleSaveEdit(item.id)}><Save className="h-3 w-3 mr-1"/> Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}><X className="h-3 w-3 mr-1"/> Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-semibold text-base flex items-center gap-2">
                            {item.description}
                            <div className="flex gap-1 ml-2">
                              <button onClick={() => startEditing(item)} className="text-muted-foreground hover:text-primary transition-colors"><Edit2 className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </h4>
                          <p className="text-xs text-muted-foreground">{item.date_taken} • Qty: {item.quantity} • Unit: UGX {Number(item.unit_price).toLocaleString()}{item.labour ? ` • Labour: UGX ${Number(item.labour).toLocaleString()}` : ""}</p>
                        </div>
                      )}
                      
                      {editingItem !== item.id && (
                        <div className="text-right">
                          <div className="text-sm font-semibold">Total: UGX {itemTotal.toLocaleString()}</div>
                          <div className={`text-xs font-bold ${itemRemaining === 0 ? 'text-success' : 'text-destructive'}`}>
                            Remaining: UGX {itemRemaining.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                    {item.payments.length > 0 && (
                      <div className="bg-background rounded p-2 border text-sm mt-2">
                        <p className="font-medium mb-1 text-xs text-muted-foreground uppercase tracking-wider">Payment History:</p>
                        <div className="space-y-1">
                          {item.payments.map((p, i) => (
                            <div key={i} className="flex justify-between text-xs border-b last:border-0 pb-1 last:pb-0">
                              <span>{p.date}</span>
                              <span className="text-success font-medium">+UGX {Number(p.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DebtorsPage;
