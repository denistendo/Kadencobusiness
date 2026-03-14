// Types and mock data for KADENCO INVESTMENTS

export interface Shareholder {
  id: string;
  name: string;
  capitalContributed: number;
  withdrawals: number;
  currentBalance: number;
}

export interface Product {
  id: string;
  name: string;
  currentStock: number;
  unitPrice: number;
  lowStockThreshold: number;
}

export interface Shipment {
  id: string;
  product: string;
  quantity: number;
  unitPrice: number;
  transportCost: number;
  estimatedSales: number;
  estimatedProfit: number;
  date: string;
  status: "in-transit" | "received" | "partial";
}

export interface DailySale {
  id: string;
  product: string;
  quantity: number;
  sellingPrice: number;
  total: number;
  date: string;
}

export interface DailyExpense {
  month: string;
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

export interface CashMovement {
  id: string;
  type: "injection" | "withdrawal";
  amount: number;
  investor?: string;
  description: string;
  date: string;
}

export const shareholders: Shareholder[] = [
  { id: "1", name: "Kade N.", capitalContributed: 50000, withdrawals: 5000, currentBalance: 45000 },
  { id: "2", name: "Denis M.", capitalContributed: 40000, withdrawals: 3000, currentBalance: 37000 },
  { id: "3", name: "Collins O.", capitalContributed: 35000, withdrawals: 2000, currentBalance: 33000 },
];

export const products: Product[] = [
  { id: "1", name: "Cement (50kg)", currentStock: 120, unitPrice: 750, lowStockThreshold: 20 },
  { id: "2", name: "Iron Sheets (Box)", currentStock: 45, unitPrice: 1200, lowStockThreshold: 10 },
  { id: "3", name: "Nails (5kg Pack)", currentStock: 8, unitPrice: 350, lowStockThreshold: 15 },
  { id: "4", name: "Paint (20L)", currentStock: 30, unitPrice: 4500, lowStockThreshold: 5 },
  { id: "5", name: "Timber (Piece)", currentStock: 200, unitPrice: 250, lowStockThreshold: 50 },
  { id: "6", name: "PVC Pipes (4m)", currentStock: 3, unitPrice: 450, lowStockThreshold: 10 },
];

export const shipments: Shipment[] = [
  { id: "1", product: "Cement (50kg)", quantity: 200, unitPrice: 650, transportCost: 5000, estimatedSales: 150000, estimatedProfit: 15000, date: "2026-02-15", status: "received" },
  { id: "2", product: "Iron Sheets (Box)", quantity: 50, unitPrice: 1000, transportCost: 3000, estimatedSales: 60000, estimatedProfit: 7000, date: "2026-02-14", status: "received" },
  { id: "3", product: "Paint (20L)", quantity: 40, unitPrice: 3800, transportCost: 2000, estimatedSales: 180000, estimatedProfit: 26000, date: "2026-02-17", status: "in-transit" },
];

export const dailySales: DailySale[] = [
  { id: "1", product: "Cement (50kg)", quantity: 15, sellingPrice: 800, total: 12000, date: "2026-02-17" },
  { id: "2", product: "Iron Sheets (Box)", quantity: 5, sellingPrice: 1300, total: 6500, date: "2026-02-17" },
  { id: "3", product: "Nails (5kg Pack)", quantity: 8, sellingPrice: 400, total: 3200, date: "2026-02-17" },
  { id: "4", product: "Timber (Piece)", quantity: 20, sellingPrice: 300, total: 6000, date: "2026-02-17" },
  { id: "5", product: "Cement (50kg)", quantity: 25, sellingPrice: 800, total: 20000, date: "2026-02-16" },
  { id: "6", product: "Paint (20L)", quantity: 3, sellingPrice: 5000, total: 15000, date: "2026-02-16" },
];

export const dailyExpenses: DailyExpense[] = [
  { id: "1", description: "Shop attendant salary", category: "Labor", amount: 1500, date: "2026-02-17" },
  { id: "2", description: "Electricity bill", category: "Home", amount: 800, date: "2026-02-17" },
  { id: "3", description: "Delivery fuel", category: "Transport", amount: 600, date: "2026-02-17" },
  { id: "4", description: "Lunch for workers", category: "Labor", amount: 400, date: "2026-02-17" },
  { id: "5", description: "Water bill", category: "Home", amount: 300, date: "2026-02-16" },
  { id: "6", description: "Office supplies", category: "Other", amount: 1200, date: "2026-02-16" },
];

export const cashMovements: CashMovement[] = [
  { id: "1", type: "injection", amount: 20000, investor: "Kade N.", description: "Monthly capital injection", date: "2026-02-01" },
  { id: "2", type: "injection", amount: 15000, investor: "Denis M.", description: "Stock restocking", date: "2026-02-05" },
  { id: "3", type: "withdrawal", amount: 5000, investor: "Collins O.", description: "Personal withdrawal", date: "2026-02-10" },
  { id: "4", type: "injection", amount: 10000, investor: "Kade N.", description: "Emergency fund", date: "2026-02-12" },
];

export const expenseCategories = ["Labor", "Home", "Transport", "Investor Contribution", "Supplies", "Other"];

export const monthlyData = [
  { month: "Sep", sales: 280000, expenses: 85000 },
  { month: "Oct", sales: 320000, expenses: 92000 },
  { month: "Nov", sales: 295000, expenses: 78000 },
  { month: "Dec", sales: 410000, expenses: 110000 },
  { month: "Jan", sales: 350000, expenses: 95000 },
  { month: "Feb", sales: 275000, expenses: 72000 },
];
