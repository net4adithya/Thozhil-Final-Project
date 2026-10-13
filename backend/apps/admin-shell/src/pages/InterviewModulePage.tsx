import React from 'react';
import { ModuleFrame } from '../components/ModuleFrame';

export const InterviewModulePage: React.FC = () => {
  return (
    <ModuleFrame
      moduleName="AI Video Interviewer"
      originalProject="project_a (AI Video Interviewer)"
      targetPort={5011}
      targetUrl="http://localhost:5011"
      techStack="React 19 / Node Express ESM / Native WebSockets / Sarvam AI"
      description="Original Project A: Provides real-time WebSocket audio/video interview loops, Sarvam AI STT/TTS voice synthesis, proctoring observation event logging, and candidate evaluation report cards."
    />
  );
};
