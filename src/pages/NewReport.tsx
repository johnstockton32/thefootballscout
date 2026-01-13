import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttributeSlider } from '@/components/reports/AttributeSlider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  supabase, 
  COMPETITION_LEVEL_LABELS, 
  CompetitionLevel, 
  PlayerPosition,
  calculateOverallRating
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Save, FileText, Zap, Brain, Target, Heart, Cloud } from 'lucide-react';
import { handleError } from '@/lib/errorUtils';
import { useDebouncedCallback } from 'use-debounce';

interface Player {
  id: string;
  full_name: string;
  position: PlayerPosition;
}

const INITIAL_ATTRIBUTES = {
  technical_first_touch: 10,
  technical_passing: 10,
  technical_crossing: 10,
  technical_dribbling: 10,
  technical_shooting: 10,
  technical_heading: 10,
  tactical_positioning: 10,
  tactical_decision_making: 10,
  tactical_awareness: 10,
  tactical_off_ball_movement: 10,
  tactical_defensive_contribution: 10,
  physical_pace: 10,
  physical_stamina: 10,
  physical_strength: 10,
  physical_agility: 10,
  physical_balance: 10,
  mental_composure: 10,
  mental_concentration: 10,
  mental_leadership: 10,
  mental_work_rate: 10,
  mental_aggression: 10,
};

export default function NewReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(searchParams.get('playerId') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    match_date: new Date().toISOString().split('T')[0],
    match_details: '',
    opposition: '',
    competition_level: '' as CompetitionLevel | '',
    minutes_observed: '',
    strengths: '',
    weaknesses: '',
    recommendation: '',
    potential_rating: 50,
  });

  const [attributes, setAttributes] = useState(INITIAL_ATTRIBUTES);

  useEffect(() => {
    if (user) {
      fetchPlayers();
    }
  }, [user]);

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('id, full_name, position')
      .order('full_name');

    if (!error && data) {
      setPlayers(data);
    }
  };

  // Calculate overall rating
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const overallRating = selectedPlayer ? calculateOverallRating(
    selectedPlayer.position,
    [
      attributes.technical_first_touch,
      attributes.technical_passing,
      attributes.technical_crossing,
      attributes.technical_dribbling,
      attributes.technical_shooting,
      attributes.technical_heading,
    ],
    [
      attributes.tactical_positioning,
      attributes.tactical_decision_making,
      attributes.tactical_awareness,
      attributes.tactical_off_ball_movement,
      attributes.tactical_defensive_contribution,
    ],
    [
      attributes.physical_pace,
      attributes.physical_stamina,
      attributes.physical_strength,
      attributes.physical_agility,
      attributes.physical_balance,
    ],
    [
      attributes.mental_composure,
      attributes.mental_concentration,
      attributes.mental_leadership,
      attributes.mental_work_rate,
      attributes.mental_aggression,
    ]
  ) : 0;

  // Autosave draft
  const saveDraft = useDebouncedCallback(async () => {
    if (!user || !selectedPlayerId) return;

    setIsSaving(true);
    try {
      const draftData = {
        scout_id: user.id,
        player_id: selectedPlayerId,
        match_date: formData.match_date,
        match_details: formData.match_details || null,
        opposition: formData.opposition || null,
        competition_level: formData.competition_level || 'amateur',
        minutes_observed: formData.minutes_observed ? parseInt(formData.minutes_observed) : null,
        ...attributes,
        overall_rating: overallRating,
        strengths: formData.strengths || null,
        weaknesses: formData.weaknesses || null,
        recommendation: formData.recommendation || null,
        potential_rating: formData.potential_rating,
        is_draft: true,
      };

      if (draftId) {
        await supabase.from('scouting_reports').update(draftData).eq('id', draftId);
      } else {
        const { data } = await supabase.from('scouting_reports').insert(draftData).select().single();
        if (data) setDraftId(data.id);
      }
    } catch (error) {
      console.error('Autosave error:', error);
    } finally {
      setIsSaving(false);
    }
  }, 2000);

  useEffect(() => {
    if (selectedPlayerId && formData.match_date) {
      saveDraft();
    }
  }, [selectedPlayerId, formData, attributes]);

  const handleAttributeChange = (key: keyof typeof attributes, value: number) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedPlayerId || !formData.competition_level) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        scout_id: user.id,
        player_id: selectedPlayerId,
        match_date: formData.match_date,
        match_details: formData.match_details || null,
        opposition: formData.opposition || null,
        competition_level: formData.competition_level as CompetitionLevel,
        minutes_observed: formData.minutes_observed ? parseInt(formData.minutes_observed) : null,
        ...attributes,
        overall_rating: overallRating,
        strengths: formData.strengths || null,
        weaknesses: formData.weaknesses || null,
        recommendation: formData.recommendation || null,
        potential_rating: formData.potential_rating,
        is_draft: false,
      };

      if (draftId) {
        await supabase.from('scouting_reports').update(reportData).eq('id', draftId);
      } else {
        await supabase.from('scouting_reports').insert(reportData);
      }

      toast.success('Report submitted successfully!');
      navigate('/reports');
    } catch (error: unknown) {
      toast.error(handleError(error, 'Submit report'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">New Scouting Report</h1>
              <p className="text-muted-foreground mt-1">
                Record match observations and player ratings
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Details */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Match Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Player *</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Match Date *</Label>
                  <Input
                    type="date"
                    value={formData.match_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, match_date: e.target.value }))}
                    className="bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opposition</Label>
                  <Input
                    value={formData.opposition}
                    onChange={(e) => setFormData(prev => ({ ...prev, opposition: e.target.value }))}
                    placeholder="e.g., Arsenal U21"
                    className="bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Competition Level *</Label>
                  <Select 
                    value={formData.competition_level} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, competition_level: v as CompetitionLevel }))}
                  >
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMPETITION_LEVEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Minutes Observed</Label>
                  <Input
                    type="number"
                    value={formData.minutes_observed}
                    onChange={(e) => setFormData(prev => ({ ...prev, minutes_observed: e.target.value }))}
                    placeholder="e.g., 90"
                    className="bg-input"
                    min={1}
                    max={120}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Match Notes</Label>
                <Textarea
                  value={formData.match_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, match_details: e.target.value }))}
                  placeholder="Additional context about the match..."
                  className="bg-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attributes */}
          <Card className="card-glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attribute Ratings</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Overall:</span>
                  <span className="rating-badge-lg">{Math.round(overallRating)}</span>
                </div>
              </div>
              <CardDescription>Rate each attribute from 1 (poor) to 20 (world class)</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="technical" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="technical" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Technical</span>
                  </TabsTrigger>
                  <TabsTrigger value="tactical" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Tactical</span>
                  </TabsTrigger>
                  <TabsTrigger value="physical" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Physical</span>
                  </TabsTrigger>
                  <TabsTrigger value="mental" className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline">Mental</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="technical" className="space-y-6">
                  <AttributeSlider label="First Touch" value={attributes.technical_first_touch} onChange={(v) => handleAttributeChange('technical_first_touch', v)} />
                  <AttributeSlider label="Passing" value={attributes.technical_passing} onChange={(v) => handleAttributeChange('technical_passing', v)} />
                  <AttributeSlider label="Crossing" value={attributes.technical_crossing} onChange={(v) => handleAttributeChange('technical_crossing', v)} />
                  <AttributeSlider label="Dribbling" value={attributes.technical_dribbling} onChange={(v) => handleAttributeChange('technical_dribbling', v)} />
                  <AttributeSlider label="Shooting" value={attributes.technical_shooting} onChange={(v) => handleAttributeChange('technical_shooting', v)} />
                  <AttributeSlider label="Heading" value={attributes.technical_heading} onChange={(v) => handleAttributeChange('technical_heading', v)} />
                </TabsContent>

                <TabsContent value="tactical" className="space-y-6">
                  <AttributeSlider label="Positioning" value={attributes.tactical_positioning} onChange={(v) => handleAttributeChange('tactical_positioning', v)} />
                  <AttributeSlider label="Decision Making" value={attributes.tactical_decision_making} onChange={(v) => handleAttributeChange('tactical_decision_making', v)} />
                  <AttributeSlider label="Awareness" value={attributes.tactical_awareness} onChange={(v) => handleAttributeChange('tactical_awareness', v)} />
                  <AttributeSlider label="Off-Ball Movement" value={attributes.tactical_off_ball_movement} onChange={(v) => handleAttributeChange('tactical_off_ball_movement', v)} />
                  <AttributeSlider label="Defensive Contribution" value={attributes.tactical_defensive_contribution} onChange={(v) => handleAttributeChange('tactical_defensive_contribution', v)} />
                </TabsContent>

                <TabsContent value="physical" className="space-y-6">
                  <AttributeSlider label="Pace" value={attributes.physical_pace} onChange={(v) => handleAttributeChange('physical_pace', v)} />
                  <AttributeSlider label="Stamina" value={attributes.physical_stamina} onChange={(v) => handleAttributeChange('physical_stamina', v)} />
                  <AttributeSlider label="Strength" value={attributes.physical_strength} onChange={(v) => handleAttributeChange('physical_strength', v)} />
                  <AttributeSlider label="Agility" value={attributes.physical_agility} onChange={(v) => handleAttributeChange('physical_agility', v)} />
                  <AttributeSlider label="Balance" value={attributes.physical_balance} onChange={(v) => handleAttributeChange('physical_balance', v)} />
                </TabsContent>

                <TabsContent value="mental" className="space-y-6">
                  <AttributeSlider label="Composure" value={attributes.mental_composure} onChange={(v) => handleAttributeChange('mental_composure', v)} />
                  <AttributeSlider label="Concentration" value={attributes.mental_concentration} onChange={(v) => handleAttributeChange('mental_concentration', v)} />
                  <AttributeSlider label="Leadership" value={attributes.mental_leadership} onChange={(v) => handleAttributeChange('mental_leadership', v)} />
                  <AttributeSlider label="Work Rate" value={attributes.mental_work_rate} onChange={(v) => handleAttributeChange('mental_work_rate', v)} />
                  <AttributeSlider label="Aggression" value={attributes.mental_aggression} onChange={(v) => handleAttributeChange('mental_aggression', v)} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle>Summary & Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Strengths</Label>
                  <Textarea
                    value={formData.strengths}
                    onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                    placeholder="Key strengths observed..."
                    className="bg-input min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weaknesses</Label>
                  <Textarea
                    value={formData.weaknesses}
                    onChange={(e) => setFormData(prev => ({ ...prev, weaknesses: e.target.value }))}
                    placeholder="Areas for improvement..."
                    className="bg-input min-h-[100px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Potential Rating (0-100)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.potential_rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, potential_rating: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="rating-badge-sm">{formData.potential_rating}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recommendation</Label>
                <Textarea
                  value={formData.recommendation}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                  placeholder="Your recommendation for this player..."
                  className="bg-input min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={isSubmitting || !selectedPlayerId}
              className="flex-1"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Submitting...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
