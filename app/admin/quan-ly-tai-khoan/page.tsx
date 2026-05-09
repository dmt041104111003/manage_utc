"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/dashboard.module.css";
import MessagePopup from "../../components/MessagePopup";

type Role = "sinhvien" | "doanhnghiep" | "giangvien";
type AccountStatus = "ACTIVE" | "STOPPED";

type AccountRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  status: AccountStatus;
};

const roleLabel: Record<Role, string> = {
  sinhvien: "SV",
  doanhnghiep: "DN",
  giangvien: "GVHD"
};

const statusLabel: Record<AccountStatus, string> = {
  ACTIVE: "Đang hoạt động",
  STOPPED: "Dừng hoạt động"
};

const studentDegreeLabel: Record<string, string> = { BACHELOR: "Cử nhân", ENGINEER: "Kỹ sư" };
const supervisorDegreeLabel: Record<string, string> = {
  MASTER: "Thạc sĩ",
  PHD: "Tiến sĩ",
  ASSOC_PROF: "Phó giáo sư",
  PROF: "Giáo sư"
};

const genderLabel: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

export default function AdminQuanLyTaiKhoanPage() {
  const [items, setItems] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "all">("all");
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "all">("all");

  const [toast, setToast] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<AccountRow | null>(null);
  const [statusDraft, setStatusDraft] = useState<AccountStatus>("ACTIVE");

  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set("q", searchQ.trim());
      if (filterRole !== "all") params.set("role", filterRole);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/admin/accounts?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được danh sách tài khoản.");
      setItems((data.items || []) as AccountRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openView = async (row: AccountRow) => {
    try {
      const res = await fetch(`/api/admin/accounts/${row.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không tải được thông tin tài khoản.");
      setViewTarget(data.item);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không tải được thông tin tài khoản.");
    }
  };

  const openStatus = (row: AccountRow) => {
    setStatusTarget(row);
    setStatusDraft(row.status);
  };

  const submitStatus = async () => {
    if (!statusTarget) return;
    setBusyId(statusTarget.id);
    try {
      if (statusDraft === "STOPPED") {
        const ok = window.confirm(
          `Bạn có chắc chắn muốn dừng hoạt động của tài khoản ${roleLabel[statusTarget.role]} - ${statusTarget.fullName}-${statusTarget.email} không?`
        );
        if (!ok) return;
      }

      const res = await fetch(`/api/admin/accounts/${statusTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusDraft })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật trạng thái thất bại.");
      setToast(data.message || "Cập nhật trạng thái tài khoản thành công.");
      setStatusTarget(null);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/accounts/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Xóa tài khoản thất bại.");
      setToast(data.message || "Xóa tài khoản thành công.");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Xóa tài khoản thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const viewTitle = useMemo(() => {
    if (!viewTarget) return "";
    const r = viewTarget.role as Role;
    return r === "sinhvien" ? "Xem thông tin tài khoản sinh viên" : r === "giangvien" ? "Xem thông tin tài khoản GVHD" : "Xem thông tin doanh nghiệp";
  }, [viewTarget]);

  const renderViewBody = () => {
    if (!viewTarget) return null;
    const r = viewTarget.role as Role;

    if (r === "sinhvien") {
      return (
        <table className={styles.viewModalDetailTable}>
          <tbody>
            <tr>
              <th scope="row">Mã sinh viên</th>
              <td>{viewTarget.msv ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Họ tên</th>
              <td>{viewTarget.fullName}</td>
            </tr>
            <tr>
              <th scope="row">Số điện thoại</th>
              <td>{viewTarget.phone ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Email</th>
              <td>{viewTarget.email}</td>
            </tr>
            <tr>
              <th scope="row">Ngày sinh</th>
              <td>{viewTarget.birthDate ? String(viewTarget.birthDate).slice(0, 10) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Giới tính</th>
              <td>{viewTarget.gender ? genderLabel[viewTarget.gender] ?? "—" : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Địa chỉ thường trú</th>
              <td>{viewTarget.permanentAddress ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Lớp</th>
              <td>{viewTarget.className ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Khoa</th>
              <td>{viewTarget.faculty ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Khóa</th>
              <td>{viewTarget.cohort ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Bậc</th>
              <td>{viewTarget.degree ? studentDegreeLabel[viewTarget.degree] ?? "—" : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Trạng thái</th>
              <td>{statusLabel[viewTarget.status as AccountStatus] ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      );
    }

    if (r === "giangvien") {
      return (
        <table className={styles.viewModalDetailTable}>
          <tbody>
            <tr>
              <th scope="row">Họ tên</th>
              <td>{viewTarget.fullName}</td>
            </tr>
            <tr>
              <th scope="row">Số điện thoại</th>
              <td>{viewTarget.phone ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Email</th>
              <td>{viewTarget.email}</td>
            </tr>
            <tr>
              <th scope="row">Ngày sinh</th>
              <td>{viewTarget.birthDate ? String(viewTarget.birthDate).slice(0, 10) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Giới tính</th>
              <td>{viewTarget.gender ? genderLabel[viewTarget.gender] ?? "—" : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Địa chỉ thường trú</th>
              <td>{viewTarget.permanentAddress ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Khoa</th>
              <td>{viewTarget.faculty ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Bậc</th>
              <td>{viewTarget.degree ? supervisorDegreeLabel[viewTarget.degree] ?? "—" : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Trạng thái</th>
              <td>{statusLabel[viewTarget.status as AccountStatus] ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      );
    }

    return (
      <table className={styles.viewModalDetailTable}>
        <tbody>
          <tr>
            <th scope="row">Tên doanh nghiệp</th>
            <td>{viewTarget.companyName ?? viewTarget.fullName ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Mã số thuế</th>
            <td>{viewTarget.taxCode ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Email</th>
            <td>{viewTarget.email}</td>
          </tr>
          <tr>
            <th scope="row">SĐT</th>
            <td>{viewTarget.phone ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Lĩnh vực hoạt động</th>
            <td>{viewTarget.businessFields ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Địa chỉ trụ sở chính</th>
            <td>{viewTarget.address ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Website</th>
            <td>{viewTarget.website ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Giới thiệu</th>
            <td>{viewTarget.intro ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Trạng thái</th>
            <td>{statusLabel[viewTarget.status as AccountStatus] ?? "—"}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý tài khoản</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.searchToolbar}>
        <div className={styles.searchField}>
          <label>Tìm kiếm (tên / SĐT / email / MST)</label>
          <input className={styles.textInputSearch} value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Nhập từ khóa" />
        </div>
        <div className={styles.searchField}>
          <label>Phân quyền</label>
          <select className={styles.selectInput} value={filterRole} onChange={(e) => setFilterRole(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="sinhvien">SV</option>
            <option value="giangvien">GVHD</option>
            <option value="doanhnghiep">DN</option>
          </select>
        </div>
        <div className={styles.searchField}>
          <label>Trạng thái</label>
          <select className={styles.selectInput} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="STOPPED">Dừng hoạt động</option>
          </select>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void load()}>
          Tìm kiếm
        </button>
      </div>

      {loading ? (
        <p className={styles.modulePlaceholder}>Đang tải…</p>
      ) : (
        <div className={`${styles.tableWrap} data-table-responsive-wrap`}>
          <table className={`${styles.dataTable} data-table-responsive`}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Phân quyền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.modulePlaceholder}>
                    Không có tài khoản phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={row.id}>
                    <td data-label="STT">{idx + 1}</td>
                    <td data-label="Họ tên">{row.fullName}</td>
                    <td data-label="Email">{row.email}</td>
                    <td data-label="SĐT">{row.phone ?? "—"}</td>
                    <td data-label="Phân quyền">{roleLabel[row.role]}</td>
                    <td data-label="Trạng thái">{statusLabel[row.status]}</td>
                    <td data-label="Thao tác">
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => void openView(row)}>
                        Xem
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => openStatus(row)}>
                        Sửa trạng thái
                      </button>
                      <button type="button" className={styles.textLinkBtn} disabled={busyId !== null} onClick={() => setDeleteTarget(row)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewTarget ? (
        <MessagePopup open title={viewTitle} size="extraWide" onClose={() => setViewTarget(null)}>
          {renderViewBody()}
        </MessagePopup>
      ) : null}

      {statusTarget ? (
        <MessagePopup
          open
          title="Cập nhật trạng thái"
          size="wide"
          onClose={() => setStatusTarget(null)}
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setStatusTarget(null)} disabled={busyId !== null}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void submitStatus()} disabled={busyId !== null}>
                Lưu
              </button>
            </>
          }
        >
          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>Trạng thái</label>
            <select style={{ width: "100%", marginTop: 6 }} value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as any)} disabled={busyId !== null}>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="STOPPED">Dừng hoạt động</option>
            </select>
          </div>
        </MessagePopup>
      ) : null}

      {deleteTarget ? (
        <MessagePopup
          open
          title="Xóa tài khoản"
          size="wide"
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button type="button" className={styles.btn} onClick={() => setDeleteTarget(null)} disabled={busyId !== null}>
                Hủy
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => void submitDelete()} disabled={busyId !== null}>
                Xóa
              </button>
            </>
          }
        >
          <p>
            Bạn có chắc chắn muốn xóa tài khoản <strong>[{roleLabel[deleteTarget.role]}]</strong> - <strong>[{deleteTarget.fullName}]</strong>-<strong>[{deleteTarget.email}]</strong> không?
          </p>
        </MessagePopup>
      ) : null}

      {toast ? <MessagePopup open title="Thông báo" message={toast} onClose={() => setToast(null)} /> : null}
    </main>
  );
}

