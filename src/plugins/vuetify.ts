import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import colors from 'vuetify/lib/util/colors.mjs';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import {
    mdiArrowLeft,
    mdiBookHeart,
    mdiBookOpenVariant,
    mdiCalendarMonthOutline,
    mdiDeleteOutline,
    mdiGithub,
    mdiHeadphones,
    mdiHistory,
    mdiMagnify,
    mdiOpenInNew,
    mdiStar,
    mdiStarOutline,
    mdiTextSearch,
} from '@mdi/js';
import { getSystemTheme } from '@/utils/theme';

export const createIcibaVuetify = () =>
    createVuetify({
        theme: {
            defaultTheme: getSystemTheme(),
            themes: {
                light: {
                    colors: {
                        primary: colors.red.darken2,
                        secondary: colors.red.lighten4,
                    },
                },
                dark: {
                    colors: {
                        primary: colors.red.darken4,
                        secondary: colors.red.lighten4,
                    },
                },
            },
        },
        icons: {
            defaultSet: 'mdi',
            aliases: {
                ...aliases,
                arrowLeft: mdiArrowLeft,
                bookHeart: mdiBookHeart,
                bookOpenVariant: mdiBookOpenVariant,
                calendarMonthOutline: mdiCalendarMonthOutline,
                deleteOutline: mdiDeleteOutline,
                github: mdiGithub,
                headphones: mdiHeadphones,
                history: mdiHistory,
                magnify: mdiMagnify,
                openInNew: mdiOpenInNew,
                star: mdiStar,
                starOutline: mdiStarOutline,
                textSearch: mdiTextSearch,
            },
            sets: {
                mdi,
            },
        },
    });
