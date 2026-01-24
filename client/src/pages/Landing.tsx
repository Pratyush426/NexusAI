import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  Briefcase,
  BarChart3,
  FileSearch,
  CheckCircle2,
  Mail,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

import FloatingLines from '@/components/backgrounds/FloatingLines';
import { CompanyMarquee } from '@/components/CompanyMarquee';
import { useApplications, ApplicationStatus } from '@/hooks/useApplications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { useMemo } from 'react';

const statusColors: Record<ApplicationStatus, string> = {
  applied: '#3B82F6',
  shortlisted: '#A855F7',
  interview: '#EAB308',
  selected: '#22C55E',
  rejected: '#EF4444',
};

const statusLabels: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  selected: 'Selected',
  rejected: 'Rejected',
};

function LandingStats() {
  const { applications, stats } = useApplications();

  const timelineData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const count = applications.filter((app) => {
        const appDate = startOfDay(new Date(app.applied_date));
        return appDate.getTime() === dayStart.getTime();
      }).length;

      return {
        date: format(day, 'MMM d'),
        applications: count,
      };
    });
  }, [applications]);

  const pieData = useMemo(() => {
    return (Object.keys(stats) as (keyof typeof stats)[])
      .filter((key) => key !== 'total' && stats[key] > 0)
      .map((key) => ({
        name: statusLabels[key as ApplicationStatus],
        value: stats[key as keyof typeof stats],
        color: statusColors[key as ApplicationStatus],
      }));
  }, [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 container py-10 animate-fade-in">
      {/* 1. Bar Chart */}
      {/* 1. Bar Chart */}
      <Card className="bg-background/20 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Pie Chart */}
      {/* 2. Pie Chart */}
      <Card className="bg-background/20 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No data
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Stats Summary */}
      {/* 3. Stats Summary */}
      <Card className="bg-background/20 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Applications</span>
              <span className="font-bold">{stats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shortlisted</span>
              <span className="font-bold text-primary">{stats.shortlisted}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Interviews</span>
              <span className="font-bold text-yellow-500">{stats.interview}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected</span>
              <span className="font-bold text-green-500">{stats.selected}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rejected</span>
              <span className="font-bold text-red-500">{stats.rejected}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function Landing() {
  const { user, loginLocal } = useAuth();
  const navigate = useNavigate();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(false);

  useEffect(() => {
    setIsGmailConnected(!!localStorage.getItem('nexusai_gmail_connected'));
  }, []);

  // Google Auth Configuration
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

  let tokenClient: any;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const initGoogle = async () => {
      // Initialize GAPI
      await (window as any).gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });

      // Initialize Token Client
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => { }, // set dynamically later
      });
    };

    // Wait until both scripts are available
    interval = setInterval(() => {
      if ((window as any).gapi && (window as any).google) {
        clearInterval(interval);
        (window as any).gapi.load("client", initGoogle);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const handleAuthClick = () => {
    if (!tokenClient) {
      // Re-init if needed (should check window.google first really)
      if ((window as any).google) {
        tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '',
        });
      } else {
        console.error("Google scripts not loaded yet");
        return;
      }
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        throw resp;
      }
      setIsAuthorizing(true);
      await listMessages();
      setIsAuthorizing(false);
      // Ensure local login state is preserved/set
      if (!user) {
        loginLocal();
      }
      localStorage.setItem('nexusai_gmail_connected', 'true');

      // Sync user to backend
      if (user) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          await fetch(`${API_URL}/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              gmail_connected: true
              // Add other fields if available in user metadata
            })
          });
        } catch (error) {
          console.error("Failed to sync user", error);
        }
      }

      setIsGmailConnected(true);
      window.location.reload(); // Refresh to update UI state properly
    };

    if ((window as any).gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const listMessages = async () => {
    try {
      const response = await (window as any).gapi.client.gmail.users.messages.list({
        'userId': 'me',
        'maxResults': 25,
        'labelIds': ['INBOX'],
      });

      const messages = response.result.messages;
      if (!messages) {
        alert('No messages found.');
        return;
      }

      for (const msg of messages) {
        const fullMessage = await getMessage(msg.id);
        const headers = fullMessage.payload.headers;
        const from = headers.find((h: any) => h.name === 'From')?.value || '';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';

        let body = '';
        if (fullMessage.payload.parts) {
          const part = fullMessage.payload.parts.find((p: any) => p.mimeType === 'text/plain');
          if (part && part.body && part.body.data) {
            body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        } else if (fullMessage.payload.body && fullMessage.payload.body.data) {
          body = atob(fullMessage.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }

        // Send to Backend
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        await fetch(`${API_URL}/api/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            MessageId: msg.id,
            from,
            date,
            subject,
            body
          })
        });
      }
      alert('Emails synchronized with NexusAI backend!');
    } catch (err: any) {
      console.error(err);
      alert('Error syncing emails: ' + err.message);
    }
  };

  const getMessage = async (messageId: string) => {
    const response = await (window as any).gapi.client.gmail.users.messages.get({
      'userId': 'me',
      'id': messageId,
      'format': 'full',
    });
    return response.result;
  };

  return (
    <div className="relative z-10 w-full min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background - Hero Only */}
        <div className="absolute inset-0 z-0">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={5}
            lineDistance={5}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={true}
            parallax={true}
          />
          {/* Readability overlay */}
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm pointer-events-none" />
        </div>

        <div className="container relative py-24 md:py-32 z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              From INBOX to INSIGHTS
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-brand font-bold tracking-tight mb-6">
              <span className="gradient-text">NexusAI</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              Track every job. Never miss an opportunity.
            </p>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              The modern job application tracker that helps you stay organized, monitor your progress, and land your dream job faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!user && (
                <Button size="lg" className="w-full sm:w-auto group" asChild>
                  <Link to="/auth?mode=signup">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
              {user ? (
                !isGmailConnected && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto gap-2"
                    onClick={handleAuthClick}
                    disabled={isAuthorizing}
                  >
                    {isAuthorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {isAuthorizing ? 'Syncing...' : 'Connect Gmail'}
                  </Button>
                )
              ) : (
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2" asChild>
                  <Link to="/auth?gmail=true">
                    <Mail className="h-4 w-4" />
                    Connect Gmail
                  </Link>
                </Button>
              )}
            </div>
          </div>
          {user && isGmailConnected && <LandingStats />}
        </div>
        <CompanyMarquee />
      </section>

      {/* Features Section */}
      <section className="relative overflow-hidden py-20 bg-background/50 backdrop-blur-sm">
        {/* Animated Background - Features */}
        <div className="absolute inset-0 z-0">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={5}
            lineDistance={5}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={true}
            parallax={true}
          />
          {/* Readability overlay */}
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm pointer-events-none" />
        </div>

        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything you need to track your job search
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you stay on top of every application and interview.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Briefcase,
                title: 'Application Tracking',
                description: 'Keep all your job applications organized in one place with status updates.',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Visualize your job search progress with beautiful charts and metrics.',
              },
              {
                icon: FileSearch,
                title: 'Smart Filters',
                description: 'Quickly find applications by status, company, or date with powerful filters.',
              },
              {
                icon: CheckCircle2,
                title: 'Status Updates',
                description: 'Track every stage from applied to offer with color-coded status badges.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border card-hover"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '50K+', label: 'Applications Tracked' },
              { value: '95%', label: 'User Satisfaction' },
              { value: '24/7', label: 'Always Available' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-display font-bold gradient-text">
                  {stat.value}
                </p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20 bg-primary/5">
        {/* Animated Background - CTA */}
        <div className="absolute inset-0 z-0">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={5}
            lineDistance={5}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={true}
            parallax={true}
          />
          {/* Readability overlay */}
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm pointer-events-none" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to organize your job search?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of job seekers who use NexusAI to land their dream jobs.
            </p>
            <Button size="lg" asChild>
              <Link to={user ? "/applications" : "/auth?mode=signup"}>
                {user ? "See Your Applications" : "Start Tracking for Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-black text-white">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">NexusAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NexusAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div >
  );
}
