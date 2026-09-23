import { labMark } from "@/lib/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return labMark(size.width);
}
