<template>
    <span class="spanText"
          data-toggle="tooltip" :title="this.content.text" v-html="this.content.text">
          <!-- {{this.content.text}} -->
    </span>
</template>

<script>
    export default {
        name: "cell-default",
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