import { useQuery, useMutation, useQueryClient } from 'react-query';
import { UserApi, AssignUserRoleRequest, UpdateUserRoleRequest, UserSearchParams } from '../services/api.user';

/**
 * Hook for user management
 */
export const useUsers = (params?: UserSearchParams) => {

  // Get users
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users', params],
    queryFn: () => UserApi.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Search users
  const searchUsers = (query: string, filters?: Partial<UserSearchParams>) => {
    return UserApi.searchUsers(query, filters);
  };

  // Get user by ID
  const getUser = (userId: string) => {
    return UserApi.getUser(userId);
  };

  // Get user statistics
  const {
    data: userStats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['userStats'],
    queryFn: UserApi.getUserStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    // Data
    users: usersResponse?.users || [],
    total: usersResponse?.total || 0,
    page: usersResponse?.page || 1,
    limit: usersResponse?.limit || 10,
    totalPages: usersResponse?.totalPages || 0,
    userStats,
    
    // Loading states
    isLoading,
    isLoadingStats,
    
    // Errors
    error,
    statsError,
    hasError: !!(error || statsError),
    
    // Actions
    searchUsers,
    getUser,
    refetch,
  };
};

/**
 * Hook for user role management
 */
export const useUserRoles = (userId?: string) => {
  const queryClient = useQueryClient();

  // Get user roles
  const {
    data: userRoles,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: () => UserApi.getUserRoles(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Assign user to role mutation
  const assignUserToRoleMutation = useMutation({
    mutationFn: (assignment: AssignUserRoleRequest) => UserApi.assignUserToRole(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Remove user from role mutation
  const removeUserFromRoleMutation = useMutation({
    mutationFn: (userRoleId: string) => UserApi.removeUserFromRole(userRoleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userRoleId, updates }: { userRoleId: string; updates: UpdateUserRoleRequest }) =>
      UserApi.updateUserRole(userRoleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    // Data
    userRoles,
    
    // Loading states
    isLoading,
    isAssigning: assignUserToRoleMutation.isLoading,
    isRemoving: removeUserFromRoleMutation.isLoading,
    isUpdating: updateUserRoleMutation.isLoading,
    
    // Errors
    error,
    assignError: assignUserToRoleMutation.error,
    removeError: removeUserFromRoleMutation.error,
    updateError: updateUserRoleMutation.error,
    hasError: !!(error || assignUserToRoleMutation.error || removeUserFromRoleMutation.error || updateUserRoleMutation.error),
    
    // Actions
    assignUserToRole: assignUserToRoleMutation.mutate,
    removeUserFromRole: removeUserFromRoleMutation.mutate,
    updateUserRole: updateUserRoleMutation.mutate,
    refetch,
  };
};

/**
 * Hook for role user management
 */
export const useRoleUsers = (roleId?: string) => {
  const queryClient = useQueryClient();

  // Get users with role
  const {
    data: usersWithRole,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['usersWithRole', roleId],
    queryFn: () => UserApi.getUsersWithRole(roleId!),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get role statistics
  const {
    data: roleStats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['roleStats', roleId],
    queryFn: () => UserApi.getRoleStats(roleId!),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get available users for role
  const getAvailableUsers = (searchQuery?: string) => {
    return UserApi.getAvailableUsersForRole(roleId!, searchQuery);
  };

  // Bulk assign users to role mutation
  const bulkAssignUsersMutation = useMutation({
    mutationFn: ({ userIds, expiresAt }: { userIds: string[]; expiresAt?: string }) =>
      UserApi.bulkAssignUsersToRole(roleId!, userIds, expiresAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersWithRole'] });
      queryClient.invalidateQueries({ queryKey: ['roleStats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Remove user from role mutation
  const removeUserFromRoleMutation = useMutation({
    mutationFn: (userRoleId: string) => UserApi.removeUserFromRole(userRoleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersWithRole'] });
      queryClient.invalidateQueries({ queryKey: ['roleStats'] });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userRoleId, updates }: { userRoleId: string; updates: UpdateUserRoleRequest }) =>
      UserApi.updateUserRole(userRoleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersWithRole'] });
      queryClient.invalidateQueries({ queryKey: ['roleStats'] });
    },
  });

  return {
    // Data
    usersWithRole: usersWithRole || [],
    roleStats,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isBulkAssigning: bulkAssignUsersMutation.isLoading,
    isRemoving: removeUserFromRoleMutation.isLoading,
    isUpdating: updateUserRoleMutation.isLoading,
    
    // Errors
    error,
    statsError,
    bulkAssignError: bulkAssignUsersMutation.error,
    removeError: removeUserFromRoleMutation.error,
    updateError: updateUserRoleMutation.error,
    hasError: !!(error || statsError || bulkAssignUsersMutation.error || removeUserFromRoleMutation.error || updateUserRoleMutation.error),
    
    // Actions
    getAvailableUsers,
    bulkAssignUsers: bulkAssignUsersMutation.mutate,
    removeUserFromRole: removeUserFromRoleMutation.mutate,
    updateUserRole: updateUserRoleMutation.mutate,
    refetch,
  };
};
