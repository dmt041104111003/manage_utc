import type { StudentFormState } from "@/lib/types/admin-quan-ly-sinh-vien";
import { todayDateInputValue } from "@/lib/utils/admin-quan-ly-sinh-vien-dates";

export function buildEmptyStudentFormState(): StudentFormState {
  return {
    msv: "",
    fullName: "",
    className: "",
    faculty: "",
    facultyCustom: "",
    cohort: "",
    degree: "",
    phone: "",
    email: "",
    birthDate: todayDateInputValue(),
    gender: "",
    permanentProvinceCode: "",
    permanentWardCode: ""
  };
}

