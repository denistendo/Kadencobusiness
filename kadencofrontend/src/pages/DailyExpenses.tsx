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
import { Trash2, Plus, Wallet } from "lucide-react";
import { fetchApi } from "@/lib/api";

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

  // Total expenses
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses],
  );

  const loadExpenses = async () => {
    try {
      const data = await fetchApi("/expenses/");
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load expenses:", error);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Add new expense
  const handleAddExpense = async () => {
    let category = form.category;
    if (category === "Other") {
      if (!otherCategory) return alert("Please type the category for 'Other'");
      category = otherCategory;
    }

    if (!category || !form.amount)
      return alert("Please enter category and amount");

    try {
      await fetchApi("/expenses/add/", {
        method: "POST",
        body: JSON.stringify({
          category,
          description: form.description || undefined,
          amount: parseFloat(form.amount),
        }),
      });

      setForm({ category: "", description: "", amount: "" });
      setOtherCategory("");
      loadExpenses(); // Refresh list after adding
    } catch (error) {
      console.error("Failed to add expense:", error);
      alert("Failed to record expense");
    }
  };

  // Delete expense
  const handleDelete = (id: string) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <h1 className="text-2xl font-display font-bold">Expenses</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Expenses"
          value={`${CURRENCY} ${totalExpenses.toLocaleString()}`}
          icon={Wallet}
          variant="warning"
        />
        <StatCard
          title="Number of Expenses"
          value={String(expenses.length)}
          icon={Wallet}
          variant="info"
        />
      </div>

      {/* Record New Expense */}
      <Card>
        <CardHeader>
          <CardTitle>Record New Expense</CardTitle>
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
            onClick={handleAddExpense}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-muted-foreground">No expenses recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                      Amount (UGX)
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b">
                      <td className="py-2 px-3">{e.category}</td>
                      <td className="py-2 px-3">{e.description || "-"}</td>
                      <td className="text-right py-2 px-3 font-semibold">
                        {CURRENCY} {Number(e.amount).toLocaleString()}
                      </td>
                      <td className="py-2 px-3">{e.date}</td>
                      <td className="text-center py-2 px-3">
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
                <tfoot>
                  <tr className="border-t font-bold text-success">
                    <td colSpan={2} className="py-2 px-3">
                      Total
                    </td>
                    <td className="text-right py-2 px-3">
                      {CURRENCY} {totalExpenses.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
