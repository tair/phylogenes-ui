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

        <div class="row pt-2">
            <div class="col-sm-12 col-md-6">
                <div class="text-danger text-bold text-sm">Sub Families</div>
                <div class="p-2 gray-box">
                    <div v-for="sf_name in this.item.sf_names" class="text-muted text-sm mr-2">{{ sf_name }}</div>
                </div>
            </div>
            <div class="col-sm-12 col-md-3">
                <div class="text-danger text-bold text-sm">Gene Symbols</div>
                <div class="p-2 gray-box" style="width: 150px">
                    <div v-for="gene_symbol in this.item.gene_symbols" class="text-muted text-sm mr-2">{{ gene_symbol }}</div>
                </div>
            </div>
            <div class="col-sm-12 col-md-3">
                <div class="text-danger text-bold text-sm">Uniprot IDs</div>
                <div class="p-2 gray-box" style="width: 150px">
                    <div v-for="uniprot_id in this.item.uniprot_ids" class="text-muted text-sm mr-2">{{ uniprot_id }}</div>
                </div>
            </div>
        </div>


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
    .gray-box {
        background-color: #fbfbfb;
        border: 1px solid #efefef;
        height: 80px;
        overflow-y: scroll;
    }
</style>


http://localhost:8983/solr/panther/select?facet.field=node_types&
facet.field=organisms&facet.field=species_list&facet=on&fl=id,%20sf_names,
%20family_name,%20node_types,%20gene_symbols,%20uniprot_ids&rows=undefined
&start=0&q=family_name:%22protein%22


Payload: {"startRow":0,"rows":10,"familyName":"protein","uniprotId":null,"nodeTypes":[],"organisms":[],"species":[]}
Payload: {"startRow":0,"rows":10,"familyName":"protein","uniprotId":null,"nodeTypes":[],"organisms":[],"species":[]}
