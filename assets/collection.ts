import { EXTERNAL_URL, TIP4_2JSON } from './models';

const COLLECTION_LOGO =
  'https://media.licdn.com/dms/image/D5612AQF03-5YN0zGkA/article-cover_image-shrink_600_2000/0/1680508890504?e=1702512000&v=beta&t=wYIBx5-b00nD-vbpuxpx1y9a8K2STjR398FQZkr-2y4';

export const Collection: TIP4_2JSON = {
  type: 'Basic NFT',
  name: 'Example collection of (pre)CRC tokens',
  description: 'Example VEP-1155 collection.',
  preview: {
    source: COLLECTION_LOGO,
    mimetype: 'image/jpeg',
  },
  files: [
    {
      source: COLLECTION_LOGO,
      mimetype: 'image/jpeg',
    },
  ],
  external_url: EXTERNAL_URL,
};
