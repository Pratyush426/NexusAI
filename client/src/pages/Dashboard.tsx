
import { Navbar } from '@/components/Navbar';
import { StatCard } from '@/components/StatCard';
import { DashboardCharts } from '@/components/DashboardCharts';
import { RecentApplications } from '@/components/RecentApplications';
import { ApplicationForm } from '@/components/ApplicationForm';
import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import {
  FileText,
  Send,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function Dashboard() {
  const { stats, isLoading } = useApplications();
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

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
          <ApplicationForm />
        </div>

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
