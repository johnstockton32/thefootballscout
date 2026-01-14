import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { Sliders, RotateCcw, Save, Loader2, Crown, Lock } from 'lucide-react';
import { PlayerPosition, POSITION_LABELS, POSITION_WEIGHTS } from '@/lib/supabase';

interface WeightSettings {
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
}

const positions: PlayerPosition[] = [
  'goalkeeper', 'centre_back', 'full_back', 'defensive_midfielder',
  'central_midfielder', 'attacking_midfielder', 'winger', 'striker'
];

export function CustomAttributeWeights() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition>('striker');
  const [weights, setWeights] = useState<WeightSettings>({
    technical: 25,
    tactical: 25,
    physical: 25,
    mental: 25,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCustomWeights, setHasCustomWeights] = useState(false);

  const isPro = tier !== 'free';

  useEffect(() => {
    if (user && isPro) {
      loadWeights(selectedPosition);
    } else {
      setIsLoading(false);
    }
  }, [user, selectedPosition, isPro]);

  const loadWeights = async (position: PlayerPosition) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_attribute_weights')
        .select('*')
        .eq('user_id', user!.id)
        .eq('position', position)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWeights({
          technical: Math.round(Number(data.technical_weight) * 100),
          tactical: Math.round(Number(data.tactical_weight) * 100),
          physical: Math.round(Number(data.physical_weight) * 100),
          mental: Math.round(Number(data.mental_weight) * 100),
        });
        setHasCustomWeights(true);
      } else {
        // Load default weights for position
        const defaultWeights = POSITION_WEIGHTS[position];
        setWeights({
          technical: Math.round(defaultWeights.technical * 100),
          tactical: Math.round(defaultWeights.tactical * 100),
          physical: Math.round(defaultWeights.physical * 100),
          mental: Math.round(defaultWeights.mental * 100),
        });
        setHasCustomWeights(false);
      }
    } catch (error) {
      console.error('Error loading weights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (category: keyof WeightSettings, value: number[]) => {
    const newValue = value[0];
    const diff = newValue - weights[category];
    
    // Distribute the difference proportionally among other categories
    const otherCategories = Object.keys(weights).filter(k => k !== category) as (keyof WeightSettings)[];
    const totalOther = otherCategories.reduce((sum, k) => sum + weights[k], 0);
    
    if (totalOther + diff <= 0) return; // Prevent going below 0
    
    const newWeights = { ...weights, [category]: newValue };
    
    // Adjust other categories proportionally
    otherCategories.forEach(k => {
      const proportion = weights[k] / totalOther;
      newWeights[k] = Math.max(0, Math.round(weights[k] - diff * proportion));
    });
    
    // Ensure total is 100
    const total = Object.values(newWeights).reduce((sum, v) => sum + v, 0);
    if (total !== 100) {
      const adjustment = 100 - total;
      const largestCategory = otherCategories.reduce((a, b) => 
        newWeights[a] > newWeights[b] ? a : b
      );
      newWeights[largestCategory] += adjustment;
    }
    
    setWeights(newWeights);
  };

  const resetToDefaults = () => {
    const defaultWeights = POSITION_WEIGHTS[selectedPosition];
    setWeights({
      technical: Math.round(defaultWeights.technical * 100),
      tactical: Math.round(defaultWeights.tactical * 100),
      physical: Math.round(defaultWeights.physical * 100),
      mental: Math.round(defaultWeights.mental * 100),
    });
  };

  const saveWeights = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('custom_attribute_weights')
        .upsert({
          user_id: user.id,
          position: selectedPosition,
          technical_weight: weights.technical / 100,
          tactical_weight: weights.tactical / 100,
          physical_weight: weights.physical / 100,
          mental_weight: weights.mental / 100,
        }, {
          onConflict: 'user_id,position'
        });

      if (error) throw error;
      
      setHasCustomWeights(true);
      toast.success('Attribute weights saved');
    } catch (error) {
      console.error('Error saving weights:', error);
      toast.error('Failed to save weights');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-emerald-500';
      case 'tactical': return 'bg-blue-500';
      case 'physical': return 'bg-amber-500';
      case 'mental': return 'bg-purple-500';
      default: return 'bg-primary';
    }
  };

  if (!isPro) {
    return (
      <Card className="card-glass border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-muted-foreground" />
            Custom Attribute Weights
            <Badge variant="secondary" className="ml-auto">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </CardTitle>
          <CardDescription>
            Customize how attributes contribute to overall ratings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Upgrade to Pro to customize attribute weights for each position
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/settings?tab=plan'}>
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
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
          <Sliders className="w-5 h-5 text-primary" />
          Custom Attribute Weights
          {hasCustomWeights && (
            <Badge variant="secondary" className="ml-2 text-xs">Customized</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Adjust how technical, tactical, physical, and mental attributes contribute to overall ratings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Position</label>
          <Select 
            value={selectedPosition} 
            onValueChange={(v) => setSelectedPosition(v as PlayerPosition)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {positions.map(pos => (
                <SelectItem key={pos} value={pos}>
                  {POSITION_LABELS[pos]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Weight Sliders */}
            <div className="space-y-6">
              {(Object.entries(weights) as [keyof WeightSettings, number][]).map(([category, value]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
                      <label className="text-sm font-medium capitalize">{category}</label>
                    </div>
                    <span className="text-sm font-bold">{value}%</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={(v) => handleWeightChange(category, v)}
                    max={100}
                    min={0}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* Visual Distribution */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight Distribution</label>
              <div className="h-4 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 transition-all" 
                  style={{ width: `${weights.technical}%` }} 
                />
                <div 
                  className="bg-blue-500 transition-all" 
                  style={{ width: `${weights.tactical}%` }} 
                />
                <div 
                  className="bg-amber-500 transition-all" 
                  style={{ width: `${weights.physical}%` }} 
                />
                <div 
                  className="bg-purple-500 transition-all" 
                  style={{ width: `${weights.mental}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Technical</span>
                <span>Tactical</span>
                <span>Physical</span>
                <span>Mental</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetToDefaults} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button onClick={saveWeights} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Weights
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}