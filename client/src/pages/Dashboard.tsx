
import { Navbar } from '@/components/Navbar';
import { StatCard } from '@/components/StatCard';
import { DashboardCharts } from '@/components/DashboardCharts';
import { RecentApplications } from '@/components/RecentApplications';
import { ApplicationForm } from '@/components/ApplicationForm';
import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useGmailSync } from '@/hooks/useGmailSync';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Send,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Mail,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const { stats, isLoading } = useApplications();
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile, updateProfile } = useProfile();
  const { handleGmailSync, isGmailSyncing } = useGmailSync();
  const queryClient = useQueryClient();

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const handleSyncClick = () => {
    handleGmailSync(() => {
      // Invalidate queries to refresh the list of applications
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] });
      // Update profile status
      updateProfile.mutate({ gmail_connected: true });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Welcome back, {firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your job search progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profile?.gmail_connected && (
              <Button
                variant="outline"
                className="flex items-center gap-2 border-white/5 bg-slate-950/40 hover:bg-slate-900/60"
                onClick={handleSyncClick}
                disabled={isGmailSyncing}
              >
                <RefreshCw className={`h-4 w-4 ${isGmailSyncing ? 'animate-spin' : ''}`} />
                {isGmailSyncing ? 'Syncing...' : 'Sync Gmail'}
              </Button>
            )}
            <ApplicationForm />
          </div>
        </div>

        {/* Gmail CTA Banner */}
        {!isLoadingProfile && profile && !profile.gmail_connected && (
          <div className="relative overflow-hidden bg-slate-950/40 border border-indigo-500/20 backdrop-blur-xl rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
            
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                ⚡ Automate Your Tracker
              </div>
              <h2 className="text-xl font-bold text-white">Connect Gmail to Auto-Track Applications</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                NexusAI uses Llama 3 models to safely and automatically parse your email receipts and update confirmations, keeping your dashboard up-to-date without lifting a finger.
              </p>
            </div>
            
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-300"
              onClick={handleSyncClick}
              disabled={isGmailSyncing}
            >
              <Mail className="h-4 w-4" />
              {isGmailSyncing ? 'Syncing Inbox...' : 'Connect Gmail Inbox'}
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Total"
            value={isLoading ? 0 : stats.total}
            icon={<FileText className="h-5 w-5" />}
            variant="default"
          />
          <StatCard
            title="Applied"
            value={isLoading ? 0 : stats.applied}
            icon={<Send className="h-5 w-5" />}
            variant="applied"
          />
          <StatCard
            title="Shortlisted"
            value={isLoading ? 0 : stats.shortlisted}
            icon={<Star className="h-5 w-5" />}
            variant="shortlisted"
          />
          <StatCard
            title="Interviews"
            value={isLoading ? 0 : stats.interview}
            icon={<Calendar className="h-5 w-5" />}
            variant="interview"
          />
          <StatCard
            title="Selected"
            value={isLoading ? 0 : stats.selected}
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="selected"
          />
          <StatCard
            title="Rejected"
            value={isLoading ? 0 : stats.rejected}
            icon={<XCircle className="h-5 w-5" />}
            variant="rejected"
          />
        </div>

        {/* Charts */}
        <div className="mb-8">
          <DashboardCharts />
        </div>

        {/* Recent Applications */}
        <RecentApplications />
      </main>
    </div>
  );
}
