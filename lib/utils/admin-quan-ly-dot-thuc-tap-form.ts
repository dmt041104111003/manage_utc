import type { BatchFormState } from "@/lib/types/admin-quan-ly-dot-thuc-tap";
import { todayDateInputValue } from "@/lib/utils/admin-quan-ly-dot-thuc-tap-dates";

export function buildEmptyBatchForm(): BatchFormState {
  return {
    name: "",
    semester: "",
    schoolYear: "",
    startDate: todayDateInputValue(),
    endDate: todayDateInputValue(),
    notes: ""
  };
}

