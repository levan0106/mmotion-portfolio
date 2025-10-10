import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PermissionApi, CreatePermissionRequest, UpdatePermissionRequest } from '../services/api.role';

/**
 * Hook for permission management
 */
export const usePermissions = () => {
  const queryClient = useQueryClient();

  // Get all permissions
  const {
    data: permissions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['permissions'],
    queryFn: PermissionApi.getPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get permissions by category
  const {
    data: permissionsByCategory,
    isLoading: isLoadingByCategory,
    error: categoryError,
    refetch: refetchByCategory
  } = useQuery({
    queryKey: ['permissionsByCategory'],
    queryFn: PermissionApi.getPermissionsByCategory,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get permission categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useQuery({
    queryKey: ['permissionCategories'],
    queryFn: PermissionApi.getPermissionCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Search permissions
  const searchPermissions = (query: string) => {
    return useQuery({
      queryKey: ['permissionsSearch', query],
      queryFn: () => PermissionApi.searchPermissions(query),
      enabled: !!query && query.length > 2,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: (permissionData: CreatePermissionRequest) => PermissionApi.createPermission(permissionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permissionsByCategory'] });
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: ({ permissionId, permissionData }: { permissionId: string; permissionData: UpdatePermissionRequest }) =>
      PermissionApi.updatePermission(permissionId, permissionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permissionsByCategory'] });
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId: string) => PermissionApi.deletePermission(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permissionsByCategory'] });
    },
  });

  return {
    // Data
    permissions,
    permissionsByCategory,
    categories,
    
    // Loading states
    isLoading,
    isLoadingByCategory,
    isLoadingCategories,
    isLoadingAny: isLoading || isLoadingByCategory || isLoadingCategories,
    
    // Errors
    error,
    categoryError,
    categoriesError,
    hasError: !!(error || categoryError || categoriesError),
    
    // Actions
    createPermission: createPermissionMutation.mutate,
    updatePermission: updatePermissionMutation.mutate,
    deletePermission: deletePermissionMutation.mutate,
    searchPermissions,
    refetch,
    refetchByCategory,
    
    // Loading states for mutations
    isCreating: createPermissionMutation.isLoading,
    isUpdating: updatePermissionMutation.isLoading,
    isDeleting: deletePermissionMutation.isLoading,
    
    // Errors for mutations
    createError: createPermissionMutation.error,
    updateError: updatePermissionMutation.error,
    deleteError: deletePermissionMutation.error,
  };
};

/**
 * Hook for individual permission management
 */
export const usePermission = (permissionId: string) => {

  // Get permission details
  const {
    data: permission,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['permission', permissionId],
    queryFn: () => PermissionApi.getPermission(permissionId),
    enabled: !!permissionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    // Data
    permission,
    
    // Loading states
    isLoading,
    
    // Errors
    error,
    
    // Actions
    refetch,
  };
};

/**
 * Hook for permission search
 */
export const usePermissionSearch = (query: string) => {
  const {
    data: searchResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['permissionsSearch', query],
    queryFn: () => PermissionApi.searchPermissions(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    searchResults,
    isLoading,
    error,
    refetch,
  };
};
