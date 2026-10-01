import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const LEGAL_UPDATED = "October 1, 2026";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="theme-vibrant min-h-screen bg-background">
      <div className="container max-w-3xl py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> SuprimaLabs
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated {LEGAL_UPDATED}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 text-muted-foreground">
          {children}
        </div>
        <div className="mt-12 flex gap-4 text-sm">
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link>
        </div>
      </div>
    </div>
  );
}
