import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Suspense, lazy } from "react";

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
// Each page is loaded only when the user navigates to it, reducing the initial
// bundle size and improving Time to Interactive (TTI).

const Index          = lazy(() => import("./pages/Index"));
const Universities   = lazy(() => import("./pages/Universities"));
const Services       = lazy(() => import("./pages/Services"));
const Jobs           = lazy(() => import("./pages/Jobs"));
const Research       = lazy(() => import("./pages/Research"));
const Graduates      = lazy(() => import("./pages/Graduates"));
const Fees           = lazy(() => import("./pages/Fees"));
const Announcements  = lazy(() => import("./pages/Announcements"));
const Chat           = lazy(() => import("./pages/Chat"));
const Login          = lazy(() => import("./pages/Login"));
const Signup         = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Profile        = lazy(() => import("./pages/Profile"));
const More           = lazy(() => import("./pages/More"));
const About          = lazy(() => import("./pages/About"));
const NotFound       = lazy(() => import("./pages/NotFound"));

// ─── Query client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries once before showing an error
      retry: 1,
      // Consider data stale after 5 minutes
      staleTime: 5 * 60 * 1000,
    },
  },
});

// ─── Loading fallback ─────────────────────────────────────────────────────────
// Shown while a lazy page is being downloaded
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    fontSize: '1.5rem',
    color: 'var(--color-primary, #6366f1)',
  }}>
    <div className="page-loader-spinner" aria-label="Loading..." />
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout>
                {/* Suspense wraps all lazy routes and shows PageLoader while loading */}
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"                                                        element={<Index />} />
                    <Route path="/universities"                                            element={<Universities />} />
                    <Route path="/universities/:universityId"                              element={<Universities />} />
                    <Route path="/universities/:universityId/colleges/:collegeId"          element={<Universities />} />
                    <Route path="/services"                                                element={<Services />} />
                    <Route path="/jobs"                                                    element={<Jobs />} />
                    <Route path="/research"                                                element={<Research />} />
                    <Route path="/graduates"                                               element={<Graduates />} />
                    <Route path="/fees"                                                    element={<Fees />} />
                    <Route path="/announcements"                                           element={<Announcements />} />
                    <Route path="/chat"                                                    element={<Chat />} />
                    <Route path="/login"                                                   element={<Login />} />
                    <Route path="/signup"                                                  element={<Signup />} />
                    <Route path="/forgot-password"                                         element={<ForgotPassword />} />
                    <Route path="/dashboard"                                               element={<Dashboard />} />
                    <Route path="/profile"                                                 element={<Profile />} />
                    <Route path="/more"                                                    element={<More />} />
                    <Route path="/about"                                                   element={<About />} />
                    <Route path="*"                                                        element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
