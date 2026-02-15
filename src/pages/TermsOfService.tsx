import { ArrowLeft, Scale, FileText, AlertTriangle, CreditCard, Ban, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Separator } from "@/components/ui/separator";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background pitch-pattern">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-fade-in">
          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: January 2026
            </p>
          </div>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none text-muted-foreground">
              <p>
                By accessing or using The Football Scout platform, you agree to be bound by these 
                Terms of Service. If you disagree with any part of these terms, you may not 
                access the service.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Description of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                The Football Scout provides a digital platform for football scouts, coaches, 
                and talent managers to:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Create and manage player profiles</li>
                <li>Generate scouting reports with detailed attribute assessments</li>
                <li>Compare player performance metrics</li>
                <li>Collaborate with team members on scouting activities</li>
                <li>Access AI-powered insights and recommendations</li>
                <li>Export reports in various formats</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Subscription & Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Free Tier</h4>
                <p>Limited access to core features with usage restrictions as described on our pricing page.</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Paid Subscriptions</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Subscriptions are billed monthly or annually</li>
                  <li>Payments are processed securely via Stripe</li>
                  <li>Subscriptions auto-renew unless cancelled before the billing date</li>
                  <li>Price changes will be communicated 30 days in advance</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Refunds</h4>
                <p>
                  We offer a 14-day money-back guarantee for first-time subscribers. 
                  Contact support within 14 days of your first payment to request a refund.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-primary" />
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use the service for any unlawful purpose</li>
                <li>Share account credentials with unauthorized users</li>
                <li>Attempt to bypass security measures or access restrictions</li>
                <li>Scrape, crawl, or automate access to the platform</li>
                <li>Upload malicious code or content</li>
                <li>Impersonate other users or entities</li>
                <li>Violate player privacy or data protection regulations</li>
                <li>Use player data for purposes other than legitimate scouting activities</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                The Football Scout is provided "as is" without warranties of any kind. 
                We shall not be liable for:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Any indirect, incidental, or consequential damages</li>
                <li>Loss of data or business opportunities</li>
                <li>Decisions made based on scouting data or AI recommendations</li>
                <li>Service interruptions or downtime</li>
              </ul>
              <p className="mt-4">
                Our total liability shall not exceed the amount you paid for the service 
                in the 12 months preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Changes to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                We reserve the right to modify these terms at any time. We will notify 
                users of significant changes via email or in-app notification at least 
                30 days before the changes take effect. Continued use of the service 
                after changes constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                These Terms shall be governed by and construed in accordance with the 
                laws of the European Union. Any disputes shall be resolved in the courts 
                of the applicable jurisdiction.
              </p>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>
              Questions about these terms? Contact us at support@thefootballscout.app
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
