import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSiteContent, useUpdateContent } from "@/hooks/use-content";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Trash2, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Subcomponents for Admin ---

function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      toast({ title: "Welcome back." });
    } catch (err) {
      toast({ title: "Login failed", description: "Please check your credentials.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white p-10 rounded-xl shadow-2xl shadow-black/5 border border-border/50"
      >
        <h1 className="font-display text-2xl font-semibold mb-8 text-center">Studio Access</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-md clean-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md clean-input"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center h-12"
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ContentEditor() {
  const { data: content, isLoading } = useSiteContent();
  const updateContent = useUpdateContent();
  const { toast } = useToast();

  const sections = [
    { key: "architektur", label: "Architektur" },
    { key: "design", label: "Design" },
    { key: "philosophie", label: "Philosophie" },
    { key: "gestalten_und_beraten", label: "Gestalten und Beraten" },
  ];

  // Local state to manage drafts
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (content) {
      const initialDrafts: Record<string, string> = {};
      content.forEach(c => {
        initialDrafts[c.key] = c.content;
      });
      setDrafts(initialDrafts);
    }
  }, [content]);

  const handleSave = async (key: string) => {
    try {
      await updateContent.mutateAsync({ key, content: drafts[key] || "" });
      toast({ title: "Gespeichert", description: `${key} wurde aktualisiert.` });
    } catch (err) {
      toast({ title: "Fehler", description: "Speichern fehlgeschlagen.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-12">
      {sections.map(({ key, label }) => (
        <div key={key} className="bg-white p-8 rounded-lg border border-border/60 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-medium text-lg">{label}</h3>
            <button
              onClick={() => handleSave(key)}
              disabled={updateContent.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/70 text-secondary-foreground rounded-md text-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Speichern
            </button>
          </div>
          <textarea
            value={drafts[key] ?? ""}
            onChange={e => setDrafts(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full h-40 p-4 rounded-md clean-input resize-y text-base font-light leading-relaxed"
            placeholder={`Text für ${label} eingeben...`}
          />
        </div>
      ))}
    </div>
  );
}

function ProjectsManager() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openEdit = (project: any) => {
    setTitle(project.title);
    setDescription(project.description);
    setImageUrl(project.imageUrl);
    setEditingId(project.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProject.mutateAsync({ id: editingId, title, description, imageUrl });
        toast({ title: "Projekt aktualisiert." });
      } else {
        await createProject.mutateAsync({ title, description, imageUrl });
        toast({ title: "Projekt erstellt." });
      }
      resetForm();
    } catch (err) {
      toast({ title: "Fehler beim Speichern.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Wirklich löschen?")) {
      try {
        await deleteProject.mutateAsync(id);
        toast({ title: "Projekt gelöscht." });
      } catch (err) {
        toast({ title: "Fehler beim Löschen.", variant: "destructive" });
      }
    }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-display text-xl font-medium">Alle Projekte</h2>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Neues Projekt
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <div className="bg-secondary/30 p-8 rounded-lg border border-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-medium text-lg">{editingId ? "Projekt bearbeiten" : "Neues Projekt anlegen"}</h3>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground p-2"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Titel</label>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-md clean-input bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Bild URL (Unsplash o.ä.)</label>
                    <input type="url" required value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-4 py-3 rounded-md clean-input bg-white" placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Beschreibung</label>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full h-32 px-4 py-3 rounded-md clean-input bg-white resize-y" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="px-6 py-2 rounded-md font-medium hover:bg-secondary transition-colors">Abbrechen</button>
                  <button type="submit" disabled={createProject.isPending || updateProject.isPending} className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {editingId ? "Aktualisieren" : "Speichern"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <div key={project.id} className="group bg-white border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-[16/9] overflow-hidden bg-secondary relative">
              <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(project)} className="p-2 bg-white/90 backdrop-blur text-foreground rounded-md hover:bg-white transition-colors shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(project.id)} className="p-2 bg-white/90 backdrop-blur text-destructive rounded-md hover:bg-red-50 transition-colors shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <h4 className="font-display font-medium text-lg mb-1 truncate">{project.title}</h4>
              <p className="text-muted-foreground text-sm line-clamp-2">{project.description}</p>
            </div>
          </div>
        ))}
        {projects?.length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground">Keine Projekte gefunden.</div>}
      </div>
    </div>
  );
}

// --- Main Admin Page ---

export default function Admin() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"projects" | "content">("projects");

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <LoginForm />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="font-display text-3xl font-medium mb-8">Management</h1>
          <div className="flex gap-8 border-b border-border">
            <button 
              onClick={() => setActiveTab("projects")}
              className={`pb-4 text-sm font-medium tracking-wide transition-colors relative ${activeTab === "projects" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Projekte
              {activeTab === "projects" && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button 
              onClick={() => setActiveTab("content")}
              className={`pb-4 text-sm font-medium tracking-wide transition-colors relative ${activeTab === "content" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Texte (Landingpage)
              {activeTab === "content" && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "projects" ? <ProjectsManager /> : <ContentEditor />}
        </motion.div>
      </div>
    </Layout>
  );
}
