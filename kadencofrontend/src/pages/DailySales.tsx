import { useState, useMemo, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

type DailySale = {
  id: string;
  product: string;
  quantity: number; // in kgs
  sellingPrice: number;
  total: number;
  date: string; // DD/MM/YYYY
};

const PRODUCTS = ["RED G.NUTS", "WHITE G.NUTS", "Other"];

const DailySales = () => {
  const [sales, setSales] = useState<DailySale[]>([]);
  const [form, setForm] = useState({ product: "", customProduct: "", quantity: "", sellingPrice: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-GB");

  // Fetch existing sales
  const loadSales = async () => {
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
      console.error("Error loading sales", err);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Today's sales
  const todaySales = useMemo(() => sales.filter(s => s.date === today), [sales, today]);
  const totalToday = useMemo(() => todaySales.reduce((sum, s) => sum + s.total, 0), [todaySales]);

  // Month-to-date total
  const monthlyTotal = useMemo(() => sales.reduce((sum, s) => sum + s.total, 0), [sales]);

  // Add / Edit sale
  const handleAddOrEdit = async () => {
    const qty = parseFloat(form.quantity) || 0;
    const price = parseFloat(form.sellingPrice) || 0;
    const productName = form.product === "Other" ? form.customProduct.trim() : form.product;

    if (!productName || qty <= 0 || price <= 0) {
      alert("Please enter a valid product, quantity (kg), and price");
      return;
    }

    try {
      if (editingId) {
        await fetchApi(`/sales/${editingId}/edit/`, {
          method: "PUT",
          body: JSON.stringify({
            product_name: productName,
            quantity: qty,
            selling_price: price,
            total: qty * price,
          }),
        });
        setSales(prev =>
          prev.map(s =>
            s.id === editingId ? { ...s, product: productName, quantity: qty, sellingPrice: price, total: qty * price } : s
          )
        );
        toast.success("Sale updated successfully");
        setEditingId(null);
      } else {
        // Add new sale via API
        await fetchApi("/sales/add/", {
          method: "POST",
          body: JSON.stringify({
            product_name: productName,
            quantity: qty,
            selling_price: price,
            total: qty * price,
          }),
        });
        toast.success("Sale recorded successfully");
      }
      
      loadSales();
    } catch (err) {
      console.error(err);
      toast.error(editingId ? "Failed to update sale." : "Failed to record sale.");
    }

    setForm({ product: "", customProduct: "", quantity: "", sellingPrice: "" });
  };

  // Delete sale
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this sale?")) {
      try {
        await fetchApi(`/sales/${id}/delete/`, { method: "DELETE" });
        toast.success("Sale deleted");
        loadSales();
      } catch (err) {
        toast.error("Failed to delete sale");
      }
    }
  };

  // Edit sale
  const handleEdit = (sale: DailySale) => {
    setForm({
      product: PRODUCTS.includes(sale.product) ? sale.product : "Other",
      customProduct: PRODUCTS.includes(sale.product) ? "" : sale.product,
      quantity: String(Number(sale.quantity)),
      sellingPrice: String(Number(sale.sellingPrice)),
    });
    setEditingId(sale.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Daily Sales</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record sales daily (quantity in kgs), view totals, and track monthly sales
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Today's Total Sales" value={`UGX ${totalToday.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} icon={ShoppingCart} variant="success" />
        <StatCard title="Number of Sales Today" value={todaySales.length.toString()} icon={ShoppingCart} variant="info" />
        <StatCard title="Month-to-Date Total" value={`UGX ${monthlyTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} icon={ShoppingCart} variant="warning" />
      </div>

      {/* Add / Edit Sale Form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{editingId ? "Edit Sale" : "Record New Sale"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Select value={form.product} onValueChange={v => setForm({ ...form, product: v, customProduct: "" })}>
              <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder="Product" /></SelectTrigger>
              <SelectContent>
                {PRODUCTS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.product === "Other" && (
              <Input
                placeholder="Enter product name"
                value={form.customProduct}
                onChange={e => setForm({ ...form, customProduct: e.target.value })}
                className="sm:w-[200px]"
              />
            )}

            <Input
              className="sm:w-[120px]"
              placeholder="Quantity (kg)"
              type="number"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              className="sm:w-[140px]"
              placeholder="Selling Price (UGX)"
              type="number"
              value={form.sellingPrice}
              onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
            />

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Total: UGX {(parseFloat(form.quantity) || 0) * (parseFloat(form.sellingPrice) || 0)}
              </span>
              <Button
                onClick={handleAddOrEdit}
                disabled={!form.product || (form.product === "Other" && !form.customProduct) || !form.quantity || !form.sellingPrice}
              >
                <Plus className="h-4 w-4 mr-1" /> {editingId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Sales Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Today's Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySales.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sales recorded today.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Product</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Qty (kg)</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Price (UGX)</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Total (UGX)</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySales.map(sale => (
                    <tr key={sale.id} className="border-b border-border/50">
                      <td className="py-2.5 text-muted-foreground">{sale.date}</td>
                      <td className="py-2.5 font-medium">{sale.product}</td>
                      <td className="text-right py-2.5">{sale.quantity}</td>
                      <td className="text-right py-2.5">{sale.sellingPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                      <td className="text-right py-2.5 font-semibold">{sale.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                      <td className="text-center py-2.5 flex justify-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(sale)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(sale.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Button to view Monthly / Daily Sales Details */}
      <div className="flex justify-end">
        <Button onClick={() => navigate("/daily-sales-details")}>View Daily Sales Details</Button>
      </div>
    </div>
  );
};

export default DailySales;
