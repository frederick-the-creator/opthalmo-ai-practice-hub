
import React from "react";
import { Navigate } from "react-router-dom";

const Index: React.FC = () => {
  // This component exists just to redirect to the landing page
  return <Navigate to="/" replace />;
};

export default Index;
