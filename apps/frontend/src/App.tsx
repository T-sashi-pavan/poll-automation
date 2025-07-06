import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoadingProvider } from "./contexts/LoadingContext";

import LoadingScreen from "./components/LoadingScreen";

// Public pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import GuestPage from "./pages/guest/GuestPage";
import ContactUs from "./pages/ContactUs";

// Host dashboard pages
import HostDashboard from "./pages/HostDashboard";
import AudioCapture from "./pages/AudioCapture";
import AIQuestionFeed from "./pages/AIQuestionFeed";
import CreateManualPoll from "./pages/CreateManualPoll";
import CreatePollPage from "./pages/CreatePollPage";
import Participants from "./pages/Participants";
import Leaderboard from "./pages/Leaderboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// Student dashboard layout
import StudentDashboard from "./pages/StudentDashboard";

// Student pages (nested under /student)
import DashboardHomePage from "./components/student/DashboardHomePage";
import JoinPollPage from "./components/student/JoinPollPage";
import PollHistoryPage from "./components/student/PollHistoryPage";
import PollQuestionsPage from "./components/student/PollQuestionsPage";
import StudentProfilePage from "./components/student/StudentProfilePage";
import AchievementPage from "./components/student/AchievementPage";
import NotificationPage from "./components/student/NotificationPage";
import SettingsStudent from "./components/student/Settings";
import StudentLeaderboard from "./components/student/StudentLeaderboard";
import ChangePassword from "./components/student/ChangePassword";
import ActiveSessions from "./components/student/ActiveSessions";

// Utility / test pages
import WebSocketTest from "./pages/WebSocketTest";
import RealTimeDataDemo from "./pages/RealTimeDataDemo";
import TestPollPage from "./pages/TestPollPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
              <LoadingScreen />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/contactUs" element={<ContactUs />} />
                <Route path="/guest" element={<GuestPage />} />

                {/* Host Routes */}
                <Route path="/host" element={<HostDashboard />} />
                <Route path="/host/audio" element={<AudioCapture />} />
                <Route path="/host/ai-questions" element={<AIQuestionFeed />} />
                <Route path="/host/create-manual-poll" element={<CreateManualPoll />} />
                <Route path="/host/create-poll" element={<CreatePollPage />} />
                <Route path="/host/participants" element={<Participants />} />
                <Route path="/host/leaderboard" element={<Leaderboard />} />
                <Route path="/host/reports" element={<Reports />} />
                <Route path="/host/settings" element={<Settings />} />

                {/* Student Routes with nested layout */}
                <Route path="/student" element={<StudentDashboard />}>
                  <Route index element={<DashboardHomePage />} />
                  <Route path="join" element={<JoinPollPage />} />
                  <Route path="history" element={<PollHistoryPage />} />
                  <Route path="poll-questions" element={<PollQuestionsPage roomCode="" />} />
                  <Route path="profile" element={<StudentProfilePage />} />
                  <Route path="achievements" element={<AchievementPage />} />
                  <Route path="notifications" element={<NotificationPage />} />
                  <Route path="settings" element={<SettingsStudent />} />
                  <Route path="leaderboard" element={<StudentLeaderboard />} />
                  <Route path="change-password" element={<ChangePassword />} />
                  <Route path="active-sessions" element={<ActiveSessions />} />
                </Route>

                {/* Test & Utility Routes */}
                <Route path="/websocket-test" element={<WebSocketTest />} />
                <Route path="/realtime-demo" element={<RealTimeDataDemo />} />
                <Route path="/test-poll" element={<TestPollPage />} />
              </Routes>
            </div>
          </Router>
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
