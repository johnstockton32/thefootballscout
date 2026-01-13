import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Mail, Building, Loader2, Crown, Trash2, RefreshCw, Shield, UserCheck, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type TeamRole = Database["public"]["Enums"]["team_role"];
import { TeamLogoUpload } from "@/components/teams/TeamLogoUpload";

const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  organization: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function TeamsAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      organization: "",
    },
  });

  // Fetch team data for current user (as owner)
  const { data: team, isLoading: isLoadingTeam, refetch: refetchTeam } = useQuery({
    queryKey: ["team", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user is an admin
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!data;
    },
    enabled: !!user?.id,
  });

  // Fetch team members (users belonging to this team)
  const { data: teamUsers, isLoading } = useQuery({
    queryKey: ["team-users", team?.id, isAdmin],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // If admin, show all team tier users
      if (isAdmin) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("subscription_tier", "team")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      }
      
      // If team owner, show only their team members
      if (team?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("team_id", team.id)
          .neq("id", user.id) // Exclude the owner themselves
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      }
      
      return [];
    },
    enabled: !!user?.id && (!!team?.id || !!isAdmin),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (values: CreateUserForm) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("create-team-user", {
        body: values,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Team user created successfully!");
      form.reset();
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("delete-team-user", {
        body: { userId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Team member removed successfully");
      setDeletingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
      setDeletingUserId(null);
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("resend-team-invitation", {
        body: { email },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to resend invitation");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Password reset email sent successfully!");
      setResendingEmail(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send email");
      setResendingEmail(null);
    },
  });

  const onSubmit = (values: CreateUserForm) => {
    createUserMutation.mutate(values);
  };

  const handleDeleteUser = (userId: string) => {
    setDeletingUserId(userId);
    deleteUserMutation.mutate(userId);
  };

  const handleResendInvitation = (email: string) => {
    setResendingEmail(email);
    resendInvitationMutation.mutate(email);
  };

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: TeamRole }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ team_role: role })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const handleRoleChange = (userId: string, role: TeamRole) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const getRoleBadgeColor = (role: TeamRole | null) => {
    switch (role) {
      case "team_admin":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      case "senior_scout":
        return "bg-primary/10 text-primary hover:bg-primary/20";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80";
    }
  };

  const getRoleLabel = (role: TeamRole | null) => {
    switch (role) {
      case "team_admin":
        return "Team Admin";
      case "senior_scout":
        return "Senior Scout";
      default:
        return "Scout";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show loading or access denied if not a team owner or admin
  if (isLoadingTeam) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!team && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Crown className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Team Management</h2>
          <p className="text-muted-foreground max-w-md">
            You need to be a team owner to access this page. 
            Upgrade to a Team plan to create and manage your scouting team.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              {team ? `${team.name} - Team Management` : 'Team Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Manage all team tier accounts' : 'Add and manage your team members'}
            </p>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {/* Team Logo Section */}
        {team && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Team Logo
              </CardTitle>
              <CardDescription>
                Upload a logo to appear on your scouting reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamLogoUpload
                teamId={team.id}
                currentLogoUrl={team.logo_url}
                onLogoUpdated={() => refetchTeam()}
              />
            </CardContent>
          </Card>
        )}

        {/* Create User Form */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Team User
              </CardTitle>
              <CardDescription>
                Create a new account with team tier subscription. The user will receive an email to set their password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="user@example.com"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="John Doe"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Football Club Name"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Create User
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Team Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              {teamUsers?.length || 0} users with team tier subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : teamUsers && teamUsers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.photo_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name || "Unnamed"}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {user.organization || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {team ? (
                            <Select
                              defaultValue={user.team_role || "scout"}
                              onValueChange={(value: TeamRole) => handleRoleChange(user.id, value)}
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scout">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    Scout
                                  </div>
                                </SelectItem>
                                <SelectItem value="senior_scout">
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="h-3 w-3" />
                                    Senior Scout
                                  </div>
                                </SelectItem>
                                <SelectItem value="team_admin">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-3 w-3" />
                                    Team Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="default" className={getRoleBadgeColor(user.team_role)}>
                              {getRoleLabel(user.team_role)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleResendInvitation(user.email)}
                                  disabled={resendingEmail === user.email}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {resendingEmail === user.email ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Resend password reset email</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingUserId === user.id}
                                >
                                  {deletingUserId === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove <strong>{user.full_name || user.email}</strong> from the team? 
                                    This will permanently delete their account and all associated data. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove Member
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
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No team members yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Team Member" to create the first one
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
