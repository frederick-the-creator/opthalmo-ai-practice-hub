import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/services/database/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Record login timestamp for TTL enforcement
    try {
      localStorage.setItem('loginAt', String(Date.now()));
    } catch (_e) {}

    // Let AuthProvider handle profile redirect if needed; otherwise go to dashboard
    setIsLoading(false);
    navigate('/dashboard');
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Eye className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your OphthalmoPrep account</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
