import type { AdminProfile } from '../../api/auth'

export const ADMIN_PERMISSIONS = {
  manageUsers: 'administration.users.manage',
  manageRoles: 'administration.roles.manage',
  managePermissions: 'administration.permissions.manage',
  manageProducts: 'catalog.products.manage',
  manageCategories: 'catalog.categories.manage',
  manageBrands: 'catalog.brands.manage',
  viewFinancialReports: 'reports.financial.view',
  viewInfrastructureReports: 'reports.infrastructure.view',
  viewOrderReports: 'reports.orders.view',
  viewProductReports: 'reports.products.view',
  viewReviewReports: 'reports.reviews.view',
  viewSearchReports: 'reports.searches.view',
  viewVisitorReports: 'reports.visitors.view',
} as const

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS]

function normalizePermission(permission: string) {
  return permission.trim().toLowerCase()
}

export function hasAdminPermission(
  profile: AdminProfile | null | undefined,
  permission: AdminPermission,
) {
  const expectedPermission = normalizePermission(permission)

  return profile?.permissions.some(
    (currentPermission) =>
      normalizePermission(currentPermission) === expectedPermission,
  ) ?? false
}

export function hasAnyAdminPermission(
  profile: AdminProfile | null | undefined,
  permissions: readonly AdminPermission[],
) {
  return permissions.some((permission) =>
    hasAdminPermission(profile, permission),
  )
}

export function getAdminRoleLabel(role: string | null | undefined) {
  const normalizedRole = role?.trim().toLowerCase()

  if (!normalizedRole) return 'مدیر'
  if (normalizedRole === 'super-admin') return 'مدیر ارشد'

  return role?.trim() ?? 'مدیر'
}
