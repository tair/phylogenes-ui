<template>
    <div class="p-3">
        tree details for <h3>{{ this.treeId }}</h3>
    </div>
</template>

<script>
    export default {
        name: "TreeDetail",
        data() {
            return {
                treeId: null
            }
        },
        watch: {
            '$route.params.id': function (id) {
                this.treeId = id;
                console.log('ID: ' + this.treeId);
            }
        },
        created() {
            this.treeId = this.$route.params.id;
            console.log('ID1: ' + this.treeId);
        }
    }
</script>

<style scoped>

</style>