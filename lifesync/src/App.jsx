// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Choose from './components/Choose';
import Services from './components/Services';
import Footer from './components/Footer';
import Signup from './components/Signup';
import Login from './components/Login';
import ContactForm from "./components/ContactForm";
import Dashboard from './components/Dashboard';
import Chatbot from './components/AIChatbot/Chatbot';
import LifesyncChatbot from './components/AIChatbot/chatbotLifesync';
import Journal from './components/reflectionSpace/Journal';
import Profile from './components/Profile';
import Wellness from './components/Wellness';
import TimeTrackerProvider from './components/TimeTrackerContext';
import FAQs from './components/FAQs';
import Feedback from './components/Feedback';
import TimeCapsule from './components/timeCapsule/TimeCapsule';
import Logs from './components/Blockchain/Logs';
import Report from './components/reportGeneration/Report';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { auth } from './firebaseConfig';
import LogService from './Services/LogService';
import { onAuthStateChanged } from 'firebase/auth';

function useNavigationLogger() {
  const location = useLocation();

  useEffect(() => {
    const logNavigation = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const authRelatedPaths = ["/login", "/signup"];

      try {
        const idToken = await user.getIdToken();

        // Only log real navigation events, not login/logout pages
        if (!authRelatedPaths.includes(location.pathname)) {
          await LogService.sendLog(`Visited ${location.pathname}`, idToken);
          console.log(`✅ Logged navigation: ${location.pathname}`);
        }
      } catch (err) {
        console.error("❌ Log failed:", err);
      }
    };

    logNavigation();
  }, [location]);
}

function useAuthLogger() {
  useEffect(() => {
    let previousUser = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        // Login
        if (user && !previousUser) {
          const idToken = await user.getIdToken();
          await LogService.sendLog("User Logged In", idToken);
          console.log("✅ Logged: User Logged In");
          previousUser = user;
        }

        // Logout
        if (!user && previousUser) {
          const idToken = await previousUser.getIdToken();
          await LogService.sendLog("User Logged Out", idToken);
          console.log("✅ Logged: User Logged Out");
          previousUser = null;
        }
      } catch (err) {
        console.error("❌ Auth log failed:", err);
      }
    });

    return () => unsubscribe();
  }, []);
}

function MainApp() {
  useNavigationLogger();
  useAuthLogger();

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<><Hero /><About /><Choose /><Services /><Feedback /><Footer /></>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/contact" element={<ContactForm />} />
        <Route path="/dashboard/*" element={<Dashboard />}>
          <Route path="profile" element={<Profile />} />
          <Route path="wellness" element={<Wellness />} />
          <Route path="journal" element={<Journal />} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="timecapsule" element={<TimeCapsule />} />
          <Route path="systemlogs" element={<Logs />} />
          <Route path="report" element={<Report />} />
          <Route path="lifesync-chatbot" element={<LifesyncChatbot />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <TimeTrackerProvider>
      <MainApp />
    </TimeTrackerProvider>
  );
}
