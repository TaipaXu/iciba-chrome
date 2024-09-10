import App from './popup.vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import colors from 'vuetify/lib/util/colors.mjs';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import {
    mdiMagnify,
    mdiHeadphones,
    mdiGithub
} from '@mdi/js';
import { getSystemTheme } from '@/utils/theme';

const vuetify = createVuetify({
    theme: {
        defaultTheme: getSystemTheme(),
        themes: {
            light: {
                colors: {
                    primary: colors.red.darken2,
                    secondary: colors.red.lighten4
                }
            },
            dark: {
                colors: {
                    primary: colors.red.darken4,
                    secondary: colors.red.lighten4
                }
            }
        }
    },
    icons: {
        defaultSet: 'mdi',
        aliases: {
            ...aliases,
            magnify: mdiMagnify,
            headphones: mdiHeadphones,
            github: mdiGithub
        },
        sets: {
            mdi
        }
    }
});

const app = createApp(App);
app.use(vuetify);
app.mount('#app');
