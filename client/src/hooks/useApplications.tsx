import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiGetEmails, apiGetApplications } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';
const getToken = () => localStorage.getItem('nexusai_token');
const authFetch = (url: string, opts: RequestInit = {}) =>
  fetch(`${API_BASE}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}), ...(opts.headers || {}) },
  });


export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'selected' | 'rejected';

export interface Application {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  status: ApplicationStatus;
  applied_via: string | null;
  applied_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationInput {
  job_title: string;
  company_name: string;
  status?: ApplicationStatus;
  applied_via?: string;
  applied_date?: string;
  notes?: string;
}

const VALID_STATUSES = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];

export function useApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['applications', user?.id],
    queryFn: async () => {
      const [emailsJson, appsJson] = await Promise.all([
        apiGetEmails(),
        apiGetApplications()
      ]);

      if (!emailsJson.success) throw new Error(emailsJson.error || 'Failed to fetch emails');
      if (!appsJson.success) throw new Error(appsJson.error || 'Failed to fetch applications');

      interface GmailEmailDocument {
        _id: string;
        userId?: string;
        jobRole?: string;
        subject?: string;
        companyName?: string;
        status?: string;
        appliedFrom?: string;
        extractDate?: string;
        date?: string;
        body?: string;
      }

      interface ManualApplicationDocument {
        _id: string;
        userId: string;
        job_title: string;
        company_name: string;
        status: string;
        applied_via?: string;
        applied_date: string;
        notes?: string;
        createdAt: string;
        updatedAt: string;
      }

      // Map MongoDB email documents → Application interface
      const emailApps = emailsJson.data.map((email: GmailEmailDocument): Application => ({
        id: email._id,
        user_id: email.userId || user?.id || 'unknown',
        job_title: email.jobRole !== 'unknown' ? (email.jobRole || 'Unknown Role') : (email.subject || 'Unknown Role'),
        company_name: email.companyName || 'Unknown Company',
        status: (VALID_STATUSES.includes(email.status?.toLowerCase() || '')
          ? email.status!.toLowerCase()
          : 'applied') as ApplicationStatus,
        applied_via: email.appliedFrom || 'Email',
        applied_date: email.extractDate || email.date || new Date().toISOString(),
        notes: email.body || null,
        created_at: email.date || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Map manual Application documents → Application interface
      const manualApps = appsJson.data.map((app: ManualApplicationDocument): Application => ({
        id: app._id,
        user_id: app.userId,
        job_title: app.job_title,
        company_name: app.company_name,
        status: (VALID_STATUSES.includes(app.status?.toLowerCase() || '')
          ? app.status.toLowerCase()
          : 'applied') as ApplicationStatus,
        applied_via: app.applied_via || 'Manual',
        applied_date: app.applied_date,
        notes: app.notes || null,
        created_at: app.createdAt,
        updated_at: app.updatedAt,
      }));

      // Merge and sort by applied_date descending
      return [...emailApps, ...manualApps].sort(
        (a, b) => new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime()
      );
    },
    enabled: !!user, // Only fetch when logged in
    retry: false,
  });

  // DELETE an application from MongoDB
  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete application');
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['applications', user?.id] });
      const previous = queryClient.getQueryData<Application[]>(['applications', user?.id]);
      queryClient.setQueryData<Application[]>(['applications', user?.id], (old) =>
        old?.filter(app => app.id !== id) || []
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['applications', user?.id], context.previous);
      }
      toast({ title: 'Error deleting application', description: (err as Error).message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] });
    },
    onSuccess: () => {
      toast({ title: 'Application removed' });
    }
  });

  // CREATE a manual application (saved to MongoDB)
  const createApplication = useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      if (!user) throw new Error('Not authenticated');
      const res = await authFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create application');
      return res.json();
    },
    onMutate: async (newApp) => {
      await queryClient.cancelQueries({ queryKey: ['applications', user?.id] });
      const previous = queryClient.getQueryData<Application[]>(['applications', user?.id]);
      const optimistic: Application = {
        id: `temp-${Math.random()}`,
        user_id: user?.id || 'temp',
        job_title: newApp.job_title,
        company_name: newApp.company_name,
        status: newApp.status || 'applied',
        applied_via: newApp.applied_via || 'Manual',
        applied_date: newApp.applied_date || new Date().toISOString(),
        notes: newApp.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Application[]>(['applications', user?.id], (old) => [
        ...(old || []),
        optimistic,
      ]);
      return { previous };
    },
    onError: (err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['applications', user?.id], context.previous);
      }
      toast({ title: 'Error adding application', description: (err as Error).message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] });
    },
    onSuccess: () => {
      toast({ title: 'Application added successfully' });
    }
  });

  const updateApplication = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Application> & { id: string }) => {
      const res = await authFetch(`/api/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update application');
      return res.json();
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['applications', user?.id] });
      const previous = queryClient.getQueryData<Application[]>(['applications', user?.id]);
      queryClient.setQueryData<Application[]>(['applications', user?.id], (old) =>
        old?.map(app => app.id === updated.id ? { ...app, ...updated } : app) || []
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['applications', user?.id], context.previous);
      }
      toast({ title: 'Error updating application', description: (err as Error).message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] });
    },
    onSuccess: () => {
      toast({ title: 'Application updated' });
    }
  });

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interview: applications.filter(a => a.status === 'interview').length,
    selected: applications.filter(a => a.status === 'selected').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return {
    applications,
    isLoading,
    error,
    stats,
    createApplication,
    updateApplication,
    deleteApplication,
  };
}
