import type { EnterpriseStatus } from "@prisma/client";

export type PendingEnterpriseItem = {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  companyName: string | null;
  taxCode: string | null;
  enterpriseMeta: unknown;
  createdAt: string;
};

export type AdminEnterpriseListItem = {
  id: string;
  email: string;
  companyName: string | null;
  taxCode: string | null;
  enterpriseStatus: EnterpriseStatus | null;
  createdAt: string;
};

export type AdminEnterpriseDetail = AdminEnterpriseListItem & {
  phone: string | null;
  fullName: string;
  representativeTitle: string | null;
  enterpriseMeta: unknown;
  updatedAt: string;
};
