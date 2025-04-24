
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Eye } from "lucide-react";

const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Eye className="h-10 w-10 text-brand-blue" />
          </div>
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>Start your ophthalmology interview preparation journey</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" required />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" required />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your.email@example.com" required />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="trainingLevel">Training Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select your training level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical-student">Medical Student</SelectItem>
                  <SelectItem value="foundation">Foundation Doctor</SelectItem>
                  <SelectItem value="st1-applicant">ST1 Applicant</SelectItem>
                  <SelectItem value="st1">ST1</SelectItem>
                  <SelectItem value="st2">ST2</SelectItem>
                  <SelectItem value="st3">ST3</SelectItem>
                  <SelectItem value="st4-and-above">ST4 and above</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full bg-brand-blue mt-6">
              Create Account
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-blue hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
