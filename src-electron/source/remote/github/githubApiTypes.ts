import { z } from 'zod';

export const CommitRes = z.object({
  name: z.string(),
  commit: z.object({
    sha: z.string(),
    node_id: z.string(),
    commit: z.object({
      author: z.object({
        name: z.string(),
        email: z.string(),
        date: z.string(),
      }),
      committer: z.object({
        name: z.string(),
        email: z.string(),
        date: z.string(),
      }),
      message: z.string(),
      tree: z.object({
        sha: z.string(),
        url: z.string(),
      }),
      url: z.string(),
      comment_count: z.number(),
    }),
  }),
});
export type CommitRes = z.infer<typeof CommitRes>;

export const TreeRes = z.object({
  sha: z.string(),
  url: z.string(),
  tree: z.array(
    z.object({
      path: z.string(),
      mode: z.string(),
      type: z.union([z.literal('blob'), z.literal('tree')]),
      sha: z.string(),
      url: z.string(),
    })
  ),
  truncated: z.boolean(),
});
export type TreeRes = z.infer<typeof TreeRes>;

export const BlobRes = z.object({
  sha: z.string(),
  node_id: z.string(),
  size: z.number(),
  url: z.string(),
  content: z.string(),
  encoding: z.union([z.literal('base64'), z.literal('utf-8')]),
});
export type BlobRes = z.infer<typeof BlobRes>;
