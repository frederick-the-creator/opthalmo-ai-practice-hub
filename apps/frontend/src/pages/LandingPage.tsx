
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  BookOpen, 
  Brain, 
  Users, 
  BarChart, 
  CheckCircle,
  Star
} from "lucide-react";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Master Your Ophthalmology Interview Skills
            </h1>
            <p className="text-lg md:text-xl mb-8">
              AI-powered interview practice, personalized feedback, and community support to help you excel in ophthalmology interviews.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-white text-brand-blue hover:bg-gray-100">
                  Get Started
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-brand-blue">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Comprehensive Preparation Platform</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to succeed in your ophthalmology interviews in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card">
              <div className="rounded-full bg-brand-light-blue p-3 inline-flex mb-4">
                <Video className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interview Practice</h3>
              <p className="text-gray-600">
                Practice real clinical and communication stations with peers or AI, with instant feedback.
              </p>
            </div>

            <div className="feature-card">
              <div className="rounded-full bg-brand-light-green p-3 inline-flex mb-4">
                <BarChart className="h-6 w-6 text-brand-green" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Dashboard</h3>
              <p className="text-gray-600">
                Track your progress, identify weaknesses, and focus your preparation effectively.
              </p>
            </div>

            <div className="feature-card">
              <div className="rounded-full bg-purple-100 p-3 inline-flex mb-4">
                <BookOpen className="h-6 w-6 text-brand-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Curriculum Coverage</h3>
              <p className="text-gray-600">
                Complete curriculum aligned to UK ophthalmology training requirements.
              </p>
            </div>

            <div className="feature-card">
              <div className="rounded-full bg-purple-100 p-3 inline-flex mb-4">
                <Brain className="h-6 w-6 text-brand-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Knowledge Tutor</h3>
              <p className="text-gray-600">
                AI-powered tutor to explain ophthalmology concepts and test your knowledge.
              </p>
            </div>

            <div className="feature-card">
              <div className="rounded-full bg-brand-light-blue p-3 inline-flex mb-4">
                <Users className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Practice</h3>
              <p className="text-gray-600">
                Connect with peers to practice together and share insights.
              </p>
            </div>

            <div className="feature-card">
              <div className="rounded-full bg-brand-light-green p-3 inline-flex mb-4">
                <CheckCircle className="h-6 w-6 text-brand-green" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Coaching</h3>
              <p className="text-gray-600">
                Coming soon: Book sessions with experienced ophthalmologists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform makes interview preparation seamless and effective
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-100 rounded-xl p-8 w-full md:w-1/2">
              <ol className="space-y-6">
                <li className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-brand-blue text-white font-bold">1</div>
                  <div className="ml-4">
                    <h3 className="font-medium text-lg">Sign up & create your profile</h3>
                    <p className="text-gray-600">Tell us about your training level and goals.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-brand-blue text-white font-bold">2</div>
                  <div className="ml-4">
                    <h3 className="font-medium text-lg">Practice interviews</h3>
                    <p className="text-gray-600">Join the community or practice with friends.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-brand-blue text-white font-bold">3</div>
                  <div className="ml-4">
                    <h3 className="font-medium text-lg">Get AI feedback</h3>
                    <p className="text-gray-600">Instant analysis of your performance.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-brand-blue text-white font-bold">4</div>
                  <div className="ml-4">
                    <h3 className="font-medium text-lg">Target weak areas</h3>
                    <p className="text-gray-600">Study with our Knowledge Tutor.</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="w-full md:w-1/2 h-64 md:h-80 bg-gray-300 rounded-xl flex items-center justify-center">
              <p className="text-gray-600">Mockup Video/Demo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50" id="testimonials">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">What Candidates Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from candidates who've used our platform to succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                </div>
                <div>
                  <h4 className="font-semibold">Dr. Sarah J.</h4>
                  <p className="text-sm text-gray-500">ST3 Ophthalmology</p>
                </div>
              </div>
              <div className="mb-3 flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600">
                "The AI feedback was incredibly helpful. It pointed out communication patterns I wasn't aware of and helped me improve my interview technique dramatically."
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                </div>
                <div>
                  <h4 className="font-semibold">Dr. Michael T.</h4>
                  <p className="text-sm text-gray-500">Recently appointed ST1</p>
                </div>
              </div>
              <div className="mb-3 flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600">
                "I practiced over 30 stations on OphthalmoPrep before my interview. The variety of cases and detailed feedback helped me feel confident and prepared."
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                </div>
                <div>
                  <h4 className="font-semibold">Dr. Aisha K.</h4>
                  <p className="text-sm text-gray-500">ST2 Ophthalmology</p>
                </div>
              </div>
              <div className="mb-3 flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600">
                "The Knowledge Tutor helped me quickly fill gaps in my understanding. Being able to practice with peers also made a huge difference to my confidence."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Interview Preparation?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of ophthalmology candidates preparing smarter with OphthalmoPrep.
            </p>
            <Link to="/register">
              <Button size="lg" className="btn-primary">Create Your Account</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
