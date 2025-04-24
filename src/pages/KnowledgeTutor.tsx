
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Brain, 
  Pill, 
  Stethoscope,
  BookOpen,
  ClipboardList,
  Eye,
  HelpCircle,
  Loader2,
  X,
  Plus
} from "lucide-react";

const KnowledgeTutor: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 1500);
  };

  // Mock flashcard sets
  const flashcardSets = [
    { id: 1, title: "Glaucoma Essentials", cardCount: 24, lastReviewed: "Yesterday" },
    { id: 2, title: "Retinal Disorders", cardCount: 36, lastReviewed: "3 days ago" },
    { id: 3, title: "Anterior Segment", cardCount: 18, lastReviewed: "1 week ago" },
    { id: 4, title: "Ophthalmic Medications", cardCount: 42, lastReviewed: "2 weeks ago" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Knowledge Tutor</h1>
        <p className="text-gray-600">Get explanations for ophthalmology conditions and test your knowledge</p>
      </div>

      <Tabs defaultValue="tutor" className="mb-8">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="tutor">
            <Brain className="mr-2 h-4 w-4" />
            Tutor
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <BookOpen className="mr-2 h-4 w-4" />
            Flashcards
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tutor" className="mt-6">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Brain className="h-5 w-5 mr-2 text-brand-purple" />
                Ask the AI Tutor
              </CardTitle>
              <CardDescription>
                Ask about any ophthalmology condition or concept
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="e.g., Diabetic retinopathy, Glaucoma types..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!query.trim() || isSearching}
                  className="bg-brand-purple hover:bg-purple-600"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
                </Button>
              </form>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuery("Diabetic retinopathy management")}>
                  Diabetic retinopathy
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuery("NICE guidelines for glaucoma")}>
                  NICE guidelines for glaucoma
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuery("AMD treatment options")}>
                  AMD treatment options
                </Button>
              </div>
            </CardContent>
          </Card>

          {hasSearched && (
            <Card className="border-t-4 border-t-brand-purple animate-fade-in">
              <CardHeader>
                <CardTitle className="text-xl">Diabetic Retinopathy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg flex items-center text-gray-800">
                    <HelpCircle className="h-5 w-5 mr-2 text-brand-purple" />
                    Overview
                  </h3>
                  <p className="mt-2 text-gray-700">
                    Diabetic Retinopathy (DR) is a microvascular complication of diabetes mellitus that affects the blood vessels in the retina. It's one of the leading causes of preventable blindness in working-age adults in the UK.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg flex items-center text-gray-800">
                    <Stethoscope className="h-5 w-5 mr-2 text-brand-blue" />
                    Symptoms
                  </h3>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    <li>• Early stages often asymptomatic</li>
                    <li>• Blurred vision</li>
                    <li>• Fluctuating vision</li>
                    <li>• Impaired color vision</li>
                    <li>• Dark or empty areas in vision</li>
                    <li>• Sudden vision loss (advanced cases)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg flex items-center text-gray-800">
                    <Eye className="h-5 w-5 mr-2 text-brand-blue" />
                    Investigations
                  </h3>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    <li>• Visual acuity testing</li>
                    <li>• Slit lamp biomicroscopy with fundoscopy</li>
                    <li>• Optical Coherence Tomography (OCT)</li>
                    <li>• Fundus Fluorescein Angiography (FFA)</li>
                    <li>• Diabetic retinopathy screening photography</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg flex items-center text-gray-800">
                    <ClipboardList className="h-5 w-5 mr-2 text-brand-green" />
                    Management
                  </h3>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    <li>• Glycaemic control (HbA1c target < 48 mmol/mol / 6.5%)</li>
                    <li>• Blood pressure control (target < 130/80 mmHg)</li>
                    <li>• Lipid management</li>
                    <li>• Laser photocoagulation for proliferative DR</li>
                    <li>• Anti-VEGF injections for diabetic macular oedema</li>
                    <li>• Vitrectomy for complications (vitreous haemorrhage, tractional retinal detachment)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg flex items-center text-gray-800">
                    <Pill className="h-5 w-5 mr-2 text-brand-purple" />
                    UK Guidelines
                  </h3>
                  <p className="mt-2 text-gray-700">
                    According to the Royal College of Ophthalmologists Guidelines:
                  </p>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    <li>• Annual screening for all diabetic patients</li>
                    <li>• Referral to ophthalmology if any retinopathy is detected</li>
                    <li>• Urgent referral if proliferative DR or macular oedema</li>
                    <li>• More frequent monitoring during pregnancy</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50 flex justify-between">
                <Button variant="outline" size="sm" className="text-red-600">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button size="sm" className="bg-brand-purple hover:bg-purple-600">
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Flashcards
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="flashcards" className="space-y-6 mt-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-brand-blue" />
                Your Flashcard Sets
              </CardTitle>
              <CardDescription>
                Review and test your knowledge with spaced repetition
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {flashcardSets.map((set) => (
                  <li key={set.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <h3 className="font-medium">{set.title}</h3>
                      <div className="flex text-sm text-gray-500">
                        <span>{set.cardCount} cards</span>
                        <span className="mx-2">•</span>
                        <span>Last studied: {set.lastReviewed}</span>
                      </div>
                    </div>
                    <Button className="bg-brand-blue">Study</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t">
              <Button className="w-full flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Create New Flashcard Set
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Brain className="h-5 w-5 mr-2 text-brand-purple" />
                Suggested Flashcards
              </CardTitle>
              <CardDescription>
                Based on your weak areas and recent practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div>
                    <h3 className="font-medium">Diabetic Retinopathy Flashcards</h3>
                    <p className="text-sm text-gray-500">Generated from your practice sessions</p>
                  </div>
                  <Button variant="outline">Add</Button>
                </li>
                <li className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div>
                    <h3 className="font-medium">Glaucoma Management Guidelines</h3>
                    <p className="text-sm text-gray-500">Based on curriculum weaknesses</p>
                  </div>
                  <Button variant="outline">Add</Button>
                </li>
                <li className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div>
                    <h3 className="font-medium">Breaking Bad News Techniques</h3>
                    <p className="text-sm text-gray-500">From communication skills practice</p>
                  </div>
                  <Button variant="outline">Add</Button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeTutor;
