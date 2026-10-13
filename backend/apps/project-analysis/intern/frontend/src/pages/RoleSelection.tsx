import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, ArrowRight, Cpu, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Button } from '../components/ui/PremiumComponents';

export const RoleSelection: React.FC = () => {
  const { setRole } = useApp();
  const navigate = useNavigate();

  const handleSelectRole = (selectedRole: 'authority' | 'intern') => {
    setRole(selectedRole);
    if (selectedRole === 'authority') {
      navigate('/authority');
    } else {
      navigate('/intern');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-bgLight dark:bg-bgDark transition-colors duration-300 px-6 overflow-hidden">
      
      {/* Background blobs */}
      <div className="blob-container">
        <div className="blob bg-primary w-[300px] h-[300px] -left-20 top-20" />
        <div className="blob bg-accent w-[350px] h-[350px] -right-20 bottom-20" />
      </div>

      <div className="max-w-4xl w-full flex flex-col items-center relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.25)] mx-auto"
          >
            <Cpu className="text-white" size={24} />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-extrabold tracking-tight text-textPrimary-light dark:text-textPrimary-dark"
          >
            Select Your Workspace Profile
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-textSecondary-light dark:text-textSecondary-dark max-w-sm"
          >
            Choose your login workspace. Authorities write plans; Interns report work logs evaluated by AI.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl"
        >
          {/* Authority Card */}
          <motion.div variants={itemVariants}>
            <Card
              onClick={() => handleSelectRole('authority')}
              className="h-full flex flex-col justify-between p-8 border-t-4 border-t-primary/70 relative overflow-hidden group min-h-[280px]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
              
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-primary dark:text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <ShieldAlert size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-1.5">
                    Authority Login
                    <Sparkles size={14} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark leading-relaxed">
                    Create project assignments, publish work descriptions, track log submissions, and analyze score aggregations.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center gap-2 text-xs font-bold text-primary select-none mt-auto">
                <span>Access Authority Panel</span>
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Card>
          </motion.div>

          {/* Intern Card */}
          <motion.div variants={itemVariants}>
            <Card
              onClick={() => handleSelectRole('intern')}
              className="h-full flex flex-col justify-between p-8 border-t-4 border-t-accent/70 relative overflow-hidden group min-h-[280px]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors pointer-events-none" />
              
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-accent dark:text-purple-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Users size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-1.5">
                    Intern Portal
                    <Sparkles size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark leading-relaxed">
                    Read current work specifications, submit daily logs, upload execution logs, and analyze automated feedback reviews.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center gap-2 text-xs font-bold text-accent select-none mt-auto">
                <span>Access Intern Portal</span>
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-colors flex items-center gap-1.5"
          >
            ← Back to Landing Page
          </button>
        </motion.div>
      </div>
    </div>
  );
};
