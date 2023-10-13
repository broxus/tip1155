import { EXTERNAL_URL, TIP4_2JSON } from './models';

const PROJECT_LOGO =
  'https://pibig.info/uploads/posts/2021-05/1620935919_8-pibig_info-p-molodoi-sosnovii-les-priroda-krasivo-foto-9.jpg';

export const Project: TIP4_2JSON = {
  type: 'Basic NFT',
  name: 'Project A, stage 1',
  description: '',
  preview: {
    source: PROJECT_LOGO,
    mimetype: 'image/jpeg',
  },
  files: [
    {
      source: PROJECT_LOGO,
      mimetype: 'image/jpeg',
    },
  ],
  external_url: EXTERNAL_URL,
};
