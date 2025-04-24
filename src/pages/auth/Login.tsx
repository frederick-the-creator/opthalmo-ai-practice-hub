
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Eye } from "lucide-react";

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Eye className="h-10 w-10 text-brand-blue" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your OphthalmoPrep account</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form className="space-y-5">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your.email@example.com" required />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-brand-blue hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            
            <Button type="submit" className="w-full bg-brand-blue">
              Sign In
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-blue hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
