import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import PulseShowcase from "./pages/PulseShowcase";
import Composer from "./pages/Composer";
import Timeline from "./pages/Timeline";
import Medications from "./pages/Medications";
import Insights from "./pages/Insights";
import Vitals from "./pages/Vitals";
import VisitPrep from "./pages/VisitPrep";
import Schedule from "./pages/Schedule";
import Documents from "./pages/Documents";
import Connections from "./pages/Connections";
import Ehr from "./pages/Ehr";
import EhrCallback from "./pages/EhrCallback";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Account from "./pages/Account";
import ConsentGate from "@/components/ConsentGate";
import AppLayout from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pulse" element={<PulseShowcase />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            element={
              <ProtectedRoute>
                <ConsentGate>
                  <AppLayout />
                </ConsentGate>
              </ProtectedRoute>
            }
          >
            <Route path="/journal" element={<Composer />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/vitals" element={<Vitals />} />
            <Route path="/visit-prep" element={<VisitPrep />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/ehr" element={<Ehr />} />
            <Route path="/account" element={<Account />} />
            <Route path="/ehr/callback" element={<EhrCallback />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
