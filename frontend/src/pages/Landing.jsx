import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Award, Shield, Users, ArrowRight, Laptop, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Landing = () => {
  const navigate = useNavigate();

  const features = [
    { title: 'Structured Assessments', desc: 'Structured video playbacks conduct structured, conversational dialogue assessments.', icon: Video },
    { title: 'Secure Video Capture', desc: 'High-definition video processing with audio transcription layers.', icon: Video },
    { title: 'Skill Vector Scoring', desc: 'Detailed analytics and match radar maps compiled within minutes of submittal.', icon: Award },
    { title: 'Enterprise Controls', desc: 'Complete role mapping, custom question libraries, and ATS integration.', icon: Shield }
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 sm:px-12 lg:px-20 text-center select-none bg-gradient-to-b from-white to-brandBg">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Video className="w-3.5 h-3.5" />
            <span>Next-Generation Recruiting</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brandHeading tracking-tight leading-[1.1]">
            Conduct Structured & <br />
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Conversational Interviews</span>
          </h1>

          <p className="text-base sm:text-lg text-brandBody max-w-2xl mx-auto leading-relaxed">
            Screen thousands of candidates efficiently. Conduct high-fidelity asynchronous assessments, scoring capabilities, and comprehensive reporting.
          </p>

          <div className="pt-4 flex items-center justify-center space-x-4">
            <Button
              onClick={() => navigate('/recruiter')}
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
            >
              Start Free Trial
            </Button>
            <Button
              onClick={() => navigate('/candidate')}
              variant="secondary"
              size="lg"
            >
              Take Practice Exam
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto select-none">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold text-brandHeading tracking-tight">Built for scale. Backed by science.</h2>
          <p className="text-sm text-brandBody max-w-lg mx-auto">Standardize assessments across your company engineering, product, and marketing organizations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-white border border-brandBorder rounded-2xl p-6 text-left space-y-4 hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-primary w-fit">
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-brandHeading">{feat.title}</h3>
              <p className="text-xs text-brandBody leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mock Pricing Section */}
      <section className="bg-white border-t border-b border-brandBorder py-20 px-6 sm:px-12 lg:px-20 select-none">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-extrabold text-brandHeading tracking-tight">Simple, transparent pricing</h2>
            <p className="text-sm text-brandBody">Choose a plan configured for your organization sizes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8 items-stretch">
            {/* Standard */}
            <div className="border border-brandBorder rounded-2xl p-8 flex flex-col justify-between text-left space-y-6">
              <div className="space-y-2">
                <h4 className="text-base font-bold text-brandHeading">Growth</h4>
                <p className="text-xs text-brandBody leading-relaxed">Perfect for scaling startups.</p>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-brandHeading">$149</span>
                  <span className="text-xs text-brandBody"> / month</span>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-brandBody">
                {['Up to 5 active openings', '100 applicant review credits', 'Standard skill breakdown analytics', 'Shareable candidate reports'].map((item) => (
                  <li key={item} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brandSuccess shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button onClick={() => navigate('/recruiter')} variant="secondary" className="w-full">
                Get Started
              </Button>
            </div>

            {/* Enterprise */}
            <div className="border-2 border-primary rounded-2xl p-8 flex flex-col justify-between text-left space-y-6 relative shadow-lg">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-[10px] uppercase font-extrabold tracking-wider px-3.5 py-1 rounded-full">
                RECOMMENDED
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-brandHeading">Enterprise Pro</h4>
                <p className="text-xs text-brandBody leading-relaxed">For large recruitment organizations.</p>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-brandHeading">$499</span>
                  <span className="text-xs text-brandBody"> / month</span>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-brandBody">
                {['Unlimited active openings', 'Unlimited candidate completions', 'Custom question bank designer', 'API integrations / webhook access', 'Priority support channels'].map((item) => (
                  <li key={item} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button onClick={() => navigate('/recruiter')} variant="primary" className="w-full">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
