<template>
    <a 
        class="spanText"
        data-toggle="tooltip" :title="this.content.text"
        :href="this.content.link" target="_blank">
            {{this.content.text}}
    </a>
</template>

<script>
    export default {
        name: "cell-link",
        props: ["content"],
        watch: {
            content: {
                handler: function (val, oldVal) {
                }
            }
        },
        mounted() {
        },
        data() {
            return {
                
            }
        },
        methods: {
            
        }
    }
</script>
<style scoped> 
    .spanText {
        padding-left: 10px;
    }
</style>