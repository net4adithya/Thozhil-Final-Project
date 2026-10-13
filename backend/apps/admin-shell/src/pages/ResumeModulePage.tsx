import React from 'react';
import { ModuleFrame } from '../components/ModuleFrame';

export const ResumeModulePage: React.FC = () => {
  return (
    <ModuleFrame
      moduleName="AI Resume Screener"
      originalProject="project_b (AI Resume Screener)"
      targetPort={5020}
      targetUrl="http://localhost:5020"
      techStack="Vanilla JS / HTML5 / Python FastAPI / SQLite"
      description="Original Project B: Provides drag-and-drop batch PDF/DOCX resume uploading, asynchronous screening via Gemini LLM or local TF-IDF & taxonomy NLP engine, and dynamic ReportLab PDF resume generation."
    />
  );
};
