export const STUDY_MANAGER_ROLE = 'study_manager'

export function canManageStudy(role: string | undefined) {
  return role === 'admin' || role === STUDY_MANAGER_ROLE
}
