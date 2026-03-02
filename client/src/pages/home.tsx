import { motion } from "framer-motion";
import { useSiteContent } from "@/hooks/use-content";
import { useProjects } from "@/hooks/use-projects";
import { Layout } from "@/components/layout";

export default function Home() {
  const { data: contentData, isLoading: contentLoading } = useSiteContent();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();

  const getContent = (key: string) => {
    return contentData?.find(c => c.key === key)?.content || "";
  };

  const sections = [
    { key: "architektur", title: "Architektur", delay: 0.1 },
    { key: "design", title: "Design", delay: 0.2 },
    { key: "philosophie", title: "Philosophie", delay: 0.3 },
    { key: "gestalten_und_beraten", title: "Gestalten und Beraten", delay: 0.4 },
  ];

  if (contentLoading || projectsLoading) {
    return (
      <Layout>
        <div className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero / Intro Sections */}
      <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 space-y-32">
        {sections.map((section) => {
          const text = getContent(section.key);
          if (!text) return null;

          return (
            <motion.section
              key={section.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: section.delay, ease: "easeOut" }}
              className="space-y-6"
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                {section.title}
              </h2>
              <p className="text-2xl md:text-4xl font-light leading-snug text-foreground max-w-3xl">
                {text}
              </p>
            </motion.section>
          );
        })}
      </div>

      {/* Project Showcase Gallery */}
      <section className="bg-secondary/30 py-24 md:py-32 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight">Ausgewählte Werke</h2>
          </motion.div>

          {projectsData?.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground font-light">
              Noch keine Projekte vorhanden.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {projectsData?.map((project, idx) => (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-secondary mb-6 rounded-sm">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                      onError={(e) => {
                        // Fallback image if URL is broken
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                  </div>
                  <h3 className="font-display text-xl font-medium mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground font-light text-sm line-clamp-2">
                    {project.description}
                  </p>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
