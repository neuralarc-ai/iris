"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { ApiSettings } from '@/types';

// Mock API test function
const testApiConnection = async (apiKey?: string, model?: string, serviceName?: string): Promise<boolean> => {
  if (!apiKey || !model) return false;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Simulate success/failure based on some criteria (e.g., key length or specific value for demo)
  return apiKey.length > 10 && model.length > 0; 
};


const formSchema = z.object({
  deepSeekApiKey: z.string().optional(),
  deepSeekModel: z.string().optional(),
  openRouterApiKey: z.string().optional(),
  openRouterModel: z.string().optional(),
});

// Mock model lists
const deepSeekModels = ["deepseek-chat", "deepseek-coder"];
const openRouterModels = ["openai/gpt-3.5-turbo", "google/gemini-pro", "mistralai/mistral-7b-instruct"];


export default function ApiSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{ deepSeek?: boolean; openRouter?: boolean }>({});
  const { toast } = useToast();

  const form = useForm<ApiSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: { // Load from localStorage or backend in a real app
      deepSeekApiKey: '',
      deepSeekModel: deepSeekModels[0],
      openRouterApiKey: '',
      openRouterModel: openRouterModels[0],
    },
  });

  const onSubmit: SubmitHandler<ApiSettings> = (data) => {
    setIsLoading(true);
    console.log("Saving API Settings:", data); // Replace with actual save logic
    // Simulate save
    setTimeout(() => {
      toast({
        title: "Settings Saved",
        description: "Your API settings have been updated.",
      });
      setIsLoading(false);
      // Persist to localStorage or send to backend
      try {
        localStorage.setItem('apiSettings', JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save API settings to localStorage", e);
      }
    }, 1500);
  };

  const handleTestConnection = async (service: 'deepSeek' | 'openRouter') => {
    setIsLoading(true);
    const apiKey = form.getValues(service === 'deepSeek' ? 'deepSeekApiKey' : 'openRouterApiKey');
    const model = form.getValues(service === 'deepSeek' ? 'deepSeekModel' : 'openRouterModel');
    const serviceName = service === 'deepSeek' ? 'Deep Seek' : 'Open Router';

    if (!apiKey || !model) {
      toast({
        title: `${serviceName} Test Failed`,
        description: "API Key and Model must be provided.",
        variant: "destructive",
      });
      setTestResults(prev => ({ ...prev, [service]: false }));
      setIsLoading(false);
      return;
    }

    const success = await testApiConnection(apiKey, model, serviceName);
    setTestResults(prev => ({ ...prev, [service]: success }));
    toast({
      title: `${serviceName} Connection Test ${success ? 'Successful' : 'Failed'}`,
      description: success ? `Successfully connected to ${serviceName} with model ${model}.` : `Could not connect to ${serviceName}. Check your key and model.`,
      variant: success ? "default" : "destructive",
      className: success ? "bg-green-100 dark:bg-green-900 border-green-500" : ""
    });
    setIsLoading(false);
  };
  
  // Load initial values from localStorage if available
  React.useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('apiSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        form.reset(parsedSettings);
      }
    } catch (e) {
      console.error("Failed to load API settings from localStorage", e);
    }
  }, [form]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Deep Seek Section */}
        <div className="space-y-4 p-6 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium font-headline">Deep Seek (Primary)</h3>
          <FormField
            control={form.control}
            name="deepSeekApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter Deep Seek API Key" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deepSeekModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Deep Seek model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {deepSeekModels.map(model => <SelectItem key={model} value={model}>{model}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center">
            <Button type="button" variant="outline" onClick={() => handleTestConnection('deepSeek')} disabled={isLoading}>
              Test Connection
            </Button>
            {testResults.deepSeek === true && <CheckCircle className="ml-2 h-5 w-5 text-green-500" />}
            {testResults.deepSeek === false && <XCircle className="ml-2 h-5 w-5 text-destructive" />}
          </div>
        </div>

        {/* Open Router Section */}
        <div className="space-y-4 p-6 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium font-headline">Open Router (Fallback)</h3>
          <FormField
            control={form.control}
            name="openRouterApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter Open Router API Key" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="openRouterModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Open Router model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {openRouterModels.map(model => <SelectItem key={model} value={model}>{model}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <div className="flex items-center">
            <Button type="button" variant="outline" onClick={() => handleTestConnection('openRouter')} disabled={isLoading}>
              Test Connection
            </Button>
            {testResults.openRouter === true && <CheckCircle className="ml-2 h-5 w-5 text-green-500" />}
            {testResults.openRouter === false && <XCircle className="ml-2 h-5 w-5 text-destructive" />}
          </div>
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Settings"}
        </Button>
      </form>
    </Form>
  );
}
