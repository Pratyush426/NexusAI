import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useApplications } from '@/hooks/useApplications';
import { useGmailSync } from '@/hooks/useGmailSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Link as LinkIcon,
  Linkedin,
  Calendar,
  FileText,
  RefreshCw,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const { stats } = useApplications();
  const { handleGmailSync, isGmailSyncing } = useGmailSync();

  const [fullName, setFullName] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setResumeUrl(profile.resume_url || '');
      setLinkedinUrl(profile.linkedin_url || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile.mutateAsync({
      full_name: fullName,
      resume_url: resumeUrl,
      linkedin_url: linkedinUrl,
    });
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                    {(profile?.full_name || user?.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-2xl font-display font-bold">
                    {profile?.full_name || 'Your Profile'}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4" />
                    Member since{' '}
                    {profile?.created_at
                      ? format(new Date(profile.created_at), 'MMMM yyyy')
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Applications</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <RefreshCw className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Last synced</p>
                    <p className="text-sm text-muted-foreground">Just now</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <div className={`h-2 w-2 rounded-full ${profile?.gmail_connected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                <span className="text-sm">
                  Gmail {profile?.gmail_connected ? 'connected' : 'not connected'}
                </span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ml-auto text-primary"
                  onClick={() => handleGmailSync(() => updateProfile.mutateAsync({ gmail_connected: true }))}
                  disabled={isGmailSyncing}
                >
                  {isGmailSyncing ? 'Syncing...' : profile?.gmail_connected ? 'Sync Again' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Edit Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resumeUrl">Resume URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resumeUrl"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/your-resume"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedinUrl"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
