import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";

interface TeamLogoUploadProps {
  teamId: string;
  currentLogoUrl: string | null;
  onLogoUpdated: (url: string | null) => void;
}

export function TeamLogoUpload({ teamId, currentLogoUrl, onLogoUpdated }: TeamLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      // Delete existing logo if present
      if (currentLogoUrl) {
        const existingPath = currentLogoUrl.split('/').pop();
        if (existingPath) {
          await supabase.storage
            .from('team-logos')
            .remove([`${teamId}/${existingPath}`]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${teamId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team-logos')
        .getPublicUrl(filePath);

      // Update team record
      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: publicUrl })
        .eq('id', teamId);

      if (updateError) throw updateError;

      onLogoUpdated(publicUrl);
      toast.success('Team logo updated successfully');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;

    setIsRemoving(true);
    try {
      // Extract file path from URL
      const urlParts = currentLogoUrl.split('/team-logos/');
      if (urlParts[1]) {
        await supabase.storage
          .from('team-logos')
          .remove([urlParts[1]]);
      }

      // Update team record
      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: null })
        .eq('id', teamId);

      if (updateError) throw updateError;

      onLogoUpdated(null);
      toast.success('Team logo removed');
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error(error.message || 'Failed to remove logo');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 border-2 border-border">
        <AvatarImage src={currentLogoUrl || undefined} alt="Team logo" />
        <AvatarFallback className="bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {currentLogoUrl ? 'Change Logo' : 'Upload Logo'}
            </>
          )}
        </Button>

        {currentLogoUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveLogo}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Remove Logo
              </>
            )}
          </Button>
        )}
        
        <p className="text-xs text-muted-foreground">
          PNG, JPG up to 2MB. Will appear on reports.
        </p>
      </div>
    </div>
  );
}