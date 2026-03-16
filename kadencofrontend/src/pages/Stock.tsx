import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Truck } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

const CURRENCY = "UGX";
const PRODUCTS = ["RED G.NUTS", "WHITE G.NUTS", "Other"];

type Shipment = {
  id: string;
  product: string;
  quantity: number;
  unitPrice: number;
  transportCost: number;
  supplierName: string;
  date: string;
};

const Stock = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [open, setOpen] = useState(false);
  const [recentSupplier, setRecentSupplier] = useState("");

  const [form, setForm] = useState({
    product: "",
    customProduct: "",
    quantity: "",
    unitPrice: "",
    transportCost: "",
    supplierName: "",
  });

  // Fetch shipments from backend
  const fetchShipments = async () => {
    try {
      const data = await fetchApi("/stock/");
      const mappedStock = data.shipments?.map((item: any) => ({
        id: String(item.id || Math.random()),
        product: item.product_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price) || 0,
        transportCost: Number(item.transport_cost) || 0,
        supplierName: "System",
        date: new Date(item.date).toLocaleDateString(),
      })) || [];
      
      setShipments(mappedStock);
    } catch (err) {
      console.error("Error fetching stock:", err);
      toast.error("Failed to fetch stock from backend.");
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleAddShipment = async () => {
    const productName = form.product === "Other" ? form.customProduct.trim() : form.product;
    if (!productName) return;

    try {
      // Add shipment via API
      const response = await fetchApi("/shipments/add/", {
        method: "POST",
        body: JSON.stringify({
          product_name: productName,
          quantity: Number(form.quantity),
          unit_price: Number(form.unitPrice),
          transport_cost: Number(form.transportCost),
          supplier_name: form.supplierName,
          status: "received" // Added status as it is required by the backend
        }),
      });

      const newShipment = {
        id: String(response?.shipment_id || Date.now()),
        product: productName,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        transportCost: Number(form.transportCost),
        supplierName: form.supplierName,
        date: new Date().toLocaleDateString(),
      };
      
      setShipments([newShipment, ...shipments]);
      setRecentSupplier(form.supplierName);
      toast.success("Shipment added successfully");
    } catch (err) {
      toast.error("Failed to add shipment");
    }

    setForm({
      product: "",
      customProduct: "",
      quantity: "",
      unitPrice: "",
      transportCost: "",
      supplierName: "",
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Shipments</h1>
          <p className="text-muted-foreground text-sm">Record incoming stock shipments</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Shipment
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Shipment</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={form.product}
                  onValueChange={(v) => setForm({ ...form, product: v, customProduct: "" })}
                >
                  <SelectTrigger className="w-full sm:w-[50%]">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {form.product === "Other" && (
                  <Input
                    placeholder="Enter product name"
                    value={form.customProduct}
                    onChange={(e) => setForm({ ...form, customProduct: e.target.value })}
                    className="w-full sm:w-[50%]"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Quantity (kg)"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Unit Price"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                />
              </div>

              <Input
                type="number"
                placeholder="Transport Cost"
                value={form.transportCost}
                onChange={(e) => setForm({ ...form, transportCost: e.target.value })}
              />

              <Input
                placeholder="Supplier Name"
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              />

              <Button className="w-full" onClick={handleAddShipment}>
                Save Shipment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Shipments"
          value={shipments.length.toString()}
          icon={Truck}
          variant="success"
        />
        <StatCard
          title="Recently Used Supplier"
          value={recentSupplier || "—"}
          icon={Package}
          variant="info"
        />
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Records</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 min-w-[120px]">Product</th>
                  <th className="text-right py-2 px-3">Qty (kg)</th>
                  <th className="text-right py-2 px-3 min-w-[110px]">Unit Price</th>
                  <th className="text-right py-2 px-3 min-w-[130px]">Product Total</th>
                  <th className="text-right py-2 px-3 min-w-[110px]">Transport</th>
                  <th className="text-right py-2 px-3 min-w-[130px]">Grand Total</th>
                  <th className="text-left py-2 px-4 min-w-[140px]">Supplier</th>
                  <th className="text-left py-2 px-4 min-w-[120px]">Date</th>
                </tr>
              </thead>

              <tbody>
                {shipments.map((s) => {
                  const productTotal = s.unitPrice * s.quantity;
                  const grandTotal = productTotal + s.transportCost;
                  return (
                    <tr key={s.id} className="border-b">
                      <td className="py-3 px-3">{s.product}</td>
                      <td className="text-right py-3 px-3">{s.quantity}</td>
                      <td className="text-right py-3 px-3">
                        {CURRENCY} {s.unitPrice.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-3">
                        {CURRENCY} {productTotal.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-3">
                        {CURRENCY} {s.transportCost.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-3 font-semibold">
                        {CURRENCY} {grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">{s.supplierName}</td>
                      <td className="py-3 px-4">{s.date}</td>
                    </tr>
                  );
                })}

                {shipments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-muted-foreground">
                      No shipments recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;
