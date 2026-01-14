import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  Users,
  FileText,
  UserPlus,
  Star,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

interface TeamActivity {
  id: string;
  user_id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    photo_url: string | null;
  };
}

const activityIcons: Record<string, React.ReactNode> = {
  player_created: <UserPlus className="w-4 h-4 text-green-500" />,
  report_created: <FileText className="w-4 h-4 text-blue-500" />,
  player_updated: <Users className="w-4 h-4 text-yellow-500" />,
  report_updated: <FileText className="w-4 h-4 text-yellow-500" />,
  watchlist_updated: <Star className="w-4 h-4 text-purple-500" />,
  insight_generated: <TrendingUp className="w-4 h-4 text-primary" />,
};

export default function TeamFeed() {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const teamId = profile ? (profile as any).team_id : null;

  useEffect(() => {
    if (user && teamId) {
      fetchActivities();
      subscribeToActivities();
    } else {
      setIsLoading(false);
    }
  }, [user, teamId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('team_activity')
        .select(`
          *,
          profiles:user_id (
            full_name,
            photo_url
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data as unknown as TeamActivity[] || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToActivities = () => {
    const channel = supabase
      .channel('team-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_activity',
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          // Fetch the new activity with user info
          const { data } = await supabase
            .from('team_activity')
            .select(`
              *,
              profiles:user_id (
                full_name,
                photo_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setActivities((prev) => [data as unknown as TeamActivity, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getEntityLink = (activity: TeamActivity) => {
    if (!activity.entity_id) return null;
    switch (activity.entity_type) {
      case 'player':
        return `/players/${activity.entity_id}`;
      case 'report':
        return `/reports/${activity.entity_id}`;
      default:
        return null;
    }
  };

  if (!teamId) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Team Feed</h1>
            <p className="text-muted-foreground mt-1">
              See what your team is working on
            </p>
          </div>

          <Card className="card-glass">
            <CardContent className="py-16 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Team Yet</h3>
              <p className="text-muted-foreground mb-6">
                Join or create a team to see activity from your colleagues
              </p>
              <Badge variant="secondary">Team tier required</Badge>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Team Feed</h1>
          <p className="text-muted-foreground mt-1">
            Real-time updates from your team
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <Card className="card-glass">
            <CardContent className="py-16 text-center">
              <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Activity from your team will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const link = getEntityLink(activity);
              const Content = (
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.profiles?.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(activity.profiles?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {activity.profiles?.full_name || 'Unknown User'}
                      </span>
                      {activityIcons[activity.activity_type] || (
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">
                        {activity.description || activity.activity_type.replace('_', ' ')}
                      </span>
                    </div>
                    {activity.entity_name && (
                      <p className="text-sm font-medium text-primary mt-1">
                        {activity.entity_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );

              return (
                <Card key={activity.id} className="card-glass hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    {link ? (
                      <Link to={link} className="block">
                        {Content}
                      </Link>
                    ) : (
                      Content
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
