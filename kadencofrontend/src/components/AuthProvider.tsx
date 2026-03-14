import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const navigate = useNavigate();
  const location = useLocation();

  // Inactivity timeout reference
  let timeoutId: ReturnType<typeof setTimeout>;

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    navigate("/");
  };

  const resetTimer = () => {
    if (timeoutId) clearTimeout(timeoutId);
    
    // Set timeout to 120,000ms (2 minutes)
    if (token) {
      timeoutId = setTimeout(() => {
        logout();
        toast.info("Session expired due to inactivity. Please log in again.");
      }, 120000);
    }
  };

  useEffect(() => {
    // Only track interactivity if logged in
    if (!token) return;

    resetTimer(); // Initialize timer

    const events = ["mousemove", "keydown", "click", "scroll"];
    
    const handleActivity = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [token, location.pathname]);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
