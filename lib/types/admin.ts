/** Bản ghi doanh nghiệp chờ phê duyệt (API list / detail). */
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
