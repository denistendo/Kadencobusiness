import { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Wallet, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

type Expense = {
  id: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
};

const CURRENCY = "UGX";
const categories = ["Labour", "Derrick", "Chris", "Mzee Boss", "Home", "Other"];

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
  });
  const [otherCategory, setOtherCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-GB");

  // Today's expenses
  const todayExpenses = useMemo(() => expenses.filter(e => e.date === today), [expenses, today]);
  const totalToday = useMemo(() => todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0), [todayExpenses]);

  // Month-to-date total
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const monthlyTotal = useMemo(() => {
    return expenses
      .filter(e => {
        const [d, m, y] = e.date.split("/").map(Number);
        return m === currentMonth && y === currentYear;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses, currentMonth, currentYear]);

  const loadExpenses = async () => {
    try {
      const data = await fetchApi("/expenses/");
      if (Array.isArray(data)) {
        const mappedExpenses = data.map((e: any) => ({
          ...e,
          date: new Date(e.date).toLocaleDateString("en-GB")
        }));
        setExpenses(mappedExpenses);
      }
    } catch (error) {
      console.error("Failed to load expenses:", error);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Add or Edit expense
  const handleAddOrEditExpense = async () => {
    let category = form.category;
    if (category === "Other") {
      if (!otherCategory) {
        toast.error("Please type the category for 'Other'");
        return;
      }
      category = otherCategory;
    }

    if (!category || !form.amount) {
      toast.error("Please enter category and amount");
      return;
    }

    try {
      if (editingId) {
        await fetchApi(`/expenses/${editingId}/edit/`, {
          method: "PUT",
          body: JSON.stringify({
            category,
            description: form.description || undefined,
            amount: parseFloat(form.amount),
          }),
        });
        toast.success("Expense updated successfully");
        setEditingId(null);
      } else {
        await fetchApi("/expenses/add/", {
          method: "POST",
          body: JSON.stringify({
            category,
            description: form.description || undefined,
            amount: parseFloat(form.amount),
          }),
        });
        toast.success("Expense recorded successfully");
      }

      setForm({ category: "", description: "", amount: "" });
      setOtherCategory("");
      loadExpenses(); // Refresh list after adding/editing
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast.error("Failed to save expense");
    }
  };

  // Delete expense
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await fetchApi(`/expenses/${id}/delete/`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Expense deleted");
    } catch (err) {
      toast.error("Failed to delete expense");
    }
  };

  // Edit expense
  const handleEdit = (expense: Expense) => {
    const isStandardCategory = categories.includes(expense.category);
    setForm({
      category: isStandardCategory ? expense.category : "Other",
      description: expense.description || "",
      amount: String(Number(expense.amount)),
    });
    setOtherCategory(isStandardCategory ? "" : expense.category);
    setEditingId(expense.id);
  };

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <h1 className="text-2xl font-display font-bold">Expenses</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Total Expenses"
          value={`${CURRENCY} ${totalToday.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={Wallet}
          variant="warning"
        />
        <StatCard
          title="Number of Expenses Today"
          value={String(todayExpenses.length)}
          icon={Wallet}
          variant="info"
        />
        <StatCard
          title="Month-to-Date Total"
          value={`${CURRENCY} ${monthlyTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={Wallet}
          variant="default"
        />
      </div>

      {/* Record / Edit Expense */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Expense" : "Record New Expense"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Category */}
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v })}
          >
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Other category input */}
          {form.category === "Other" && (
            <Input
              placeholder="Type category"
              value={otherCategory}
              onChange={(e) => setOtherCategory(e.target.value)}
              className="sm:w-[180px]"
            />
          )}

          {/* Description */}
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="sm:w-[250px]"
          />

          {/* Amount */}
          <Input
            placeholder={`Amount (${CURRENCY})`}
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="sm:w-[140px]"
          />

          <Button
            onClick={handleAddOrEditExpense}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> {editingId ? "Update" : "Add"}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {todayExpenses.length === 0 ? (
            <p className="text-muted-foreground">No expenses recorded today.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                      Amount (UGX)
                    </th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todayExpenses.map((e) => (
                    <tr key={e.id} className="border-b">
                      <td className="py-2 px-3 text-muted-foreground">{e.date}</td>
                      <td className="py-2 px-3">{e.category}</td>
                      <td className="py-2 px-3">{e.description || "-"}</td>
                      <td className="text-right py-2 px-3 font-semibold">
                        {CURRENCY} {Number(e.amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-center py-2 px-3 flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(e.id)}
                        >
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

      {/* Button to view Monthly / Daily Expenses Details */}
      <div className="flex justify-end">
        <Button onClick={() => navigate("/daily-expenses-details")}>View Daily Expenses Details</Button>
      </div>
    </div>
  );
};

export default Expenses;
