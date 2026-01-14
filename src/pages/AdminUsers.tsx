import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Users, ShieldCheck, Trash2, ArrowLeft, Search, Crown, UserX, Pencil, Eye, EyeOff, MoreHorizontal, FileText, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';

interface UserWithDetails {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  created_at: string;
  subscription_tier: string;
  team_id: string | null;
  role: 'scout' | 'admin';
  player_count: number;
  report_count: number;
}

export default function AdminUsers() {
  const { isAdmin, isSuperAdmin, user: currentUser, profile } = useAuth();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editSubscriptionTier, setEditSubscriptionTier] = useState('');
  const [editRole, setEditRole] = useState<'scout' | 'admin'>('scout');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, isSuperAdmin]);

  useEffect(() => {
    let filtered = users;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(query) ||
        u.full_name?.toLowerCase().includes(query) ||
        u.organization?.toLowerCase().includes(query)
      );
    }
    
    if (tierFilter !== 'all') {
      filtered = filtered.filter(u => u.subscription_tier === tierFilter);
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchQuery, tierFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      let profilesQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin && profile?.team_id) {
        profilesQuery = profilesQuery.eq('team_id', profile.team_id);
      } else if (!isSuperAdmin) {
        setUsers([]);
        setFilteredUsers([]);
        setIsLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: players } = await supabase
        .from('players')
        .select('scout_id');

      const { data: reports } = await supabase
        .from('scouting_reports')
        .select('scout_id');

      const usersWithDetails: UserWithDetails[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        const playerCount = players?.filter(p => p.scout_id === profile.id).length || 0;
        const reportCount = reports?.filter(r => r.scout_id === profile.id).length || 0;
        
        return {
          ...profile,
          role: (userRole?.role || 'scout') as 'scout' | 'admin',
          player_count: playerCount,
          report_count: reportCount,
        };
      });

      setUsers(usersWithDetails);
      setFilteredUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (user: UserWithDetails) => {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditOrganization(user.organization || '');
    setEditSubscriptionTier(user.subscription_tier);
    setEditRole(user.role);
    setEditPassword('');
    setShowPassword(false);
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName,
          organization: editOrganization,
          subscription_tier: editSubscriptionTier as 'free' | 'pro' | 'team' | 'agency',
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Update role if super admin
      if (isSuperAdmin) {
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', editingUser.id)
          .maybeSingle();

        if (existingRole) {
          await supabase
            .from('user_roles')
            .update({ role: editRole })
            .eq('user_id', editingUser.id);
        } else {
          await supabase
            .from('user_roles')
            .insert({ user_id: editingUser.id, role: editRole });
        }
      }

      // Update password if provided
      if (editPassword && editPassword.length >= 8) {
        const response = await supabase.functions.invoke('update-user-password', {
          body: { userId: editingUser.id, email: editingUser.email, newPassword: editPassword },
        });

        if (response.error || response.data?.error) {
          throw new Error(response.data?.error || 'Failed to update password');
        }
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, full_name: editFullName, organization: editOrganization, subscription_tier: editSubscriptionTier as 'free' | 'pro' | 'team' | 'agency', role: editRole }
          : u
      ));

      toast.success('User updated successfully');
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot delete your own account');
      return;
    }

    try {
      await supabase.from('scouting_reports').delete().eq('scout_id', userId);
      await supabase.from('players').delete().eq('scout_id', userId);
      await supabase.from('watchlists').delete().eq('user_id', userId);
      await supabase.from('ai_insights').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User and all associated data deleted');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ShieldCheck className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/admin">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 md:w-7 md:h-7 text-primary shrink-0" />
                <span className="truncate">{isSuperAdmin ? 'User Management' : 'Team Users'}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {isSuperAdmin ? 'Manage all platform users' : 'Manage your team members'}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-glass">
          <CardContent className="py-3 md:py-4">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="scout">Scout</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats - Mobile optimized grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="card-glass">
            <CardContent className="py-3 md:py-4">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold">{users.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="py-3 md:py-4">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="py-3 md:py-4">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold">{users.filter(u => u.subscription_tier !== 'free').length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Paid Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="py-3 md:py-4">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold">{filteredUsers.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Showing</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="card-glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{user.full_name || 'No name'}</p>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {user.player_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {user.report_count}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.subscription_tier}
                        </Badge>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              disabled={user.id === currentUser?.id}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.full_name || user.email}? This will permanently remove:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>{user.player_count} players</li>
                                  <li>{user.report_count} scouting reports</li>
                                  <li>All watchlists and AI insights</li>
                                </ul>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user details for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input
                value={editOrganization}
                onChange={(e) => setEditOrganization(e.target.value)}
                placeholder="Enter organization"
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Select value={editSubscriptionTier} onValueChange={setEditSubscriptionTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as 'scout' | 'admin')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scout">Scout</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>New Password (optional)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {editPassword && <PasswordStrengthIndicator password={editPassword} />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={saveUserChanges} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
