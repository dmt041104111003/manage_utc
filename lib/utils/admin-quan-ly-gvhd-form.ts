import type { Degree, Gender, SupervisorFormState } from "@/lib/types/admin-quan-ly-gvhd";
import { todayDateInputValue } from "@/lib/utils/admin-quan-ly-gvhd-dates";

export function buildEmptySupervisorFormState(): SupervisorFormState {
  return {
    fullName: "",
    phone: "",
    email: "",
    birthDate: todayDateInputValue(),
    gender: "",
    permanentProvinceCode: "",
    permanentWardCode: "",
    faculty: "",
    facultyCustom: "",
    degree: ""
  };
}

// Utility type exports (kept to help tooling autocomplete)
export type { Gender, Degree };

