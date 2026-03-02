import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useSiteContent() {
  return useQuery({
    queryKey: [api.content.list.path],
    queryFn: async () => {
      const res = await fetch(api.content.list.path);
      if (!res.ok) throw new Error("Failed to fetch site content");
      return parseWithLogging(api.content.list.responses[200], await res.json(), "content.list");
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, content }: { key: string; content: string }) => {
      const url = buildUrl(api.content.update.path, { key });
      const res = await fetch(url, {
        method: api.content.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update content");
      return parseWithLogging(api.content.update.responses[200], await res.json(), "content.update");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.content.list.path] }),
  });
}
