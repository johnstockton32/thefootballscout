import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tag, Plus, ShieldCheck, Trash2, Edit, ArrowLeft, Users, Crown, Percent, Calendar, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  tier_upgrade: string | null;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface PromoCodeRedemption {
  id: string;
  promo_code_id: string;
  user_id: string;
  redeemed_at: string;
  user_email?: string;
  user_name?: string;
}

export default function AdminPromoCodes() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<PromoCodeRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [selectedCodeForRedemptions, setSelectedCodeForRedemptions] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_percent: 0,
    tier_upgrade: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPromoCodes();
    }
  }, [isSuperAdmin]);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRedemptions = async (promoCodeId: string) => {
    try {
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('promo_code_redemptions')
        .select('*')
        .eq('promo_code_id', promoCodeId)
        .order('redeemed_at', { ascending: false });

      if (redemptionsError) throw redemptionsError;

      // Fetch user details for each redemption
      const userIds = redemptionsData?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const enrichedRedemptions = (redemptionsData || []).map(redemption => {
        const profile = profiles?.find(p => p.id === redemption.user_id);
        return {
          ...redemption,
          user_email: profile?.email,
          user_name: profile?.full_name,
        };
      });

      setRedemptions(enrichedRedemptions);
      setSelectedCodeForRedemptions(promoCodeId);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      toast.error('Failed to load redemption history');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_percent: 0,
      tier_upgrade: '',
      max_uses: '',
      expires_at: '',
      is_active: true,
    });
    setEditingCode(null);
  };

  const openEditDialog = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_percent: code.discount_percent,
      tier_upgrade: code.tier_upgrade || '',
      max_uses: code.max_uses?.toString() || '',
      expires_at: code.expires_at ? code.expires_at.split('T')[0] : '',
      is_active: code.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast.error('Promo code is required');
      return;
    }

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim() || null,
        discount_percent: formData.discount_percent,
        tier_upgrade: (formData.tier_upgrade || null) as 'free' | 'pro' | null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        is_active: formData.is_active,
      };

      if (editingCode) {
        const { error } = await supabase
          .from('promo_codes')
          .update(payload)
          .eq('id', editingCode.id);

        if (error) throw error;
        toast.success('Promo code updated');
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert([payload]);

        if (error) throw error;
        toast.success('Promo code created');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('A promo code with this name already exists');
      } else {
        toast.error('Failed to save promo code');
      }
    }
  };

  const deletePromoCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Promo code deleted');
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Promo code ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to update promo code status');
    }
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ShieldCheck className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">Only platform super admins can manage promo codes.</p>
        </div>
      </DashboardLayout>
    );
  }

  const selectedCode = promoCodes.find(c => c.id === selectedCodeForRedemptions);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Tag className="w-7 h-7 text-primary" />
                Promo Codes
              </h1>
              <p className="text-muted-foreground mt-1">Create and manage promotional codes</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCode ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
                <DialogDescription>
                  {editingCode ? 'Update the promo code details below.' : 'Fill in the details for the new promo code.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="WELCOME2025"
                    className="uppercase"
                    disabled={!!editingCode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Welcome offer for new users"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount %</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier Upgrade</Label>
                    <Select value={formData.tier_upgrade || "none"} onValueChange={(v) => setFormData({ ...formData, tier_upgrade: v === "none" ? "" : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Max Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires">Expires On</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active</Label>
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">{editingCode ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-glass">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Tag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Codes</p>
                  <p className="text-2xl font-bold">{promoCodes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Crown className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Codes</p>
                  <p className="text-2xl font-bold">{promoCodes.filter(c => c.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Redemptions</p>
                  <p className="text-2xl font-bold">{promoCodes.reduce((acc, c) => acc + c.current_uses, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <Percent className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tier Upgrades</p>
                  <p className="text-2xl font-bold">{promoCodes.filter(c => c.tier_upgrade).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promo Codes Table */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-5 h-5" />
              All Promo Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : promoCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No promo codes created yet.</p>
                <p className="text-sm">Click "Create Promo Code" to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-bold">{code.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{code.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {code.tier_upgrade && (
                            <Badge variant="default" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              {code.tier_upgrade}
                            </Badge>
                          )}
                          {code.discount_percent > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Percent className="w-3 h-3 mr-1" />
                              {code.discount_percent}% off
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => fetchRedemptions(code.id)}
                          className="text-primary hover:underline"
                        >
                          {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''}
                        </button>
                      </TableCell>
                      <TableCell>
                        {code.expires_at ? (
                          <span className={new Date(code.expires_at) < new Date() ? 'text-destructive' : ''}>
                            {format(new Date(code.expires_at), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={code.is_active}
                          onCheckedChange={() => toggleActive(code.id, code.is_active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(code)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{code.code}"? This will also remove all redemption history.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePromoCode(code.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Redemption History Modal */}
        {selectedCodeForRedemptions && (
          <Dialog open={!!selectedCodeForRedemptions} onOpenChange={() => setSelectedCodeForRedemptions(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Redemption History - {selectedCode?.code}
                </DialogTitle>
                <DialogDescription>
                  {redemptions.length} total redemption{redemptions.length !== 1 ? 's' : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[400px] overflow-y-auto">
                {redemptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No redemptions yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.map((redemption) => (
                        <TableRow key={redemption.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{redemption.user_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{redemption.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(redemption.redeemed_at), 'MMM d, yyyy HH:mm')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
