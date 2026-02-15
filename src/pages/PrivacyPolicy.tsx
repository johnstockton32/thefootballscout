import { ArrowLeft, Shield, Lock, Database, UserCheck, Mail, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: January 2026
            </p>
          </div>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                The Football Scout ("we", "our", or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                information when you use our football scouting platform.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Name and email address when you create an account</li>
                  <li>Profile information you choose to provide</li>
                  <li>Organization or team affiliation</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Player Scouting Data</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Player names, positions, and physical attributes</li>
                  <li>Performance metrics and evaluations</li>
                  <li>Scouting reports and observations</li>
                  <li>Video clips and timestamps</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Usage Data</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Device and browser information</li>
                  <li>IP address and general location</li>
                  <li>Pages visited and features used</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                How We Protect Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>All data is encrypted in transit using TLS 1.3</li>
                <li>Data at rest is encrypted using AES-256</li>
                <li>Regular security audits and penetration testing</li>
                <li>Role-based access controls and Row Level Security (RLS)</li>
                <li>Data stored in EU-compliant data centers</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Your Rights Under GDPR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Under the General Data Protection Regulation (GDPR), you have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Right to Object:</strong> Object to processing of your data</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact our Data Protection Officer.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                If you have questions about this Privacy Policy or your personal data, please contact:
              </p>
              <div className="mt-4 p-4 rounded-lg bg-muted/50">
                <p><strong>Data Protection Officer</strong></p>
                <p>The Football Scout</p>
                <p>Email: support@thefootballscout.app</p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>
              This privacy policy is compliant with GDPR Article 13 and 14 requirements.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
