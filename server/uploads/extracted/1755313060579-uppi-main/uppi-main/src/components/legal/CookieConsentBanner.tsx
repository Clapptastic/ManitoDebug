import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Cookie, Settings, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CookieConsent {
  necessary_cookies: boolean;
  analytics_cookies: boolean;
  marketing_cookies: boolean;
  functional_cookies: boolean;
}

interface CookieConsentBannerProps {
  onConsentUpdate?: (consent: CookieConsent) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onConsentUpdate
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary_cookies: true,
    analytics_cookies: false,
    marketing_cookies: false,
    functional_cookies: false
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkExistingConsent();
  }, []);

  const checkExistingConsent = async () => {
    try {
      // Check localStorage first
      const localConsent = localStorage.getItem('cookie-consent');
      if (localConsent) {
        const parsedConsent = JSON.parse(localConsent);
        setConsent(parsedConsent);
        onConsentUpdate?.(parsedConsent);
        return;
      }

      // Check if user is authenticated and has saved preferences
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('cookie_consents')
          .select('*')
          .eq('user_id', user.id)
          .order('consent_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching cookie consent:', error);
        }

        if (data) {
          const userConsent = {
            necessary_cookies: data.necessary_cookies,
            analytics_cookies: data.analytics_cookies,
            marketing_cookies: data.marketing_cookies,
            functional_cookies: data.functional_cookies
          };
          setConsent(userConsent);
          onConsentUpdate?.(userConsent);
          localStorage.setItem('cookie-consent', JSON.stringify(userConsent));
          return;
        }
      }

      // Show banner if no existing consent
      setShowBanner(true);
    } catch (error) {
      console.error('Error checking existing consent:', error);
      setShowBanner(true);
    }
  };

  const saveConsent = async (consentData: CookieConsent) => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('cookie-consent', JSON.stringify(consentData));
      
      // Save to database if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('cookie_consents')
          .upsert({
            user_id: user.id,
            ...consentData,
            consent_date: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving cookie consent:', error);
        }
      }

      setConsent(consentData);
      onConsentUpdate?.(consentData);
      setShowBanner(false);
      setShowSettings(false);

      toast({
        title: 'Cookie preferences saved',
        description: 'Your cookie preferences have been updated successfully.'
      });
    } catch (error) {
      console.error('Error saving consent:', error);
      toast({
        title: 'Error',
        description: 'Failed to save cookie preferences.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary_cookies: true,
      analytics_cookies: true,
      marketing_cookies: true,
      functional_cookies: true
    };
    saveConsent(allAccepted);
  };

  const acceptNecessaryOnly = () => {
    const necessaryOnly = {
      necessary_cookies: true,
      analytics_cookies: false,
      marketing_cookies: false,
      functional_cookies: false
    };
    saveConsent(necessaryOnly);
  };

  const handleCustomSave = () => {
    saveConsent(consent);
  };

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t">
          <Card className="max-w-4xl mx-auto">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">We use cookies</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We use cookies to enhance your browsing experience, serve personalized content, 
                    and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={acceptAll} size="sm">
                      Accept All
                    </Button>
                    <Button onClick={acceptNecessaryOnly} variant="outline" size="sm">
                      Necessary Only
                    </Button>
                    <Button 
                      onClick={() => setShowSettings(true)} 
                      variant="outline" 
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Customize
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBanner(false)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Choose which cookies you'd like to accept. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Necessary Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Required for the website to function properly. Cannot be disabled.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Analytics Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how you use our website to improve your experience.
                </p>
              </div>
              <Switch
                checked={consent.analytics_cookies}
                onCheckedChange={(checked) =>
                  setConsent({ ...consent, analytics_cookies: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Marketing Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Used to deliver personalized advertisements and measure their effectiveness.
                </p>
              </div>
              <Switch
                checked={consent.marketing_cookies}
                onCheckedChange={(checked) =>
                  setConsent({ ...consent, marketing_cookies: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Functional Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Enable enhanced features and personalization, such as remembering your preferences.
                </p>
              </div>
              <Switch
                checked={consent.functional_cookies}
                onCheckedChange={(checked) =>
                  setConsent({ ...consent, functional_cookies: checked })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCustomSave}
              disabled={loading}
            >
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};