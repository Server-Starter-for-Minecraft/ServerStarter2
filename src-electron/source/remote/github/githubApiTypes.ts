export type CommitRes = {
  name: string;
  commit: {
    sha: string;
    node_id: string;
    commit: {
      author: {
        name: string;
        email: string;
        date: string;
      };
      committer: {
        name: string;
        email: string;
        date: string;
      };
      message: string;
      tree: {
        sha: string;
        url: string;
      };
      url: string;
      comment_count: number;
    };
  };
};

export type TreeRes = {
  sha: string;
  url: string;
  tree: [
    {
      path: string;
      mode: string;
      type: 'blob' | 'tree';
      sha: string;
      url: string;
    }
  ];
  truncated: false;
};

export type BlobRes = {
  sha: string;
  node_id: string;
  size: number;
  url: string;
  content: string;
  encoding: 'base64' | 'utf-8';
};
