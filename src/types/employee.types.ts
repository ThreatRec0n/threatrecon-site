export type AvatarId =
  | 'AVATAR_F1'
  | 'AVATAR_M1'
  | 'AVATAR_F2'
  | 'AVATAR_M2'
  | 'AVATAR_F3'
  | 'AVATAR_M3'
  | 'AVATAR_F4'
  | 'AVATAR_M4';

export type MotiveCategory = 'FINANCIAL' | 'GRIEVANCE' | 'IDEOLOGY' | 'OPPORTUNITY';

export interface EmployeeProfile {
  id: string;
  avatarId: AvatarId;
  fullName: string;
  employeeIdLabel: string;
  title: string;
  department: string;
  yearsAtCompany: number;
  managerName: string;
  accessLevel: string;
  lastBadgeIn: string;
  performanceSnippet: string;
  notes: string;
  workstationId: string;
  email: string;
  hiddenMotiveCategory: MotiveCategory;
  hiddenMotiveScore?: number;
}
