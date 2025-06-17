import type { Config } from 'tailwindcss';
import daisyui from "daisyui";
import { scopedPreflightStyles, isolateInsideOfContainer } from 'tailwindcss-scoped-preflight'


export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {}
  },

  plugins: [
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer('.viewers'), // style root name, used to wrap Popper menus etc
    }),
    daisyui
  ],

  daisyui: {
    themes: false,
    themeRoot: ".viewers"
  },

  important: '.viewers',

  prefix: "k-"
} satisfies Config;
