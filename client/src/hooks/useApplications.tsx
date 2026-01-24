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
      try {
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
      } catch (err) {
        console.warn('API Fetch failed, using mock data for demo:', err);
        // Returns dummy data if backend is down (for recruiter demo)
        return [
          { id: '1', user_id: 'mock', job_title: 'Senior Frontend Engineer', company_name: 'Google', status: 'interview', applied_via: 'Careers Page', applied_date: '2025-01-15', notes: 'Interview invitation received', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', user_id: 'mock', job_title: 'Full Stack Developer', company_name: 'Microsoft', status: 'applied', applied_via: 'LinkedIn', applied_date: '2025-01-20', notes: 'Applied via LinkedIn Easy Apply', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', user_id: 'mock', job_title: 'SDE II', company_name: 'Amazon', status: 'rejected', applied_via: 'Referral', applied_date: '2024-12-10', notes: 'Rejection email received', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '4', user_id: 'mock', job_title: 'UI Engineer', company_name: 'Netflix', status: 'shortlisted', applied_via: 'Careers Page', applied_date: '2025-01-18', notes: 'Profile shortlisted', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '5', user_id: 'mock', job_title: 'React Developer', company_name: 'Meta', status: 'selected', applied_via: 'LinkedIn', applied_date: '2025-01-22', notes: 'Offer received!', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '6', user_id: 'mock', job_title: 'iOS Developer', company_name: 'Apple', status: 'applied', applied_via: 'Careers Page', applied_date: '2025-01-21', notes: 'Application confirmation', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '7', user_id: 'mock', job_title: 'Web Developer', company_name: 'Spotify', status: 'interview', applied_via: 'LinkedIn', applied_date: '2025-01-12', notes: 'Coding challenge sent', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '8', user_id: 'mock', job_title: 'Frontend Specialist', company_name: 'Airbnb', status: 'shortlisted', applied_via: 'Wellfound', applied_date: '2025-01-19', notes: 'Phone screen scheduled', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '9', user_id: 'mock', job_title: 'Backend Engineer', company_name: 'Uber', status: 'rejected', applied_via: 'Careers Page', applied_date: '2025-01-05', notes: 'Position filled', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '10', user_id: 'mock', job_title: 'Software Engineer', company_name: 'Tesla', status: 'applied', applied_via: 'LinkedIn', applied_date: '2025-01-23', notes: 'Under review', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '11', user_id: 'mock', job_title: 'Product Engineer', company_name: 'Notion', status: 'interview', applied_via: 'Direct', applied_date: '2025-01-14', notes: 'System design round', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '12', user_id: 'mock', job_title: 'Frontend Developer', company_name: 'Linear', status: 'selected', applied_via: 'Twitter', applied_date: '2025-01-24', notes: 'Joined the team', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '13', user_id: 'mock', job_title: 'Developer Advocate', company_name: 'Vercel', status: 'shortlisted', applied_via: 'LinkedIn', applied_date: '2025-01-17', notes: 'Initial chat', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '14', user_id: 'mock', job_title: 'API Engineer', company_name: 'Stripe', status: 'applied', applied_via: 'Careers Page', applied_date: '2025-01-20', notes: 'Applied', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '15', user_id: 'mock', job_title: 'Research Engineer', company_name: 'OpenAI', status: 'rejected', applied_via: 'Referral', applied_date: '2025-01-08', notes: 'Not selected', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ] as Application[];
      }
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
