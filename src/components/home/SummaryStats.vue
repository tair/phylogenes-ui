<template>
    <div class="bg-lblue px-3">
        <div class="card elevation-0 border-success">
            <div class="bg-lblue py-2 text-dark text-lg" v-for="stat in summaryStats" :key="stat.name">{{ stat.count }}&nbsp;{{stat.name}}</div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "SummaryStats",
        data(){
            return{
                summaryStats: [
                    { count: 8512, name: "trees (gene families)"},
                    { count: 1256047, name: "proteins"},
                    { count: 40, name: "plant species"},
                    { count: 10, name: "non-plant model organisms"},
                ]
            }
        }
    }
</script>

<style scoped>

</style>
