import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Users, FileText, UserCheck, ShieldCheck, TrendingUp, Activity, Download, BarChart3 } from 'lucide-react';
import { exportPlayersCSV, exportReportsCSV } from '@/lib/export';
import { handleError } from '@/lib/errorUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  created_at: string;
  role: 'scout' | 'admin';
}

interface AdminStats {
  totalUsers: number;
  totalPlayers: number;
  totalReports: number;
  reportsThisMonth: number;
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPlayers: 0,
    totalReports: 0,
    reportsThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch users with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role || 'scout') as 'scout' | 'admin',
        };
      });

      setUsers(usersWithRoles);

      // Fetch stats
      const { count: playersCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

      const { count: reportsCount } = await supabase
        .from('scouting_reports')
        .select('*', { count: 'exact', head: true });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyReports } = await supabase
        .from('scouting_reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalUsers: profiles?.length || 0,
        totalPlayers: playersCount || 0,
        totalReports: reportsCount || 0,
        reportsThisMonth: monthlyReports || 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'scout' | 'admin') => {
    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      toast.success(`User role updated to ${newRole}`);
    } catch (error: unknown) {
      toast.error(handleError(error, 'Update role'));
    }
  };

  const handleExportPlayers = async () => {
    try {
      await exportPlayersCSV();
      toast.success('Players exported successfully');
    } catch (error) {
      toast.error('Failed to export players');
    }
  };

  const handleExportReports = async () => {
    try {
      await exportReportsCSV();
      toast.success('Reports exported successfully');
    } catch (error) {
      toast.error('Failed to export reports');
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ShieldCheck className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, view analytics, and export data
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPlayers}>
              <Download className="w-4 h-4 mr-2" />
              Export Players
            </Button>
            <Button variant="outline" onClick={handleExportReports}>
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-glass">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <UserCheck className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{stats.totalPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <FileText className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.totalReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reports This Month</p>
                  <p className="text-2xl font-bold">{stats.reportsThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
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
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={user.role}
                          onValueChange={(value: 'scout' | 'admin') => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scout">Scout</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
