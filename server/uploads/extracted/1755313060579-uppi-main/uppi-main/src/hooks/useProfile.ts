import { useState, useEffect } from 'react';
import { UserProfile, ProfileUpdateRequest } from '@/types/profiles';
import { profileService } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await profileService.getCurrentProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdateRequest) => {
    try {
      setIsUpdating(true);
      const updatedProfile = await profileService.updateProfile(updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const createProfile = async (initialData?: Partial<ProfileUpdateRequest>) => {
    try {
      setIsUpdating(true);
      const newProfile = await profileService.createProfile(initialData);
      setProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteProfile = async () => {
    try {
      setIsUpdating(true);
      await profileService.deleteProfile();
      setProfile(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  // Computed properties
  const isProfileComplete = profile ? profileService.isProfileComplete(profile) : false;
  const completionPercentage = profile ? profileService.getProfileCompletionPercentage(profile) : 0;

  return {
    profile,
    isLoading,
    isUpdating,
    isProfileComplete,
    completionPercentage,
    updateProfile,
    createProfile,
    deleteProfile,
    refreshProfile,
    loadProfile
  };
};