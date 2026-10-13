import React from 'react';
import { ModuleFrame } from '../components/ModuleFrame';

export const CodingModulePage: React.FC = () => {
  return (
    <ModuleFrame
      moduleName="AI Coding Interviewer"
      originalProject="project_d (AI Coding Interviewer)"
      targetPort={5041}
      targetUrl="http://localhost:5041"
      techStack="Vue 3 / React 18 / NestJS / FastAPI / Docker Sandbox / Prisma"
      description="Original Project D: Provides Monaco IDE coding workspace, 12-language AST static code analysis, automated Gemini AI review calculation, random candidate access codes, and isolated Docker execution."
    />
  );
};
