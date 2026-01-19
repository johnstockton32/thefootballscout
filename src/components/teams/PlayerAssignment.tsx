import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, UserCheck, Loader2, ArrowRightLeft, Search, X } from "lucide-react";

interface PlayerAssignmentProps {
  teamId: string;
}

interface TeamPlayer {
  id: string;
  full_name: string;
  position: string;
  current_club: string | null;
  photo_url: string | null;
  scout_id: string;
  scout_name: string | null;
}

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  team_role: string | null;
}

export function PlayerAssignment({ teamId }: PlayerAssignmentProps) {
  const queryClient = useQueryClient();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedScout, setSelectedScout] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch team members (scouts)
  const { data: teamMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["team-members-for-assignment", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, team_role")
        .eq("team_id", teamId);

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!teamId,
  });

  // Fetch players belonging to team members
  const { data: teamPlayers, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["team-players-for-assignment", teamId, teamMembers],
    queryFn: async () => {
      if (!teamMembers || teamMembers.length === 0) return [];

      const memberIds = teamMembers.map(m => m.id);
      
      const { data: players, error } = await supabase
        .from("players")
        .select("id, full_name, position, current_club, photo_url, scout_id")
        .in("scout_id", memberIds)
        .order("full_name", { ascending: true });

      if (error) throw error;

      // Map players with scout names
      return players.map(player => {
        const scout = teamMembers.find(m => m.id === player.scout_id);
        return {
          ...player,
          scout_name: scout?.full_name || scout?.email || "Unassigned",
        } as TeamPlayer;
      });
    },
    enabled: !!teamId && !!teamMembers && teamMembers.length > 0,
  });

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    if (!teamPlayers) return [];
    if (!searchQuery.trim()) return teamPlayers;

    const query = searchQuery.toLowerCase().trim();
    return teamPlayers.filter(player => 
      player.full_name.toLowerCase().includes(query) ||
      player.position.toLowerCase().includes(query) ||
      (player.current_club && player.current_club.toLowerCase().includes(query)) ||
      (player.scout_name && player.scout_name.toLowerCase().includes(query))
    );
  }, [teamPlayers, searchQuery]);

  // Assign player mutation
  const assignPlayerMutation = useMutation({
    mutationFn: async ({ playerId, newScoutId }: { playerId: string; newScoutId: string }) => {
      const { error } = await supabase
        .from("players")
        .update({ scout_id: newScoutId })
        .eq("id", playerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Player assigned successfully!");
      setSelectedPlayer(null);
      setSelectedScout(null);
      queryClient.invalidateQueries({ queryKey: ["team-players-for-assignment"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign player");
    },
  });

  const handleAssign = () => {
    if (!selectedPlayer || !selectedScout) {
      toast.error("Please select both a player and a scout");
      return;
    }
    assignPlayerMutation.mutate({ playerId: selectedPlayer, newScoutId: selectedScout });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      goalkeeper: "GK",
      centre_back: "CB",
      full_back: "FB",
      defensive_midfielder: "DM",
      central_midfielder: "CM",
      attacking_midfielder: "AM",
      winger: "WG",
      striker: "ST",
    };
    return labels[position] || position;
  };

  if (isLoadingMembers || isLoadingPlayers) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!teamPlayers || teamPlayers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Player Assignment
          </CardTitle>
          <CardDescription>
            Reassign players between team scouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No players found in the team</p>
            <p className="text-sm text-muted-foreground mt-1">
              Team scouts need to add players first before they can be reassigned
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Player Assignment
        </CardTitle>
        <CardDescription>
          Reassign players between team scouts ({teamPlayers.length} players total)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Section */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players by name, position, club, or scout..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Assign Section */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg">
          <Select value={selectedPlayer || ""} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a player..." />
            </SelectTrigger>
            <SelectContent>
              {filteredPlayers.map(player => (
                <SelectItem key={player.id} value={player.id}>
                  <div className="flex items-center gap-2">
                    <span>{player.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {getPositionLabel(player.position)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedScout || ""} onValueChange={setSelectedScout}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Assign to scout..." />
            </SelectTrigger>
            <SelectContent>
              {teamMembers?.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <span>{member.full_name || member.email}</span>
                    {member.team_role && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {member.team_role.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleAssign}
            disabled={!selectedPlayer || !selectedScout || assignPlayerMutation.isPending}
            className="shrink-0"
          >
            {assignPlayerMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Assign
          </Button>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredPlayers.length} of {teamPlayers.length} players
          </p>
        )}

        {/* Players Table */}
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-8 border rounded-md">
            <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-muted-foreground">No players match your search</p>
            <Button
              variant="link"
              onClick={() => setSearchQuery("")}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Current Scout</TableHead>
                  <TableHead className="text-right">Reassign To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map(player => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.photo_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(player.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPositionLabel(player.position)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {player.current_club || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{player.scout_name}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={player.scout_id}
                        onValueChange={(newScoutId) => {
                          if (newScoutId !== player.scout_id) {
                            assignPlayerMutation.mutate({ 
                              playerId: player.id, 
                              newScoutId 
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers?.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name || member.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
