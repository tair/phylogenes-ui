<template>
    <div class="bg-white elevation-0 mb-3 p-3">

        <div class="row pb-1">
            <div class="col-10">
                <span class="pr-2 text-primary h5">{{ this.item.family_name[0] }}</span>


                <router-link :to="{ path: '/tree/' + this.item.id }" tag="a">
                    <span class="badge badge-warning p-1">
                        {{ this.item.id }}
                     </span>
                </router-link>



            </div>
            <div class="col-2">
                <i class="fa fa-star text-warning float-right"></i>
                <i class="fas fa-save text-success float-right pr-2"></i>
                <i class="fas fa-download text-danger float-right pr-2"></i>
            </div>
        </div>

        <div v-for="sf_name in this.item.sf_names" class="text-muted text-sm mr-2">{{ sf_name }}</div>

    </div>
</template>

<script>
    export default {
        name: "TreeResultItem",
        props: {
            item: {
                type: Object,
                required: true
            }
        }
    }
</script>

<style scoped>

</style>
