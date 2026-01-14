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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Mail, Building, Loader2, Crown, Trash2, Shield, UserCheck, ArrowLeft, MoreHorizontal, Pencil, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type TeamRole = Database["public"]["Enums"]["team_role"];
import { TeamLogoUpload } from "@/components/teams/TeamLogoUpload";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  organization: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["scout", "senior_scout", "team_admin"], { required_error: "Role is required" }),
});

const editUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  organization: z.string().optional(),
  role: z.enum(["scout", "senior_scout", "team_admin"], { required_error: "Role is required" }),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

export default function TeamsAdmin() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<{ id: string; email: string; full_name: string | null; organization: string | null; team_role: TeamRole | null } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      organization: "",
      password: "",
      role: "scout",
    },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      organization: "",
      role: "scout",
      newPassword: "",
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
        // Check for rate limiting error
        if (response.data.error.includes("security purposes") || response.data.error.includes("after")) {
          throw new Error("Please wait 60 seconds before requesting another password reset email.");
        }
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

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, email, fullName, organization, role, newPassword }: { userId: string; email: string; fullName: string; organization: string; role: TeamRole; newPassword?: string }) => {
      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, organization: organization, team_role: role })
        .eq("id", userId);

      if (error) throw error;

      // If new password is provided, call edge function to reset it
      if (newPassword && newPassword.length >= 8) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const response = await supabase.functions.invoke("update-user-password", {
          body: { userId, email, newPassword },
        });

        if (response.error) {
          throw new Error(response.error.message || "Failed to update password");
        }

        if (response.data?.error) {
          throw new Error(response.data.error);
        }
      }
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      setEditingUser(null);
      setShowEditPassword(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const handleRoleChange = (userId: string, role: TeamRole) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleEditUser = (user: { id: string; email: string; full_name: string | null; organization: string | null; team_role: TeamRole | null }) => {
    setEditingUser(user);
    setShowEditPassword(false);
    editForm.reset({
      fullName: user.full_name || "",
      organization: user.organization || "",
      role: user.team_role || "scout",
      newPassword: "",
    });
  };

  const onEditSubmit = (values: EditUserForm) => {
    if (!editingUser) return;
    editUserMutation.mutate({
      userId: editingUser.id,
      email: editingUser.email,
      fullName: values.fullName,
      organization: values.organization || "",
      role: values.role as TeamRole,
      newPassword: values.newPassword,
    });
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
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
                Create a new team member account with team tier subscription.
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="organization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
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
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="pl-10 pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <PasswordStrengthIndicator password={field.value} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser({ ...user, email: user.email })}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              {/* Password reset - only visible to team admins */}
                              {(profile?.team_role === 'team_admin' || isAdmin) && (
                                <DropdownMenuItem 
                                  onClick={() => handleResendInvitation(user.email)}
                                  disabled={resendingEmail === user.email}
                                >
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  {resendingEmail === user.email ? "Sending..." : "Reset Password"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setUserToDelete({ id: user.id, name: user.full_name || user.email });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update the team member's information.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
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
                <FormField
                  control={editForm.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
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
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Password Reset Section */}
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-sm font-medium">Reset Password</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="text-xs"
                    >
                      {showEditPassword ? "Cancel" : "Set New Password"}
                    </Button>
                  </div>
                  {showEditPassword && (
                    <FormField
                      control={editForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password (min 8 chars)"
                                className="pl-10 pr-10"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <PasswordStrengthIndicator password={field.value || ""} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editUserMutation.isPending}>
                    {editUserMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{userToDelete?.name}</strong> from the team? 
                This will permanently delete their account and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletingUserId !== null}
              >
                {deletingUserId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Member"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
