import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthLayout from '@/components/layouts/AuthLayout';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import BetaSignupPage from '@/pages/BetaSignupPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import AuthCallbackPage from '@/pages/auth/AuthCallbackPage';

const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route index element={<LoginPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="beta-signup" element={<BetaSignupPage />} />
        <Route path="reset-password" element={<ForgotPasswordPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="update-password" element={<ResetPasswordPage />} />
        <Route path="callback" element={<AuthCallbackPage />} />
      </Route>
    </Routes>
  );
};

export default AuthRoutes;