import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-white">
      <header className="fixed top-0 w-full z-50 glass-header">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-xl tracking-tight text-foreground hover:opacity-70 transition-opacity">
            STUDIO <span className="font-light">ARCH</span>
          </Link>
          <nav className="flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Portfolio
            </Link>
            {user ? (
              <div className="flex items-center gap-6">
                <Link href="/admin" className="text-foreground transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={() => logout()} 
                  className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-20">
        {children}
      </main>

      <footer className="border-t border-border/40 bg-secondary/20 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground font-light tracking-wide">
            © {new Date().getFullYear()} Studio Arch. Klarheit, Transparenz, Kooperation.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Impressum</a>
            <a href="#" className="hover:text-foreground transition-colors">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
