import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Public self-registration is disabled in NER LogiSense.
 * User account provisioning is restricted to authorized platform administrators.
 */
export const RegisterPage: React.FC = () => {
  return <Navigate to="/login" replace />;
};
