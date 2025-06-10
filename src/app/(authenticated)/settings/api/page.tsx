import PageTitle from '@/components/common/PageTitle';
import ApiSettingsForm from '@/components/settings/ApiSettingsForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

export default function ApiSettingsPage() {
  return (
    <div className="container mx-auto">
      <PageTitle title="API Key Management" subtitle="Manage your API keys for AI services." />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-6 w-6 text-primary" /> API Provider Settings</CardTitle>
          <CardDescription>
            Configure API keys for Deep Seek and Open Router to enable AI features.
            Changes are saved locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiSettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
