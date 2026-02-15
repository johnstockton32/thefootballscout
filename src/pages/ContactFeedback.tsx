import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Send, MessageSquare, Star, Mail, Lightbulb, Bug, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const feedbackCategories = [
  { value: 'general', label: 'General Experience', icon: ThumbsUp },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb },
  { value: 'bug_report', label: 'Bug Report', icon: Bug },
  { value: 'ui_ux', label: 'UI / UX', icon: MessageSquare },
];

export default function ContactFeedback() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: profile?.full_name || '',
    email: profile?.email || '',
    subject: '',
    message: '',
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Feedback state
  const [feedbackForm, setFeedbackForm] = useState({
    category: '',
    rating: 0,
    feedback: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.subject.trim() || !contactForm.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    if (contactForm.message.length > 2000) {
      toast.error('Message must be under 2000 characters');
      return;
    }

    setContactSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        user_id: user!.id,
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
        message_type: 'contact',
      });

      if (error) throw error;

      toast.success('Message sent! We\'ll get back to you soon.');
      setContactForm(prev => ({ ...prev, subject: '', message: '' }));
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.category || !feedbackForm.feedback.trim() || feedbackForm.rating === 0) {
      toast.error('Please select a category, rating, and provide feedback');
      return;
    }
    if (feedbackForm.feedback.length > 2000) {
      toast.error('Feedback must be under 2000 characters');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const { error } = await supabase.from('feature_feedback').insert({
        user_id: user!.id,
        category: feedbackForm.category,
        rating: feedbackForm.rating,
        feedback: feedbackForm.feedback.trim(),
      });

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      setFeedbackForm({ category: '', rating: 0, feedback: '' });
      setHoveredStar(0);
    } catch (error: any) {
      console.error('Feedback error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Contact & Feedback</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Get in touch or help us improve the platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Us */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5 text-primary" />
                Contact Us
              </CardTitle>
              <CardDescription>
                Have a question or need support? Send us a message and we'll respond within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                      id="contact-name"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      maxLength={255}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input
                    id="contact-subject"
                    placeholder="How can we help?"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    maxLength={200}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Tell us more about your inquiry..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    maxLength={2000}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {contactForm.message.length}/2000
                  </p>
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={contactSubmitting}>
                  {contactSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Message
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  You can also reach us directly at{' '}
                  <a href="mailto:support@thefootballscout.app" className="text-primary hover:underline font-medium">
                    support@thefootballscout.app
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature Feedback */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
                App Feedback
              </CardTitle>
              <CardDescription>
                Help us build a better scouting platform. Share your thoughts on features, usability, or report issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackCategories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = feedbackForm.category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFeedbackForm(prev => ({ ...prev, category: cat.value }))}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all text-left',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Star Rating */}
                <div className="space-y-2">
                  <Label>Overall Rating</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            'w-7 h-7 transition-colors',
                            (hoveredStar || feedbackForm.rating) >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      </button>
                    ))}
                    {feedbackForm.rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {feedbackForm.rating}/5
                      </span>
                    )}
                  </div>
                </div>

                {/* Feedback Text */}
                <div className="space-y-2">
                  <Label htmlFor="feedback-text">Your Feedback</Label>
                  <Textarea
                    id="feedback-text"
                    placeholder={
                      feedbackForm.category === 'feature_request'
                        ? 'Describe the feature you\'d like to see...'
                        : feedbackForm.category === 'bug_report'
                        ? 'Describe the issue and steps to reproduce...'
                        : 'Share your thoughts on the app...'
                    }
                    value={feedbackForm.feedback}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
                    maxLength={2000}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {feedbackForm.feedback.length}/2000
                  </p>
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={feedbackSubmitting}>
                  {feedbackSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
