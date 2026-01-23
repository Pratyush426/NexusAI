import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  preferences: Record<string, unknown> | null;
  gmail_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  resume_url?: string;
  linkedin_url?: string;
  gmail_connected?: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/users/profile?email=${encodeURIComponent(user.email)}`);

      if (!response.ok) {
        if (response.status === 404) return null; // Profile not found is valid
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return data.profile as Profile | null;
    },
    enabled: !!user?.email,
  });

  const updateProfile = useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user?.email) throw new Error('Not authenticated');

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          ...input
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating profile', description: error.message, variant: 'destructive' });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
}
