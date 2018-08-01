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
        data() {
            return {
                name: "Contact"
            }
        },
        components: {
            Relax,
            SiteMap
        }
    }
</script>

<style scoped>

</style>