import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FileText, Plus, Save, Trash2, ChevronDown, Star, Loader2 } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  template_data: Record<string, any>;
  is_default: boolean;
  created_at: string;
}

interface ReportTemplatesProps {
  onApplyTemplate: (templateData: Record<string, any>) => void;
  currentData?: Record<string, any>;
}

export function ReportTemplates({ onApplyTemplate, currentData }: ReportTemplatesProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      setTemplates(data as ReportTemplate[] || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!currentData) {
      toast.error('No data to save');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('report_templates').insert({
        user_id: user!.id,
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || null,
        template_data: currentData,
      });

      if (error) throw error;

      toast.success('Template saved');
      setIsSaveDialogOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const setAsDefault = async (templateId: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from('report_templates')
        .update({ is_default: false })
        .eq('user_id', user!.id);

      // Then set the new default
      const { error } = await supabase
        .from('report_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;
      toast.success('Default template updated');
      fetchTemplates();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default template');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Templates
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <p>No templates saved</p>
              <p className="text-xs mt-1">Save current values as a template</p>
            </div>
          ) : (
            templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex items-center justify-between cursor-pointer"
              >
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => onApplyTemplate(template.template_data)}
                >
                  {template.is_default && (
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{template.name}</p>
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right">
                    <DropdownMenuItem onClick={() => setAsDefault(template.id)}>
                      <Star className="w-4 h-4 mr-2" />
                      Set as default
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteTemplate(template.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="w-4 h-4 mr-2" />
                Save Current as Template
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Template</DialogTitle>
                <DialogDescription>
                  Save your current attribute values as a reusable template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Striker Focus, Defensive Review"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="What is this template for?"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveTemplate} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Template
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
