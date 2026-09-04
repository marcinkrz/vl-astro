import { getCollection } from "astro:content";

export async function getProjectSlugMap() {
  const projects = await getCollection("projects");

  const map: Record<string, string> = {};

  for (const project of projects) {
    if (project.data.locale !== "en") continue;

    const translated = projects.find(
      (p) =>
        p.data.locale === "pl" &&
        p.data.projectKey === project.data.projectKey
    );

    if (translated) {
      map[project.data.slug] = translated.data.slug;
    }
  }

  return map;
}
