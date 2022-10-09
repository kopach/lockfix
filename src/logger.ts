interface LogProps {
  quiet?: boolean;
}

export function log(message: string, { quiet = false }: LogProps): void {
  if (quiet) return;

  console.log('LockFix:', message);
}
