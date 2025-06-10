"use client";

import React from 'react';
import PageTitle from '@/components/common/PageTitle';
import ApiSettingsForm from '@/components/settings/ApiSettingsForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiSettingsPage() {
  return (
    <div className="container mx-auto max-w-3xl">
      <PageTitle 
        title="API Settings" 
        subtitle="Manage your API keys for Deep Seek and Open Router AI services." 
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Configure AI Providers</CardTitle>
          <CardDescription>
            Enter your API keys and select preferred models. These settings are stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiSettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
