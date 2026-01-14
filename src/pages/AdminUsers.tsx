import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Users, ShieldCheck, Trash2, ArrowLeft, Search, Crown, Shield, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

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
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch player counts per user
      const { data: players } = await supabase
        .from('players')
        .select('scout_id');

      // Fetch report counts per user
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

  const updateUserRole = async (userId: string, newRole: 'scout' | 'admin') => {
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  const updateSubscriptionTier = async (userId: string, newTier: 'free' | 'pro' | 'team' | 'agency') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: newTier })
        .eq('id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, subscription_tier: newTier } : u))
      );
      toast.success(`Subscription updated to ${newTier}`);
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot delete your own account');
      return;
    }

    try {
      // Delete user's scouting reports first
      await supabase.from('scouting_reports').delete().eq('scout_id', userId);
      
      // Delete user's players
      await supabase.from('players').delete().eq('scout_id', userId);
      
      // Delete user's watchlists
      await supabase.from('watchlists').delete().eq('user_id', userId);
      
      // Delete user's AI insights
      await supabase.from('ai_insights').delete().eq('user_id', userId);
      
      // Delete user roles
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Delete profile
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
                <Users className="w-7 h-7 text-primary" />
                User Management
              </h1>
              <p className="text-muted-foreground mt-1">Manage all platform users</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-glass">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="scout">Scout</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card className="card-glass">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{users.filter(u => u.subscription_tier !== 'free').length}</p>
                <p className="text-sm text-muted-foreground">Paid Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{filteredUsers.length}</p>
                <p className="text-sm text-muted-foreground">Showing</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-lg">All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Players / Reports</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{user.organization || '-'}</TableCell>
                        <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {user.player_count} / {user.report_count}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.subscription_tier}
                            onValueChange={(value: 'free' | 'pro' | 'team' | 'agency') => updateSubscriptionTier(user.id, value)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="team">Team</SelectItem>
                              <SelectItem value="agency">Agency</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value: 'scout' | 'admin') => updateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scout">Scout</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={user.id === currentUser?.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
