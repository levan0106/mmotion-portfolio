import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify required permissions for a controller or method
 * @param permissions Array of permission names required
 */
export const RequirePermissions = (permissions: string[]) => SetMetadata('permissions', permissions);

/**
 * Decorator to specify required roles for a controller or method
 * @param roles Array of role names required
 */
export const RequireRoles = (roles: string[]) => SetMetadata('roles', roles);

/**
 * Decorator to specify that any of the permissions are required
 * @param permissions Array of permission names (user needs at least one)
 */
export const RequireAnyPermission = (permissions: string[]) => SetMetadata('permissions', permissions);

/**
 * Decorator to specify that all permissions are required
 * @param permissions Array of permission names (user needs all)
 */
export const RequireAllPermissions = (permissions: string[]) => SetMetadata('permissions', permissions);
