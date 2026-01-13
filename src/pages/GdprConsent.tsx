import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle2, FileText, Lock, Database, UserCheck, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";

const GdprConsent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [consents, setConsents] = useState({
    dataProcessing: false,
    dataStorage: false,
    privacyPolicy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allConsentsGiven = consents.dataProcessing && consents.dataStorage && consents.privacyPolicy;

  const handleConsentChange = (key: keyof typeof consents) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!allConsentsGiven) return;

    setIsSubmitting(true);
    try {
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            gdpr_consent: true,
            gdpr_consent_date: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) throw error;
      }

      toast({
        title: "Consent recorded",
        description: "Thank you for reviewing our data practices.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save consent",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const consentItems = [
    {
      key: "dataProcessing" as const,
      icon: Database,
      title: "Data Processing",
      description: "I consent to the processing of player scouting data, including personal information, performance metrics, and evaluations for talent identification purposes.",
    },
    {
      key: "dataStorage" as const,
      icon: Lock,
      title: "Data Storage & Security",
      description: "I understand that my data will be stored securely on encrypted servers within the EU and may be retained for the duration of my account plus 5 years as required by sports governing bodies.",
    },
    {
      key: "privacyPolicy" as const,
      icon: FileText,
      title: "Privacy Policy",
      description: "I have read and agree to the Privacy Policy, including my rights to access, rectify, erase, and port my personal data under GDPR.",
    },
  ];

  const dataRights = [
    { icon: UserCheck, title: "Right to Access", description: "Request a copy of your personal data" },
    { icon: FileText, title: "Right to Rectification", description: "Correct inaccurate personal data" },
    { icon: Database, title: "Right to Erasure", description: "Request deletion of your data" },
    { icon: Lock, title: "Right to Portability", description: "Receive your data in a portable format" },
  ];

  return (
    <div className="min-h-screen bg-background pitch-pattern flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-fade-in">
          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">GDPR Consent & Data Privacy</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We take your privacy seriously. Please review our data handling practices and provide your consent to continue using The Football Scout platform.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Consent Form */}
            <Card className="lg:col-span-2 card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Required Consents
                </CardTitle>
                <CardDescription>
                  Please review and accept each item to proceed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {consentItems.map((item) => (
                  <div
                    key={item.key}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      consents[item.key]
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                    onClick={() => handleConsentChange(item.key)}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={consents[item.key]}
                        onCheckedChange={() => handleConsentChange(item.key)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <Separator className="my-6" />

                <Button
                  onClick={handleSubmit}
                  disabled={!allConsentsGiven || isSubmitting}
                  className="w-full"
                  variant="hero"
                  size="lg"
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : (
                    <>
                      Accept & Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {!allConsentsGiven && (
                  <p className="text-sm text-muted-foreground text-center">
                    Please accept all consents to continue
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Your Rights Sidebar */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg">Your Data Rights</CardTitle>
                <CardDescription>Under GDPR, you have the following rights</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {dataRights.map((right, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <right.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{right.title}</h4>
                          <p className="text-xs text-muted-foreground">{right.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Questions about your data?
                  </p>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Mail className="h-3 w-3" />
                    Contact DPO
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>
              This consent is recorded and stored in accordance with GDPR Article 7.
              You may withdraw your consent at any time through your account settings.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GdprConsent;
