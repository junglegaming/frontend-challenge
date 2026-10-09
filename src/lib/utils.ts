import { createCn } from 'cn/config';

export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'display-2',
            'h1',
            'h2',
            'title',
            'body-17-regular',
            'body-lg',
            'body-lg-bold',
            'body-lg-medium',
            'body',
            'body-combo',
            'body-regular',
            'body-medium',
            'body-bold',
            'body-sm',
            'caption',
            'caption-bold',
            'tiny',
            'micro',
          ],
        },
      ],
    },
  },
});
