export type TIP4_2JSON = {
  type: string;
  name: string;
  description: string;
  preview: { source: string; mimetype: string };
  files: { source: string; mimetype: string }[];
  external_url: string;
};

export const EXTERNAL_URL = 'https://example.com';
