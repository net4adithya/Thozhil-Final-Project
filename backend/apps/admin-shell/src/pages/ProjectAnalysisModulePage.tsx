import React from 'react';
import { ModuleFrame } from '../components/ModuleFrame';

export const ProjectAnalysisModulePage: React.FC = () => {
  return (
    <ModuleFrame
      moduleName="AI Project Analyser"
      originalProject="project_c_intern (LogLense)"
      targetPort={5032}
      targetUrl="http://localhost:5032"
      techStack="React 19 TS / Express Node API / Python FastAPI / Supabase PG"
      description="Original Project C: Provides intern daily work log submissions with multipart code attachments, multi-provider AI code evaluation cards, Web Speech TTS feedback, and manager risk assessment dashboards."
    />
  );
};
