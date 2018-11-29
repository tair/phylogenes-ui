<template>
    <div>
        <div class="row pb-1">
            <div class="col-6">
                <span class="text-dark h6">{{ this.item.family_name[0] }}</span>
                <router-link :to="{ path: '/tree/' + this.item.id }" tag="a">
                    <span class="text-danger h-75"> [{{ this.item.id }}]</span>
                </router-link>
            </div>
            <div class="col">
                <span class="text-dark h-75">{{getHighlightedFields()}}</span>
            </div>
            <div class="col">
                <span>{{this.item.uniprot_ids.length}}</span>
            </div>
        </div>
    </div>

    <!--<div class="row pt-2">-->
    <!--<div class="col-sm-12 col-md-6">-->
    <!--<div class="text-danger text-bold text-sm">Sub Families</div>-->
    <!--<div class="p-2 gray-box">-->
    <!--<div v-for="sf_name in this.item.sf_names" class="text-muted text-sm mr-2">{{ sf_name }}</div>-->
    <!--</div>-->
    <!--</div>-->
    <!--<div class="col-sm-12 col-md-3">-->
    <!--<div class="text-danger text-bold text-sm">Gene Symbols</div>-->
    <!--<div class="p-2 gray-box" style="width: 150px">-->
    <!--<div v-for="gene_symbol in this.item.gene_symbols" class="text-muted text-sm mr-2">{{ gene_symbol }}</div>-->
    <!--</div>-->
    <!--</div>-->
    <!--<div class="col-sm-12 col-md-3">-->
    <!--<div class="text-danger text-bold text-sm">Uniprot IDs</div>-->
    <!--<div class="p-2 gray-box" style="width: 150px">-->
    <!--<div v-for="uniprot_id in this.item.uniprot_ids" class="text-muted text-sm mr-2">{{ uniprot_id }}</div>-->
    <!--</div>-->
    <!--</div>-->
    <!--</div>-->
</template>

<script>

    export default {
        name: "TreeResultItem",
        props: {
            item: {
                type: Object,
                required: true
            }
        },
        methods: {
            getHighlightedFields() {
                var fl = "";
                if(!this.item.hl) {
                    console.log("Error! No highlighted field found!");
                    return fl;
                }

                if(this.item.hl[0] != this.item.id) {
                    console.log("Error");
                }
                let keys = Object.keys(this.item.hl[1]);
                if(keys.length > 0) {
                    keys.forEach((key, i) => {
                        fl += this.mapFieldToDisplayName(key);
                        if(keys.length > 1) {
                            if(i != keys.length - 1) {
                                fl += ", ";
                            }
                        }
                    });
                }
                return fl;
            },
            mapFieldToDisplayName(fl) {
                var displayName = "";
                switch(fl) {
                    case 'gene_symbols':
                        displayName = 'gene symbol';
                        break;
                    case 'sf_names':
                        displayName = 'subfamily name';
                        break;
                    case 'family_name':
                        displayName = 'family name';
                        break;
                    default:
                        console.log("Error! Unknown field name matched");
                }
                return displayName;
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