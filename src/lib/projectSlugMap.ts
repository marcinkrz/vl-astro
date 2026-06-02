import { getCollection } from 'astro:content';

export async function getProjectSlugMap() {
  const projects = await getCollection('projects');

  const map: Record<string, string> = {};

  for (const project of projects) {
    if (project.data.locale !== 'en') continue;

    const translated = projects.find(
      (p) =>
        p.data.locale === 'pl' &&
        p.data.slug === project.data.slug
    );

    if (translated) {
      map[project.id] = translated.id;
    }
  }

  return map;
}
