import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2, Play, Square, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { voiceService } from '../../services/voiceService';

export const VoiceLabModal = ({ isOpen, onClose }) => {
  // STT State
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sttProvider, setSttProvider] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [sttError, setSttError] = useState('');

  // TTS State
  const [ttsText, setTtsText] = useState('Welcome to your InterviewX AI assessment. We will begin your technical questions now.');
  const [speaker, setSpeaker] = useState('meera');
  const [synthesizing, setSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- STT Handlers ---
  const startRecording = async () => {
    setSttError('');
    setTranscript('');
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlobRecorded = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlobRecorded);
        stream.getTracks().forEach((track) => track.stop());

        // Send to backend STT
        try {
          setTranscribing(true);
          const result = await voiceService.transcribeAudio(audioBlobRecorded, 'en-IN');
          setTranscript(result.transcript || 'No speech detected.');
          setSttProvider(result.provider || 'sarvam');
        } catch (err) {
          setSttError(err.message || 'Speech transcription failed.');
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setSttError(`Microphone access error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- TTS Handlers ---
  const handleSynthesizeAndPlay = async () => {
    if (!ttsText.trim()) return;

    setTtsError('');
    try {
      setSynthesizing(true);
      const result = await voiceService.synthesizeSpeech(ttsText, { speaker });
      if (result?.audioBase64) {
        setIsPlaying(true);
        await voiceService.playAudioFromBase64(result.audioBase64, result.format || 'audio/wav');
        setIsPlaying(false);
      } else {
        throw new Error('No audio binary returned from synthesis service');
      }
    } catch (err) {
      setTtsError(err.message || 'Speech synthesis failed.');
      setIsPlaying(false);
    } finally {
      setSynthesizing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sarvam AI Voice Foundation Lab" size="lg">
      <div className="space-y-6 text-left">
        <p className="text-xs text-brandBody">
          Test foundational Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities powered by the Sarvam AI voice engine.
        </p>

        {/* Section 1: Speech to Text (STT) */}
        <div className="p-4 bg-gray-50 border border-brandBorder rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-brandHeading">1. Speech-to-Text (Sarvam STT)</h4>
            </div>
            {sttProvider && <Badge variant="primary">{sttProvider}</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isRecording ? (
              <Button
                variant="primary"
                size="sm"
                onClick={startRecording}
                disabled={transcribing}
                icon={Mic}
              >
                Start Recording
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={stopRecording}
                icon={Square}
                className="animate-pulse"
              >
                Stop Recording
              </Button>
            )}

            {isRecording && (
              <span className="text-xs font-semibold text-brandDanger flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-brandDanger inline-block"></span>
                <span>Listening to microphone...</span>
              </span>
            )}

            {transcribing && (
              <span className="text-xs font-semibold text-brandBody flex items-center space-x-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Transcribing audio via Sarvam API...</span>
              </span>
            )}
          </div>

          {sttError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-brandDanger flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sttError}</span>
            </div>
          )}

          {transcript && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brandBody">Transcribed Result:</span>
              <div className="p-3.5 bg-white border border-brandBorder rounded-lg text-xs text-brandHeading font-mono leading-relaxed">
                "{transcript}"
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Text to Speech (TTS) */}
        <div className="p-4 bg-gray-50 border border-brandBorder rounded-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-brandHeading">2. Text-to-Speech (Sarvam TTS)</h4>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-wider text-brandBody block">Text to Speak</label>
            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              rows={2}
              className="w-full text-xs p-3 rounded-lg border border-brandBorder focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              placeholder="Enter text to synthesize..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-brandBody">Voice Model:</span>
              <select
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="text-xs border border-brandBorder rounded-lg px-2.5 py-1 bg-white outline-none"
              >
                <option value="meera">Meera (Female)</option>
                <option value="pavithra">Pavithra (Female)</option>
                <option value="maithili">Maithili (Female)</option>
                <option value="arvind">Arvind (Male)</option>
                <option value="amartya">Amartya (Male)</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSynthesizeAndPlay}
              disabled={synthesizing || isPlaying || !ttsText.trim()}
              icon={synthesizing ? Loader2 : Play}
            >
              {synthesizing ? 'Synthesizing...' : isPlaying ? 'Playing Audio...' : 'Synthesize & Play'}
            </Button>
          </div>

          {ttsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-brandDanger flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ttsError}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default VoiceLabModal;
