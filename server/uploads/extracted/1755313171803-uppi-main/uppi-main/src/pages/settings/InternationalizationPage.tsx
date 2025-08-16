import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { translationService } from '@/services/core/translationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Globe, Save, Languages, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney'
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
];

const DATE_FORMATS = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'MM-DD-YYYY'
];

const TIME_FORMATS = [
  '12h',
  '24h'
];

export default function InternationalizationPage() {
  const { t, language, setLanguage, isLoading: translationLoading } = useTranslation();
  const { preferences, updatePreferences, isLoading: preferencesLoading } = useUserPreferences();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedDateFormat, setSelectedDateFormat] = useState('MM/DD/YYYY');
  const [selectedTimeFormat, setSelectedTimeFormat] = useState('12h');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableLanguages();
  }, []);

  useEffect(() => {
    if (preferences?.ui_preferences) {
      setSelectedLanguage(preferences.ui_preferences.language || 'en');
      setSelectedTimezone(preferences.ui_preferences.timezone || 'UTC');
      setSelectedCurrency(preferences.ui_preferences.currency || 'USD');
      setSelectedDateFormat(preferences.ui_preferences.date_format || 'MM/DD/YYYY');
      setSelectedTimeFormat(preferences.ui_preferences.time_format || '12h');
    }
  }, [preferences]);

  const loadAvailableLanguages = async () => {
    try {
      const languages = await translationService.getAvailableLocales();
      setAvailableLanguages(languages);
    } catch (error) {
      console.error('Error loading available languages:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Update language through translation hook
      if (selectedLanguage !== language) {
        await setLanguage(selectedLanguage);
      }

      // Update other preferences
      const success = await updatePreferences({
        ui_preferences: {
          ...preferences?.ui_preferences,
          language: selectedLanguage,
          timezone: selectedTimezone,
          currency: selectedCurrency,
          date_format: selectedDateFormat,
          time_format: selectedTimeFormat
        }
      });

      if (success) {
        toast.success('Internationalization settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const formatPreview = () => {
    const now = new Date();
    const timeFormatted = selectedTimeFormat === '24h' 
      ? now.toLocaleTimeString('en-US', { hour12: false })
      : now.toLocaleTimeString('en-US', { hour12: true });
    
    let dateFormatted = '';
    switch (selectedDateFormat) {
      case 'MM/DD/YYYY':
        dateFormatted = now.toLocaleDateString('en-US');
        break;
      case 'DD/MM/YYYY':
        dateFormatted = now.toLocaleDateString('en-GB');
        break;
      case 'YYYY-MM-DD':
        dateFormatted = now.toISOString().split('T')[0];
        break;
      case 'DD-MM-YYYY':
        dateFormatted = now.toLocaleDateString('en-GB').replace(/\//g, '-');
        break;
      case 'MM-DD-YYYY':
        dateFormatted = now.toLocaleDateString('en-US').replace(/\//g, '-');
        break;
      default:
        dateFormatted = now.toLocaleDateString('en-US');
    }

    const currency = CURRENCIES.find(c => c.code === selectedCurrency);
    const currencyFormatted = `${currency?.symbol}1,234.56`;

    return {
      date: dateFormatted,
      time: timeFormatted,
      currency: currencyFormatted
    };
  };

  const preview = formatPreview();

  if (translationLoading || preferencesLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Globe className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internationalization</h1>
          <p className="text-muted-foreground">
            Configure language, region, and format preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Languages className="h-5 w-5" />
              <span>Language Settings</span>
            </CardTitle>
            <CardDescription>
              Choose your preferred language for the interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Interface Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center justify-between w-full">
                        <span>{lang.nativeName}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({lang.name})
                        </span>
                        {availableLanguages.includes(lang.code) && (
                          <Badge variant="secondary" className="ml-2">
                            Available
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Available Languages</Label>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((langCode) => {
                  const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                  return (
                    <Badge key={langCode} variant="outline">
                      {lang?.nativeName || langCode}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Regional Settings</span>
            </CardTitle>
            <CardDescription>
              Configure timezone and locale preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span>{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="text-sm text-muted-foreground">
                          ({currency.name})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Format Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Format Settings</CardTitle>
            <CardDescription>
              Customize how dates and times are displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={selectedDateFormat} onValueChange={setSelectedDateFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select value={selectedTimeFormat} onValueChange={setSelectedTimeFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format === '12h' ? '12-hour (AM/PM)' : '24-hour'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Format Preview</CardTitle>
            <CardDescription>
              Preview how your settings will display
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">{preview.date}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Time:</span>
                <span className="text-sm">{preview.time}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Currency:</span>
                <span className="text-sm">{preview.currency}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Timezone:</span>
                <span className="text-sm">{selectedTimezone}</span>
              </div>
            </div>

            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Language:</p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="min-w-32">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}