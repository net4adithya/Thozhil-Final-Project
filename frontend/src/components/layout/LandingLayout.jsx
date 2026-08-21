import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Laptop, Cpu, Shield, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const HyringLogo = ({ className = "h-8 w-auto text-primary" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 137 46" className={className}>
    <path fill="currentColor" d="M37.71 35V9.42h4.264v10.445a6.47 6.47 0 0 1 2.416-2.31q1.527-.887 3.446-.887 2.203 0 3.73.923 1.529.888 2.31 2.665.816 1.74.817 4.37V35h-4.228v-9.983q0-2.31-.995-3.518-.96-1.207-2.949-1.207-1.278 0-2.309.639-1.03.604-1.634 1.776-.604 1.137-.604 2.807V35zm21.668 7.816 4.37-9.806h-1.066L55.54 17.095h4.654l5.33 12.15 5.044-12.15h4.512L63.89 42.816zM76.745 35V17.094h3.802l.39 3.34a7 7 0 0 1 1.6-1.99 6.8 6.8 0 0 1 2.238-1.314q1.314-.462 2.877-.462v4.512H86.16q-1.065 0-2.025.284-.96.249-1.67.853-.675.567-1.065 1.598-.391.995-.391 2.523V35zm12.878 0V17.094h4.263V35zm2.131-20.748q-1.171 0-1.954-.71a2.47 2.47 0 0 1-.746-1.813q.001-1.101.746-1.776.783-.71 1.954-.71 1.173 0 1.919.71.782.675.782 1.776 0 1.066-.782 1.812-.746.71-1.919.71M97.393 35V17.094h3.766l.32 2.984a6.23 6.23 0 0 1 2.344-2.487q1.529-.924 3.624-.923 2.168 0 3.695.923 1.528.888 2.345 2.63.853 1.74.853 4.334V35h-4.264V24.946q0-2.239-.994-3.447-.996-1.207-2.949-1.207-1.28 0-2.31.603-.995.604-1.598 1.777-.569 1.136-.569 2.771V35zm27.552 8.243q-2.522 0-4.441-.64-1.882-.604-2.949-1.883-1.03-1.243-1.03-3.126 0-1.102.533-2.168.569-1.03 1.67-1.918 1.137-.924 2.878-1.599l1.883 2.06q-1.706.605-2.381 1.457-.675.854-.675 1.741 0 .924.569 1.528.603.639 1.598.96 1.03.319 2.31.319 1.243 0 2.167-.355.924-.32 1.421-.924.533-.604.533-1.457 0-1.065-.746-1.74-.745-.64-2.949-.782a34 34 0 0 1-3.304-.391 19 19 0 0 1-2.451-.64 9.6 9.6 0 0 1-1.706-.781 7.3 7.3 0 0 1-1.172-.924v-.817l3.73-3.908 3.162 1.03-4.192 4.086 1.101-2.06q.356.248.711.461.39.214.959.391.605.143 1.563.284.96.143 2.487.285 2.38.177 3.873.852 1.492.675 2.203 1.812t.71 2.736q0 1.563-.888 2.949-.853 1.385-2.629 2.273-1.776.89-4.548.889m0-13.608q-2.238 0-3.872-.852-1.599-.889-2.452-2.345a6.5 6.5 0 0 1-.852-3.269q0-1.812.852-3.268.853-1.457 2.452-2.345 1.634-.888 3.872-.888t3.837.888 2.452 2.345q.852 1.455.852 3.268a6.5 6.5 0 0 1-.852 3.269q-.853 1.456-2.452 2.345-1.599.852-3.837.852m0-3.304q1.528 0 2.452-.817t.923-2.345q0-1.527-.923-2.31-.924-.816-2.452-.816-1.527 0-2.487.817-.959.78-.959 2.31 0 1.527.959 2.344.96.817 2.487.817m2.949-6.11-.817-3.127h7.354v2.665zM9.057 7.7c.866 0 1.567.7 1.567 1.564v10.82a15.83 15.83 0 0 1 4.684-7.62c1.908-1.655 3.948-2.789 6.279-3.53l3.706-1.177c.664-.21 1.354.26 1.354.93v8.45c0 .424-.287.8-.706.93l-5.211 1.637c3.275.633 5.915 3.495 5.915 7.153v7.862a1.6 1.6 0 0 1-1.601 1.598H17.62a1.6 1.6 0 0 1-1.601-1.598V23.947a15.83 15.83 0 0 1-4.681 7.61c-1.909 1.655-3.948 2.79-6.278 3.53l-3.71 1.178c-.664.213-1.35-.26-1.35-.93v-8.45c0-.425.285-.8.704-.93l5.22-1.642C2.647 23.684 0 20.821 0 17.16V9.264c0-.865.701-1.565 1.567-1.565z" />
  </svg>
);

export const LandingLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brandBg flex flex-col font-sans">
      {/* Landing Navbar */}
      <header className="h-18 bg-white/90 backdrop-blur-md border-b border-brandBorder sticky top-0 z-[99] flex items-center justify-between px-6 md:px-12">
        <Link to="/" className="flex items-center space-x-2 text-primary hover:opacity-90">
          <HyringLogo className="h-7 w-auto text-primary" />
          <span className="text-[9px] uppercase font-extrabold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md ml-1 select-none">
            PLATFORM
          </span>
        </Link>

        {/* Center menu links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-brandBody">
          <Link to="/recruiter" className="hover:text-primary transition-colors">Employers</Link>
          <Link to="/candidate" className="hover:text-primary transition-colors">Jobseekers</Link>
          <Link to="/recruiter/templates" className="hover:text-primary transition-colors">Recruiting Partners</Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-3.5">
          <Link
            to="/candidate"
            className="text-sm font-semibold text-brandBody hover:text-brandHeading transition-colors px-3 py-2"
          >
            Practice Sandbox
          </Link>
          <Button onClick={() => navigate('/recruiter')} variant="primary" size="sm">
            Recruiter Portal
          </Button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Landing Footer */}
      <footer className="bg-white border-t border-brandBorder py-8 px-6 md:px-12 text-center text-xs text-brandBody select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-primary">
            <HyringLogo className="h-5 w-auto text-primary" />
            <span className="font-bold text-brandHeading ml-1">Video Interviewer</span>
          </div>
          <p>© 2026 Video Interviewer. All rights reserved. Enterprise automated recruiting system.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-brandHeading">Privacy Policy</a>
            <a href="#" className="hover:text-brandHeading">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
