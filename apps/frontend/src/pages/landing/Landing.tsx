import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing: React.FC = () => {
  return (
    <div className="bg-white">
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Ace your Ophthalmology Interviews
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Practice real scenarios, get AI feedback, and collaborate with peers to
              build confidence and mastery.
            </p>
            <div className="flex gap-4">
              <Link to="/register">
                <Button className="btn-primary">Get Started</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="btn-secondary">Log In</Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-blue-300/20 border border-gray-200" />
          </div>
        </div>
      </section>

      <section id="features" className="bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Feedback</h3>
              <p className="text-gray-600">Receive structured feedback on your clinical reasoning and communication.</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Peer Practice Rooms</h3>
              <p className="text-gray-600">Schedule or join sessions with colleagues and mentors.</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-gray-600">Track improvements over time with dashboards and history.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">What trainees say</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700 mb-3">“The structured practice boosted my confidence before interviews.”</p>
            <p className="text-gray-500 text-sm">— Ophthalmology Registrar</p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700 mb-3">“The AI feedback highlighted blind spots I didn’t know I had.”</p>
            <p className="text-gray-500 text-sm">— Specialty Trainee</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;


