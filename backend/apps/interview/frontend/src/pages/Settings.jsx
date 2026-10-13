import React from 'react';
import { useForm } from 'react-hook-form';
import { Settings as SettingsIcon, Save, Camera, Mic, Key, User, Landmark } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { BrandLoader } from '../components/common/BrandLoader';

export const Settings = () => {
  const { settings, updateRecruiterSettings, loading } = useApp();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      companyName: settings.companyName || '',
      recruiterName: settings.recruiterName || '',
      recruiterEmail: settings.recruiterEmail || '',
      apiKey: settings.apiKey || '',
      cameraSelected: settings.cameraSelected || 'default-cam',
      micSelected: settings.micSelected || 'default-mic'
    }
  });

  const onSubmit = async (data) => {
    await updateRecruiterSettings(data);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-20">
        <BrandLoader message="Loading workspace preferences..." subMessage="Syncing enterprise integration settings" />
      </div>
    );
  }

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-3xl mx-auto w-full font-sans text-slate-900">
      {/* Header */}
      <div className="text-left select-none pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure recruiter identity, default hardware devices, and API credentials.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
        {/* Recruiter Details */}
        <div className="bg-white rounded-xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Recruiter Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">Primary workspace identity and organization details</p>
          </div>
          <div className="space-y-4">
            <Input
              label="Full Name"
              icon={User}
              {...register('recruiterName')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                icon={User}
                {...register('recruiterEmail')}
              />
              <Input
                label="Company Name"
                icon={Landmark}
                {...register('companyName')}
              />
            </div>
          </div>
        </div>

        {/* Media devices configurations */}
        <div className="bg-white rounded-xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Media Device Defaults</h3>
            <p className="text-xs text-slate-500 mt-0.5">Default video optical sensor and audio recording capture streams</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Default Video Capture Device"
              options={[
                { value: 'default-cam', label: 'FaceTime HD Camera (Built-in)' },
                { value: 'external-cam', label: 'Logitech StreamCam Pro' }
              ]}
              {...register('cameraSelected')}
            />
            <Select
              label="Default Audio Recording Stream"
              options={[
                { value: 'default-mic', label: 'Internal Microphone (Built-in)' },
                { value: 'external-mic', label: 'Yeti Nano USB Microphone' }
              ]}
              {...register('micSelected')}
            />
          </div>
        </div>

        {/* API configurations */}
        <div className="bg-white rounded-xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">API & Webhook Integrations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Connect your ATS integrations (Greenhouse, Lever, Ashby)</p>
          </div>
          <div className="space-y-4">
            <Input
              label="Platform Access Secret Key"
              type="text"
              icon={Key}
              readOnly
              {...register('apiKey')}
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Use this secret access key to connect your ATS integrations (Greenhouse, Lever, Ashby). Keep this secret secure.
            </p>
          </div>
        </div>

        {/* Save button controls */}
        <div className="flex justify-end select-none pt-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSubmitting}
            icon={Save}
          >
            Save Workspace Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
