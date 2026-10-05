import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function BareLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh">{children}</div>;
}
