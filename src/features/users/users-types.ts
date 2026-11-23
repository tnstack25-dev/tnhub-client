export type Member = {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  isVerified: boolean;
  username: string | null;
  phone: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
  roles: { id: string; slug: string; displayName: string; expiresAt: string | null }[];
};
