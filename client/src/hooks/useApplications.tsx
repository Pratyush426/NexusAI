import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['applications', user?.id],
    queryFn: async () => {
      // Fetch from local backend
      const res = await fetch(`${API_URL}/api/all`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error || 'Failed to fetch');

      // Map MongoDB data to Application interface
      return json.data.map((email: any) => ({
        id: email._id,
        user_id: 'local',
        job_title: email.jobRole || email.subject || 'Unknown Role',
        company_name: email.companyName || 'Unknown Company',
        status: (['applied', 'shortlisted', 'interview', 'selected', 'rejected'].includes(email.status?.toLowerCase())
          ? email.status.toLowerCase()
          : 'applied') as ApplicationStatus,
        applied_via: email.appliedFrom || 'Email',
        applied_date: email.extractDate || email.date || new Date().toISOString(),
        notes: email.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as Application[];
    },
    // Remove dependency on user for now to show public data
    // enabled: !!user,
  });

  const createApplication = useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('applications')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Application added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding application', description: error.message, variant: 'destructive' });
    },
  });

  const updateApplication = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Application> & { id: string }) => {
      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Application updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating application', description: error.message, variant: 'destructive' });
    },
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Application deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting application', description: error.message, variant: 'destructive' });
    },
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
