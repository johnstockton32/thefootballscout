import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase, POSITION_LABELS, PlayerPosition } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, AlertTriangle, Crown, Cloud } from 'lucide-react';
import { z } from 'zod';
import { handleError } from '@/lib/errorUtils';
import { PlayerPhotoUpload } from '@/components/players/PlayerPhotoUpload';
import { useDebouncedCallback } from 'use-debounce';

const PLAYER_DRAFT_KEY = 'player_draft';

const playerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  position: z.string().min(1, 'Please select a position'),
  date_of_birth: z.string().optional(),
  nationality: z.string().max(50).optional(),
  current_club: z.string().max(100).optional(),
  height_cm: z.number().min(100).max(250).optional().nullable(),
  weight_kg: z.number().min(30).max(150).optional().nullable(),
  preferred_foot: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export default function NewPlayer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreatePlayer, usage, limits, tier, isLoading: subscriptionLoading } = useSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    secondary_position: '',
    date_of_birth: '',
    nationality: '',
    current_club: '',
    height_cm: '',
    weight_kg: '',
    preferred_foot: '',
    notes: '',
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(PLAYER_DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData || formData);
        setPhotoUrl(draft.photoUrl || null);
      } catch (e) {
        console.error('Error loading player draft:', e);
      }
    }
  }, []);

  // Autosave draft to localStorage
  const saveDraft = useDebouncedCallback(() => {
    if (!formData.full_name && !formData.position) return;
    
    setIsSaving(true);
    try {
      localStorage.setItem(PLAYER_DRAFT_KEY, JSON.stringify({
        formData,
        photoUrl,
        savedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Error saving player draft:', e);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, 1000);

  // Trigger autosave on form changes
  useEffect(() => {
    saveDraft();
  }, [formData, photoUrl]);

  // Clear draft on successful submit
  const clearDraft = () => {
    localStorage.removeItem(PLAYER_DRAFT_KEY);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      if (formData.full_name && formData.position) {
        document.querySelector<HTMLFormElement>('form')?.requestSubmit();
      }
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to add a player');
      return;
    }

    try {
      const validationData = {
        ...formData,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
      };

      playerSchema.parse(validationData);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('players').insert({
        scout_id: user.id,
        full_name: formData.full_name.trim(),
        position: formData.position as PlayerPosition,
        secondary_position: formData.secondary_position ? formData.secondary_position as PlayerPosition : null,
        date_of_birth: formData.date_of_birth || null,
        nationality: formData.nationality.trim() || null,
        current_club: formData.current_club.trim() || null,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
        preferred_foot: formData.preferred_foot || null,
        notes: formData.notes.trim() || null,
        photo_url: photoUrl,
      });

      if (error) throw error;

      // Clear the draft on successful save
      clearDraft();
      
      toast.success('Player added successfully!');
      navigate('/players');
    } catch (error: unknown) {
      toast.error(handleError(error, 'Create player'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Add New Player</h1>
              <p className="text-muted-foreground mt-1">
                Create a player profile to start scouting
              </p>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cloud className="w-4 h-4 animate-pulse" />
                Saving...
              </div>
            )}
          </div>
        </div>

        {/* Subscription Limit Warning */}
        {!subscriptionLoading && !canCreatePlayer && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Player limit reached</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                You've reached the maximum of {limits.maxPlayers} players on the Free plan.
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate('/pricing')} className="ml-4">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage indicator for free tier */}
        {!subscriptionLoading && tier === 'free' && canCreatePlayer && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <User className="h-4 w-4" />
            <AlertTitle>Player usage</AlertTitle>
            <AlertDescription>
              {usage.playerCount} of {limits.maxPlayers} players used on Free plan
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Player Information
              </CardTitle>
              <CardDescription>
                Enter the player's basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Player Photo */}
              {user && (
                <div className="space-y-2">
                  <Label>Player Photo</Label>
                  <PlayerPhotoUpload
                    photoUrl={photoUrl}
                    onPhotoChange={setPhotoUrl}
                    playerName={formData.full_name}
                    userId={user.id}
                  />
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="e.g., Marcus Johnson"
                  className="bg-input"
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name}</p>
                )}
              </div>

              {/* Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Primary Position *</Label>
                  <Select value={formData.position} onValueChange={(v) => handleChange('position', v)}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(POSITION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.position && (
                    <p className="text-xs text-destructive">{errors.position}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_position">Secondary Position</Label>
                  <Select 
                    value={formData.secondary_position || 'none'} 
                    onValueChange={(v) => handleChange('secondary_position', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Object.entries(POSITION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date of Birth & Nationality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    placeholder="e.g., England"
                    className="bg-input"
                  />
                </div>
              </div>

              {/* Club */}
              <div className="space-y-2">
                <Label htmlFor="current_club">Current Club</Label>
                <Input
                  id="current_club"
                  value={formData.current_club}
                  onChange={(e) => handleChange('current_club', e.target.value)}
                  placeholder="e.g., Manchester City U21"
                  className="bg-input"
                />
              </div>

              {/* Physical Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height_cm">Height (cm)</Label>
                  <Input
                    id="height_cm"
                    type="number"
                    value={formData.height_cm}
                    onChange={(e) => handleChange('height_cm', e.target.value)}
                    placeholder="e.g., 180"
                    className="bg-input"
                    min={100}
                    max={250}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => handleChange('weight_kg', e.target.value)}
                    placeholder="e.g., 75"
                    className="bg-input"
                    min={30}
                    max={150}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_foot">Preferred Foot</Label>
                  <Select 
                    value={formData.preferred_foot} 
                    onValueChange={(v) => handleChange('preferred_foot', v)}
                  >
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Add any additional notes about the player..."
                  className="bg-input min-h-[100px]"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isSubmitting || !canCreatePlayer}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Saving...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Player
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
