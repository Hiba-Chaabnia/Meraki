export function passwordIsValid(p: string): boolean {
  return p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p);
}
