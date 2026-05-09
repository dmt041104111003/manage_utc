import { HttpErrorView } from "@/app/components/HttpErrorView";

export default function NotFound() {
  return <HttpErrorView status={404} />;
}
