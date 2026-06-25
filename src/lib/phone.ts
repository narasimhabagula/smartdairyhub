// Indian mobile phone helpers. Stored canonical form: "+91XXXXXXXXXX"
export function normalizeIndianPhone(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  // Accept: 10-digit, 11-digit starting with 0, 12-digit starting with 91
  let ten = "";
  if (digits.length === 10) ten = digits;
  else if (digits.length === 11 && digits.startsWith("0")) ten = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith("91")) ten = digits.slice(2);
  else return null;
  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return `+91${ten}`;
}

export function isValidIndianPhone(input: string): boolean {
  return normalizeIndianPhone(input) !== null;
}

// Strip spaces/dashes/parens from any phone format. Keeps leading +.
function cleanPhone(input: string): string {
  const trimmed = (input || "").trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/[^\d]/g, "");
}

export function telHref(phone: string): string {
  return `tel:${cleanPhone(phone)}`;
}

export function waHref(phone: string, message?: string): string {
  // wa.me expects digits only, no '+'.
  let digits = cleanPhone(phone).replace(/^\+/, "");
  // If 10-digit Indian, prepend country code.
  if (/^[6-9]\d{9}$/.test(digits)) digits = "91" + digits;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function formatIndianPhoneDisplay(canonical: string): string {
  // +91 98765 43210
  if (!/^\+91\d{10}$/.test(canonical)) return canonical;
  const n = canonical.slice(3);
  return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
}
