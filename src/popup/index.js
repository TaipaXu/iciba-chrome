/*
 * GNU General Public License, Version 3.0
 *
 * Copyright (c) 2019 Taipa Xu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import Vue from 'vue';
import Vuetify, {
    VApp,
    VBtn,
    VContainer,
    VFlex,
    VIcon,
    VLayout,
    VSpacer,
    VTextField,
    VToolbar,
    VToolbarTitle,
} from 'vuetify/lib';
import { Ripple } from 'vuetify/lib/directives';
import 'vuetify/src/stylus/app.styl';
import 'material-design-icons-iconfont';
import browser from 'webextension-polyfill';

import App from './app';

Vue.use(Vuetify, {
    components: {
        VApp,
        VBtn,
        VContainer,
        VFlex,
        VIcon,
        VLayout,
        VSpacer,
        VTextField,
        VToolbar,
        VToolbarTitle,
    },
    directives: {
        Ripple,
    },
});

Vue.prototype.$t = browser.i18n.getMessage;

/* eslint-disable no-new */
new Vue({
    el: '#app',
    render: h => h(App),
});
