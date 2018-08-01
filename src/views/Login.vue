<template>
    <div>
        <site-map :current-page="name"></site-map>
        <relax></relax>
    </div>
</template>

<script>
    import Relax from '@/views/Relax'
    import SiteMap from '@/components/SiteMap'

    export default {
        components: {
            Relax,
            SiteMap
        },
        data() {
            return {
                name: "Login"
            }
        }
    }
</script>

<style scoped>

</style>
