<template>
    <!-- <div class="slantedText" -->
          <!-- data-toggle="tooltip" :title="this.content.text"> -->
          <!-- <span></span> -->
          <!-- {{this.content.text}} -->
    <!-- </div> -->
    <div class="outerDiv">
        <div class="innerDiv">{{this.content.text}}</div>
    </div>
</template>

<script>
    export default {
        name: "cell-slanted",
        props: ["content"],
        watch: {
            content: {
                handler: function (val, oldVal) {
                }
            }
        },
        mounted() {
            console.log('slanted');
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
    .slantedText {
        height: 200px;
        transform: skew(-30deg);
    }
    .outerDiv {
        background-color: #9cd5e3;
        height: 200px;
        width: 50px;
        transform: skew(-30deg) translate(110%);
    }
    .innerDiv {
        position: absolute;
        text-align: left;
        transform: skew(30deg) rotate(-60deg);
        transform-origin: 0 0;
        bottom: -34%;
        left: 10px;
        width: 250px;
        height: 85px;
        z-index: 100;
    }
</style>