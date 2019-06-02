import Vue from 'vue';
import Vuetify, {
    VApp,
    VBtn,
    VCard,
    VCardTitle,
    VCardText,
    VCardActions,
    VContainer,
    VDialog,
    VDivider,
    VList,
    VListTile,
    VListTileAction,
    VListTileContent,
    VListTileSubTitle,
    VListTileTitle,
    VSwitch,
    VTabs,
    VTab,
    VToolbar,
    VToolbarTitle,
    VIcon,
    VSpacer,
    VFlex,
    VLayout,
    VTextField,
} from 'vuetify/lib';
import { Ripple } from 'vuetify/lib/directives';
import 'vuetify/dist/vuetify.min.css';
import 'material-design-icons-iconfont';
import '@/styles/_reboot.scss';
import browser from 'webextension-polyfill';

import App from './app';
import router from './router';

Vue.use(Vuetify, {
    components: {
        VApp,
        VBtn,
        VCard,
        VCardTitle,
        VCardText,
        VCardActions,
        VContainer,
        VDialog,
        VDivider,
        VList,
        VListTile,
        VListTileAction,
        VListTileContent,
        VListTileSubTitle,
        VListTileTitle,
        VSwitch,
        VTabs,
        VTab,
        VToolbar,
        VToolbarTitle,
        VIcon,
        VSpacer,
        VFlex,
        VLayout,
        VTextField,
    },
    directives: {
        Ripple,
    },
});

Vue.prototype.browser = browser;
Vue.prototype.$t = browser.i18n.getMessage;

/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    render: h => h(App),
});
