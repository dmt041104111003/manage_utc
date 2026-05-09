"use client";

import type { ChangeEvent } from "react";
import type { FormDataState } from "@/lib/types/enterprise-register";
import styles from "../../styles/register.module.css";

type Props = {
  form: FormDataState;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onChangeText: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export default function RepresentativeSection({ form, errors, isSubmitting, onChangeText }: Props) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Thông tin Người đại diện/Liên hệ</h3>

      <div className={styles.grid2}>
        <div className={styles.field} style={{ marginBottom: 0 }}>
          <label className={styles.label}>
            Họ và tên <span className={styles.required}>*</span>
          </label>
          <input
            disabled={isSubmitting}
            name="representativeName"
            className={styles.input}
            placeholder="Nhập họ và tên"
            value={form.representativeName}
            onChange={onChangeText}
          />
          {errors.representativeName ? <p className={styles.error}>{errors.representativeName}</p> : null}
        </div>

        <div className={styles.field} style={{ marginBottom: 0 }}>
          <label className={styles.label}>
            Chức vụ <span className={styles.required}>*</span>
          </label>
          <input
            disabled={isSubmitting}
            name="representativeTitle"
            className={styles.input}
            placeholder="Nhập chức vụ"
            value={form.representativeTitle}
            onChange={onChangeText}
          />
          {errors.representativeTitle ? <p className={styles.error}>{errors.representativeTitle}</p> : null}
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label}>
            Số điện thoại <span className={styles.required}>*</span>
          </label>
          <input
            disabled={isSubmitting}
            name="phone"
            className={styles.input}
            placeholder="Nhập số điện thoại"
            value={form.phone}
            onChange={onChangeText}
          />
          {errors.phone ? <p className={styles.error}>{errors.phone}</p> : null}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            Email <span className={styles.required}>*</span>
          </label>
          <input
            disabled={isSubmitting}
            name="email"
            type="email"
            autoComplete="email"
            className={styles.input}
            placeholder="example@domain.com"
            value={form.email}
            onChange={onChangeText}
          />
          {errors.email ? <p className={styles.error}>{errors.email}</p> : null}
        </div>
      </div>
    </section>
  );
}
