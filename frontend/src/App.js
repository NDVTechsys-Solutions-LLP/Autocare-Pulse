import "@/App.css";
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthCallback from "@/pages/AuthCallback";
import Landing from "@/pages/Landing";
import UserDashboard from "@/pages/UserDashboard";
import DealerConsole from "@/pages/DealerConsole";

function UserProtected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function DealerProtected({ children }) {
  const token = localStorage.getItem("dealer_token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function FullLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<UserProtected><UserDashboard /></UserProtected>} />
      <Route path="/dealer" element={<DealerProtected><DealerConsole /></DealerProtected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return (
    <div className="App font-body">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-right" richColors theme="dark" />
    </div>
  );
}

export default App;
