import React from 'react';
import { useForm } from 'react-hook-form';
import { Settings as SettingsIcon, Save, Camera, Mic, Key, User, Landmark } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';

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
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold tracking-tight text-brandHeading">Workspace Settings</h1>
        <p className="text-sm text-brandBody">Configure account profiles, integration keys, and local media streams.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
        {/* Recruiter Details */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Recruiter Profile</h3>
          </CardHeader>
          <CardBody className="space-y-4">
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
          </CardBody>
        </Card>

        {/* Media devices configurations */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Media Capture Configuration</h3>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </CardBody>
        </Card>

        {/* API configurations */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">API Integrations</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Platform Access Secret Key"
              type="text"
              icon={Key}
              readOnly
              {...register('apiKey')}
            />
            <p className="text-[10px] text-brandBody leading-relaxed">
              Use this secret access key to connect your ATS integrations. Never share this key on public resources.
            </p>
          </CardBody>
        </Card>

        {/* Save button controls */}
        <div className="flex justify-end select-none">
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
