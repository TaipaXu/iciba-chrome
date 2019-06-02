<template>
    <div class="general-page">
        <template v-if="settings !== null">
            <v-container>
                <v-list>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title>{{ $t('drawWords') }}</v-list-tile-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-switch
                            v-model="settings.enableSelectTranslate"
                            :disabled="loading"
                            :loading="loading"
                            @change="handleSettingChange('enableSelectTranslate')"></v-switch>
                        </v-list-tile-action>
                    </v-list-tile>
                    <v-divider></v-divider>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title>{{ $t('recordHistory') }}</v-list-tile-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-switch
                            v-model="settings.enableRecordHistory"
                            :disabled="loading"
                            :loading="loading"
                            @change="handleSettingChange('enableRecordHistory')"></v-switch>
                        </v-list-tile-action>
                    </v-list-tile>
                </v-list>
            </v-container>
        </template>
    </div>
</template>

<script>
    import { getSettings, setSetting } from '@/data';

    export default {
        data() {
            return {
                settings: null,
                loading: false,
            };
        },
        created() {
            this.getSettings();
        },
        methods: {
            async getSettings() {
                const settings = await getSettings();
                this.settings = settings;
            },
            async handleSettingChange(key) {
                this.setLoading(true);
                await setSetting(key, this.settings[key]);
                this.setLoading(false);
            },
            setLoading(status) {
                this.loading = status;
            },
        },
    };
</script>

<style lang="scss">

</style>
