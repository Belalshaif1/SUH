import { Toaster } from "@/components/ui/toaster"; // Import the default Toaster component for notifications
import { Toaster as Sonner } from "@/components/ui/sonner"; // Import the Sonner component for pop-up notifications
import { TooltipProvider } from "@/components/ui/tooltip"; // Import the TooltipProvider for managing tooltips
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Import React Query for data fetching and caching
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Import routing components for navigation
import { LanguageProvider } from "@/contexts/LanguageContext"; // Import LanguageProvider for multi-language support
import { ThemeProvider } from "@/contexts/ThemeContext"; // Import ThemeProvider for light/dark theme management
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider for user authentication context
import AppLayout from "@/components/layout/AppLayout"; // Import the main layout component for the app

import Index from "./pages/Index"; // Import the Index page component
import Universities from "./pages/Universities"; // Import the Universities page component
import Services from "./pages/Services"; // Import the Services page component
import Jobs from "./pages/Jobs"; // Import the Jobs page component
import Research from "./pages/Research"; // Import the Research page component
import Graduates from "./pages/Graduates"; // Import the Graduates page component
import Fees from "./pages/Fees"; // Import the Fees page component
import Announcements from "./pages/Announcements"; // Import the Announcements page component
import Chat from "./pages/Chat"; // Import the Chat page component
import Login from "./pages/Login"; // Import the Login page component
import Signup from "./pages/Signup"; // Import the Signup page component
import ForgotPassword from "./pages/ForgotPassword"; // Import the ForgotPassword page component
import Dashboard from "./pages/Dashboard"; // Import the Dashboard page component
import Profile from "./pages/Profile"; // Import the Profile page component
import More from "./pages/More"; // Import the More page component
import About from "./pages/About"; // Import the About page component
import NotFound from "./pages/NotFound"; // Import the NotFound page component

const queryClient = new QueryClient(); // Create a new QueryClient instance for managing data caching

const App = () => ( // Define the main App component
  <QueryClientProvider client={queryClient}> {/* Provide the QueryClient to the entire app */}
    <LanguageProvider> {/* Provide the Language context to the app */}
      <ThemeProvider> {/* Provide the Theme context to the app */}
        <AuthProvider> {/* Provide the Authentication context to the app */}
          <TooltipProvider> {/* Provide the Tooltip context to the app */}
            <Toaster /> {/* Render the default Toaster notifications */}
            <Sonner /> {/* Render the Sonner pop-up notifications */}
            <BrowserRouter> {/* Enable routing using the BrowserRouter */}
              <AppLayout> {/* Wrap the app with the main layout */}
                <Routes> {/* Define the routes for the app */}
                  <Route path="/" element={<Index />} /> {/* Route for the Index page */}
                  <Route path="/universities" element={<Universities />} /> {/* Route for the Universities page */}
                  <Route path="/universities/:universityId" element={<Universities />} /> {/* Route for a specific university */}
                  <Route path="/universities/:universityId/colleges/:collegeId" element={<Universities />} /> {/* Route for a specific college */}
                  <Route path="/services" element={<Services />} /> {/* Route for the Services page */}
                  <Route path="/jobs" element={<Jobs />} /> {/* Route for the Jobs page */}
                  <Route path="/research" element={<Research />} /> {/* Route for the Research page */}
                  <Route path="/graduates" element={<Graduates />} /> {/* Route for the Graduates page */}
                  <Route path="/fees" element={<Fees />} /> {/* Route for the Fees page */}
                  <Route path="/announcements" element={<Announcements />} /> {/* Route for the Announcements page */}
                  <Route path="/chat" element={<Chat />} /> {/* Route for the Chat page */}
                  <Route path="/login" element={<Login />} /> {/* Route for the Login page */}
                  <Route path="/signup" element={<Signup />} /> {/* Route for the Signup page */}
                  <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Route for the ForgotPassword page */}
                  <Route path="/dashboard" element={<Dashboard />} /> {/* Route for the Dashboard page */}
                  <Route path="/profile" element={<Profile />} /> {/* Route for the Profile page */}
                  <Route path="/more" element={<More />} /> {/* Route for the More page */}
                  <Route path="/about" element={<About />} /> {/* Route for the About page */}
                  <Route path="*" element={<NotFound />} /> {/* Route for undefined paths */}
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
); // End of the App component

export default App; // Export the App component for use in other files
