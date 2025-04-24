
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle, AlertCircle, BookOpen } from "lucide-react";

const Curriculum: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock curriculum data
  const curriculumSections = [
    {
      id: 1,
      title: "Clinical Assessment",
      topics: [
        { id: 101, name: "Cataract Assessment", progress: 85, strength: "high" },
        { id: 102, name: "Glaucoma Assessment", progress: 45, strength: "medium" },
        { id: 103, name: "Diabetic Retinopathy", progress: 30, strength: "low" },
        { id: 104, name: "Retinal Detachment", progress: 60, strength: "medium" },
        { id: 105, name: "Age-related Macular Degeneration", progress: 75, strength: "high" },
      ]
    },
    {
      id: 2,
      title: "Communication Skills",
      topics: [
        { id: 201, name: "Breaking Bad News", progress: 40, strength: "low" },
        { id: 202, name: "Explaining Surgery Risks", progress: 65, strength: "medium" },
        { id: 203, name: "Consent for Treatment", progress: 90, strength: "high" },
        { id: 204, name: "Managing Patient Expectations", progress: 55, strength: "medium" },
        { id: 205, name: "Difficult Conversations", progress: 35, strength: "low" },
      ]
    },
    {
      id: 3,
      title: "Surgical Skills",
      topics: [
        { id: 301, name: "Pre-operative Assessment", progress: 70, strength: "medium" },
        { id: 302, name: "Surgical Complications", progress: 50, strength: "medium" },
        { id: 303, name: "Post-operative Management", progress: 80, strength: "high" },
      ]
    },
    {
      id: 4,
      title: "Professional Skills",
      topics: [
        { id: 401, name: "Leadership Scenarios", progress: 55, strength: "medium" },
        { id: 402, name: "Ethical Dilemmas", progress: 60, strength: "medium" },
        { id: 403, name: "Clinical Governance", progress: 40, strength: "low" },
        { id: 404, name: "Teaching and Education", progress: 75, strength: "high" },
      ]
    },
  ];

  // Filter topics based on search
  const filteredSections = curriculumSections.map(section => ({
    ...section,
    topics: section.topics.filter(topic => 
      topic.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.topics.length > 0);

  // Helper function to get badge color based on strength
  const getStrengthBadge = (strength: string) => {
    switch(strength) {
      case "high":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Strong</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Moderate</Badge>;
      case "low":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Needs Work</Badge>;
      default:
        return null;
    }
  };

  // Helper function to get progress color based on strength
  const getProgressColor = (strength: string) => {
    switch(strength) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Curriculum</h1>
          <p className="text-gray-600">Track your progress through the ophthalmology curriculum</p>
        </div>

        <div className="mt-4 md:mt-0 relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search topics..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Topics</TabsTrigger>
          <TabsTrigger value="weak">Need Improvement</TabsTrigger>
          <TabsTrigger value="mastered">Mastered</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredSections.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">No topics found</h2>
          <p className="mt-2 text-gray-500">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {section.topics.map((topic) => (
                    <li key={topic.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div className="flex items-center mb-2 sm:mb-0">
                          {topic.strength === "high" ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                          )}
                          <span className="font-medium">{topic.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{topic.progress}%</span>
                          {getStrengthBadge(topic.strength)}
                        </div>
                      </div>
                      <Progress value={topic.progress} className={`h-1.5 ${getProgressColor(topic.strength)}`} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Curriculum;
