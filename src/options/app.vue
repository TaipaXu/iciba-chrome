<template>
    <v-app class="app">
        <v-tabs
        v-model="activeIndex" dark>
            <v-tab @click="$router.push({ name: 'settings' })">{{ $t('settings') }}</v-tab>
            <v-tab @click="$router.push({ name: 'history' })">{{ $t('history') }}</v-tab>
        </v-tabs>
        <keep-alive>
            <router-view ref="router" />
        </keep-alive>
    </v-app>
</template>

<script>
    export default {
        data() {
            return {
                activeIndex: 0,
            };
        },
    };
</script>

<style lang="scss">
    .app {
        width: 600px;
        height: 500px;
    }
</style>
