export const PORTFOLIO_PERMISSIONS = {
  // Portfolio visibility management
  'portfolio.visibility.manage': {
    resource: 'portfolio',
    action: 'visibility.manage',
    description: 'Manage portfolio visibility (public/private)',
    roles: ['admin', 'super_admin'],
  },
  
//   // Copy from public portfolios (all users can do this)
//   'portfolio.copy.public': {
//     resource: 'portfolio',
//     action: 'copy.public',
//     description: 'Copy from public portfolio templates',
//     roles: ['user', 'admin', 'super_admin'],
//   },
  
//   // Create public portfolios
//   'portfolio.create.public': {
//     resource: 'portfolio',
//     action: 'create.public',
//     description: 'Create public portfolio templates',
//     roles: ['admin', 'super_admin'],
//   },
};

export const PERMISSIONS = {
  ...PORTFOLIO_PERMISSIONS,
};
