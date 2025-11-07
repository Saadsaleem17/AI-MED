import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Pharmacy from "./pages/Pharmacy";
import Medicines from "./pages/Medicines";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Help from "./pages/Help";
import SymptomChecker from "./pages/SymptomChecker";
import SymptomTracker from "./pages/SymptomTracker";
import ReportAnalyzer from "./pages/ReportAnalyzer";
import MedicationAssistant from "./pages/MedicationAssistant";
import HealthRecords from "./pages/HealthRecords";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import ResendVerification from "./pages/ResendVerification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/resend-verification" element={<ResendVerification />} />
          
          {/* Protected routes */}
          <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/explore" element={<AuthGuard><Pharmacy /></AuthGuard>} />
          <Route path="/pharmacy" element={<AuthGuard><Pharmacy /></AuthGuard>} />
          <Route path="/medicines" element={<AuthGuard><Medicines /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/edit-profile" element={<AuthGuard><EditProfile /></AuthGuard>} />
          <Route path="/help" element={<AuthGuard><Help /></AuthGuard>} />
          <Route path="/symptom-tracker" element={<AuthGuard><SymptomTracker /></AuthGuard>} />

          <Route path="/symptom-checker" element={<AuthGuard><SymptomChecker /></AuthGuard>} />
          <Route path="/report-analyzer" element={<AuthGuard><ReportAnalyzer /></AuthGuard>} />
          <Route path="/medication-assistant" element={<AuthGuard><MedicationAssistant /></AuthGuard>} />
          <Route path="/health-records" element={<AuthGuard><HealthRecords /></AuthGuard>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
