import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Loader2, ShieldCheck } from "lucide-react";

type AuthorizationDetails = {
  client?: { name?: string; client_name?: string; redirect_uri?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};

// The Supabase auth.oauth namespace is beta and may be missing from typings.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

function oauth(): OAuthApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.auth as any).oauth as OAuthApi;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in the request URL.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load authorization request.");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth().approveAuthorization(authorizationId)
        : await oauth().denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        setError(error.message);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("No redirect returned by the authorization server.");
        return;
      }
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Authorization failed.");
    }
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "an external app";
  const redirectUri = details?.client?.redirect_uri ?? details?.client?.redirect_uris?.[0];

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md card-glass">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3"><Logo /></div>
          <CardTitle className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Connect {clientName}
          </CardTitle>
          <CardDescription>
            This lets {clientName} use The Football Scout as you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
              {error}
            </div>
          )}

          {!details && !error && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading authorization request…
            </div>
          )}

          {details && (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-md bg-muted/50 border border-border">
                <p className="font-medium mb-1">{clientName} will be able to:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Read your scouted players and reports</li>
                  <li>Call this app's enabled scouting tools as you</li>
                </ul>
                {redirectUri && (
                  <p className="mt-3 text-xs text-muted-foreground break-all">
                    Redirect: <span className="font-mono">{redirectUri}</span>
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                This does not bypass this app's permissions or backend policies.
              </p>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => decide(true)} disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => decide(false)} disabled={busy}>
                  Cancel connection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
