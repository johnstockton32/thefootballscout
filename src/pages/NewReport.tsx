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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  supabase, 
  COMPETITION_LEVEL_LABELS, 
  CompetitionLevel, 
  PlayerPosition,
  calculateOverallRating
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineReports } from '@/hooks/useOfflineReports';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
import { toast } from 'sonner';
import { ArrowLeft, Save, FileText, Zap, Brain, Target, Heart, Cloud, AlertTriangle, Crown, Lock, Users, WifiOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { handleError } from '@/lib/errorUtils';
import { useDebouncedCallback } from 'use-debounce';

type VoiceField = 'strengths' | 'weaknesses' | 'recommendation' | 'match_details' | null;

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
  const { canCreateReport, usage, limits, tier, isLoading: subscriptionLoading } = useSubscription();
  const { isOnline } = useOfflineStatus();
  const { createReport } = useOfflineReports();
  
  // Edit mode - get edit and player params
  const editReportId = searchParams.get('edit');
  const playerIdFromUrl = searchParams.get('player') || searchParams.get('playerId') || '';
  const isEditMode = !!editReportId;
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(playerIdFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(editReportId);
  const [isLoadingReport, setIsLoadingReport] = useState(isEditMode);
  const [activeVoiceField, setActiveVoiceField] = useState<VoiceField>(null);

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
    is_private: false,
  });

  const [attributes, setAttributes] = useState(INITIAL_ATTRIBUTES);

  // Voice-to-text for notes
  const handleVoiceTranscript = useCallback((text: string) => {
    if (activeVoiceField) {
      setFormData((prev) => ({ ...prev, [activeVoiceField]: text }));
    }
  }, [activeVoiceField]);

  const { 
    isListening, 
    isSupported: voiceSupported, 
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceToText({ 
    onTranscript: handleVoiceTranscript,
    continuous: true,
  });

  // Update field when transcript changes during listening
  useEffect(() => {
    if (isListening && transcript && activeVoiceField) {
      setFormData((prev) => ({ ...prev, [activeVoiceField]: transcript }));
    }
  }, [transcript, isListening, activeVoiceField]);

  const toggleVoiceForField = useCallback((field: VoiceField) => {
    if (isListening && activeVoiceField === field) {
      stopListening();
      setActiveVoiceField(null);
    } else if (isListening) {
      stopListening();
      resetTranscript();
      setActiveVoiceField(field);
      setTimeout(() => startListening(), 100);
    } else {
      setActiveVoiceField(field);
      startListening();
    }
  }, [isListening, activeVoiceField, stopListening, startListening, resetTranscript]);

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

  // Load existing report for edit mode
  useEffect(() => {
    const fetchReportForEdit = async () => {
      if (!editReportId || !user) return;
      
      setIsLoadingReport(true);
      try {
        const { data, error } = await supabase
          .from('scouting_reports')
          .select('*')
          .eq('id', editReportId)
          .single();

        if (error) throw error;
        if (data) {
          setSelectedPlayerId(data.player_id);
          setFormData({
            match_date: data.match_date,
            match_details: data.match_details || '',
            opposition: data.opposition || '',
            competition_level: data.competition_level as CompetitionLevel,
            minutes_observed: data.minutes_observed?.toString() || '',
            strengths: data.strengths || '',
            weaknesses: data.weaknesses || '',
            recommendation: data.recommendation || '',
            potential_rating: data.potential_rating || 50,
            is_private: data.is_private || false,
          });
          setAttributes({
            technical_first_touch: data.technical_first_touch || 10,
            technical_passing: data.technical_passing || 10,
            technical_crossing: data.technical_crossing || 10,
            technical_dribbling: data.technical_dribbling || 10,
            technical_shooting: data.technical_shooting || 10,
            technical_heading: data.technical_heading || 10,
            tactical_positioning: data.tactical_positioning || 10,
            tactical_decision_making: data.tactical_decision_making || 10,
            tactical_awareness: data.tactical_awareness || 10,
            tactical_off_ball_movement: data.tactical_off_ball_movement || 10,
            tactical_defensive_contribution: data.tactical_defensive_contribution || 10,
            physical_pace: data.physical_pace || 10,
            physical_stamina: data.physical_stamina || 10,
            physical_strength: data.physical_strength || 10,
            physical_agility: data.physical_agility || 10,
            physical_balance: data.physical_balance || 10,
            mental_composure: data.mental_composure || 10,
            mental_concentration: data.mental_concentration || 10,
            mental_leadership: data.mental_leadership || 10,
            mental_work_rate: data.mental_work_rate || 10,
            mental_aggression: data.mental_aggression || 10,
          });
        }
      } catch (error) {
        console.error('Error fetching report for edit:', error);
        toast.error('Failed to load report');
        navigate('/reports');
      } finally {
        setIsLoadingReport(false);
      }
    };

    fetchReportForEdit();
  }, [editReportId, user, navigate]);

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

  // Autosave draft (only when online)
  const saveDraft = useDebouncedCallback(async () => {
    if (!user || !selectedPlayerId || !isOnline) return;

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
        is_private: formData.is_private,
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
    // Don't autosave in edit mode - only for new reports
    if (selectedPlayerId && formData.match_date && !isEditMode) {
      saveDraft();
    }
  }, [selectedPlayerId, formData, attributes, isEditMode]);

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
        is_private: formData.is_private,
      };

      if (isOnline) {
        // Online: use direct Supabase call for edits/drafts or create new
        if (draftId || isEditMode) {
          const updateId = isEditMode ? editReportId : draftId;
          await supabase.from('scouting_reports').update({ ...reportData, scout_id: user.id }).eq('id', updateId);
          toast.success(isEditMode ? 'Report updated successfully!' : 'Report submitted successfully!');
        } else {
          await supabase.from('scouting_reports').insert({ ...reportData, scout_id: user.id });
          toast.success('Report submitted successfully!');
        }
      } else {
        // Offline: use offline reports hook which handles IndexedDB and sync queue
        const result = await createReport(reportData);
        if (result) {
          toast.success('Report saved offline. Will sync when online.');
        } else {
          throw new Error('Failed to save report offline');
        }
      }
      
      navigate('/reports');
    } catch (error: unknown) {
      toast.error(handleError(error, 'Submit report'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingReport) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-4xl mx-auto animate-pulse px-0 sm:px-2">
          <div className="h-8 w-32 bg-muted rounded mb-4" />
          <div className="h-10 w-64 bg-muted rounded mb-2" />
          <div className="h-6 w-48 bg-muted rounded mb-6" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto animate-fade-in px-0 sm:px-2">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 sm:mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm">Back</span>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                {isEditMode ? 'Edit Scouting Report' : 'New Scouting Report'}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                {isEditMode ? 'Update match observations and player ratings' : 'Record match observations and player ratings'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isOnline && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
                  <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
                  Offline Mode
                </div>
              )}
              {isSaving && isOnline && !isEditMode && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Cloud className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                  Saving...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Limit Warning */}
        {!subscriptionLoading && !canCreateReport && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Monthly report limit reached</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                You've used all {limits.maxReportsPerMonth} reports this month on the Free plan.
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate('/pricing')} className="ml-4">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage indicator for free tier */}
        {!subscriptionLoading && tier === 'free' && canCreateReport && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <FileText className="h-4 w-4" />
            <AlertTitle>Monthly report usage</AlertTitle>
            <AlertDescription>
              {usage.monthlyReportCount} of {limits.maxReportsPerMonth} reports used this month on Free plan
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                  {players.length > 0 ? (
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
                  ) : (
                    <div className="h-10 bg-input rounded-md border border-border flex items-center px-3 text-sm text-muted-foreground animate-pulse">
                      Loading players...
                    </div>
                  )}
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
                <div className="flex items-center justify-between">
                  <Label>Match Notes</Label>
                  {voiceSupported && (
                    <VoiceInputButton
                      isListening={isListening && activeVoiceField === 'match_details'}
                      isSupported={voiceSupported}
                      onClick={() => toggleVoiceForField('match_details')}
                    />
                  )}
                </div>
                <Textarea
                  value={formData.match_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, match_details: e.target.value }))}
                  placeholder={voiceSupported ? "Add notes or click mic to dictate..." : "Additional context about the match..."}
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
                <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto p-1">
                  <TabsTrigger value="technical" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                    <Zap className="w-4 h-4 shrink-0" />
                    <span className="hidden xs:inline text-[10px] sm:text-sm">Technical</span>
                  </TabsTrigger>
                  <TabsTrigger value="tactical" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                    <Brain className="w-4 h-4 shrink-0" />
                    <span className="hidden xs:inline text-[10px] sm:text-sm">Tactical</span>
                  </TabsTrigger>
                  <TabsTrigger value="physical" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                    <Target className="w-4 h-4 shrink-0" />
                    <span className="hidden xs:inline text-[10px] sm:text-sm">Physical</span>
                  </TabsTrigger>
                  <TabsTrigger value="mental" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                    <Heart className="w-4 h-4 shrink-0" />
                    <span className="hidden xs:inline text-[10px] sm:text-sm">Mental</span>
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
                  <div className="flex items-center justify-between">
                    <Label>Strengths</Label>
                    {voiceSupported && (
                      <VoiceInputButton
                        isListening={isListening && activeVoiceField === 'strengths'}
                        isSupported={voiceSupported}
                        onClick={() => toggleVoiceForField('strengths')}
                      />
                    )}
                  </div>
                  <Textarea
                    value={formData.strengths}
                    onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                    placeholder="Key strengths observed..."
                    className="bg-input min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Weaknesses</Label>
                    {voiceSupported && (
                      <VoiceInputButton
                        isListening={isListening && activeVoiceField === 'weaknesses'}
                        isSupported={voiceSupported}
                        onClick={() => toggleVoiceForField('weaknesses')}
                      />
                    )}
                  </div>
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

              <div className="space-y-3">
                <Label>Recommendation</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Sign', label: 'Sign', color: 'bg-primary text-primary-foreground hover:bg-primary/90', icon: '✓' },
                    { value: 'Monitor', label: 'Monitor', color: 'bg-amber-500 text-white hover:bg-amber-600', icon: '👁' },
                    { value: 'Reject', label: 'Reject', color: 'bg-destructive text-destructive-foreground hover:bg-destructive/90', icon: '✗' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        recommendation: prev.recommendation === option.value ? '' : option.value 
                      }))}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all border-2 ${
                        formData.recommendation === option.value
                          ? `${option.color} border-transparent shadow-md scale-[1.02]`
                          : 'bg-muted/50 text-muted-foreground border-transparent hover:border-border'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
                {formData.recommendation && (
                  <p className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{formData.recommendation}</span> — click again to deselect
                  </p>
                )}
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
              disabled={isSubmitting || !selectedPlayerId || !canCreateReport}
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
