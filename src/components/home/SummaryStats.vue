<template>
    <div class="row">
        <div class="col-sm-11 col-md-6 col-lg-6 pr-3 mb-2">
            <div class="card elevation-0 border-success">
                <div class="list-group" style="max-height: 200px; overflow: auto">
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">12345 trees (gene families)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">123456789 proteins</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">30 plant species</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">11 non-plant model organisms</a>
                </div>
            </div>
        </div>
        <div><a href="#"><i class="fas fa-info-circle fa-lg" v-b-popover="'info text'"></i></a></div>
    </div>
</template>

<script>
    export default {
        name: "SummaryStats"
    }
</script>

<style scoped>

</style>
