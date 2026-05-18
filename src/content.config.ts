import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({
    base: './src/content/projects',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    locale: z.enum(['en', 'pl']),
    projectId: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    title: z.string(),
    description: z.string(),
    client: z.string(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { projects };
