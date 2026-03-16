import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Investors from "./pages/Investors";
import Stock from "./pages/Stock";
import DailySales from "./pages/DailySales";
import DailyExpenses from "./pages/DailyExpenses";
import Debts from "./pages/Debts";
import MonthlyReports from "./pages/MonthlyReports";
import NotFound from "./pages/NotFound";
import DailySalesDetails from "./pages/DailySalesDetails";
import DailyExpensesDetails from "./pages/DailyExpensesDetails";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/investors" element={<Investors />} />
                      <Route path="/stock" element={<Stock />} />
                      <Route path="/sales" element={<DailySales />} />
                      <Route path="/expenses" element={<DailyExpenses />} />
                      <Route path="/debts" element={<Debts />} />
                      <Route path="/reports" element={<MonthlyReports />} />
                      <Route path="/daily-sales-details" element={<DailySalesDetails />} />
                      <Route path="/daily-expenses-details" element={<DailyExpensesDetails />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
