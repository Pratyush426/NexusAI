import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiGetProfile, apiUpdateProfile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';


export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
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
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const data = await apiGetProfile();
      if (!data?.success) return null;
      return data.profile as Profile | null;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user) throw new Error('Not authenticated');
      const data = await apiUpdateProfile(input);
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating profile', description: (error as Error).message, variant: 'destructive' });
    },
  });

  return { profile, isLoading, error, updateProfile };
}
