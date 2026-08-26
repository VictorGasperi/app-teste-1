export function CenteredCardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">{children}</div>
    </div>
  );
}
