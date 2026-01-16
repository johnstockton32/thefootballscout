import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { Palette, Upload, Save, Loader2, Crown, Lock, Building2, Image } from 'lucide-react';

interface BrandingData {
  company_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  show_default_branding: boolean;
}

export function BrandingSettings() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [branding, setBranding] = useState<BrandingData>({
    company_name: '',
    logo_url: '',
    primary_color: '#22c55e',
    secondary_color: '#3b82f6',
    show_default_branding: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTeam = tier === 'team';

  useEffect(() => {
    if (user && isTeam) {
      loadBranding();
    } else {
      setIsLoading(false);
    }
  }, [user, isTeam]);

  const loadBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBranding({
          company_name: data.company_name || '',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#22c55e',
          secondary_color: data.secondary_color || '#3b82f6',
          show_default_branding: data.show_default_branding,
        });
      }
    } catch (error) {
      console.error('Error loading branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/branding-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName);

      setBranding(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const saveBranding = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          company_name: branding.company_name || null,
          logo_url: branding.logo_url || null,
          primary_color: branding.primary_color,
          secondary_color: branding.secondary_color,
          show_default_branding: branding.show_default_branding,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      toast.success('Branding settings saved');
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isTeam) {
    return (
      <Card className="card-glass border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-muted-foreground" />
            White-Label Reports
            <Badge variant="secondary" className="ml-auto">
              <Building2 className="w-3 h-3 mr-1" />
              Team
            </Badge>
          </CardTitle>
          <CardDescription>
            Customize PDF reports with your own branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Upgrade to Team to add your company branding to exported reports
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/settings?tab=plan'}>
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Team
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          White-Label Reports
        </CardTitle>
        <CardDescription>
          Add your company branding to exported PDF reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Company Name */}
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={branding.company_name}
                onChange={(e) => setBranding(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                  {branding.logo_url ? (
                    <img 
                      src={branding.logo_url} 
                      alt="Company logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG or JPG, max 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    placeholder="#22c55e"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Show Default Branding */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label className="font-medium">Hide "The Football Scout" branding</Label>
                <p className="text-sm text-muted-foreground">
                  Remove default app branding from exported PDFs
                </p>
              </div>
              <Switch
                checked={!branding.show_default_branding}
                onCheckedChange={(checked) => 
                  setBranding(prev => ({ ...prev, show_default_branding: !checked }))
                }
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  background: `linear-gradient(135deg, ${branding.primary_color}20, ${branding.secondary_color}20)`,
                  borderColor: branding.primary_color 
                }}
              >
                <div className="flex items-center gap-3">
                  {branding.logo_url && (
                    <img src={branding.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
                  )}
                  <div>
                    <p className="font-bold" style={{ color: branding.primary_color }}>
                      {branding.company_name || 'Your Company Name'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scouting Report • {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button onClick={saveBranding} disabled={isSaving} className="w-full">
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Branding Settings
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}