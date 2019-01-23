<template>
    <div>
        <div class="row pb-1">
            <div class="col-6">
                <router-link :to="{ path: '/tree/' + this.item.id }" tag="a">
                    <span class="text-danger h-75"> [{{ this.item.id }}]</span>
                </router-link>
                <span class="text-dark h6"> {{ getFamilyName() }}</span>
            </div>
            <div class="col">
                <span class="text-dark h-75">{{getHighlightedFields()}}</span>
            </div>
            <div class="col">
                <span>{{this.item.uniprot_ids.length}}</span>
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
        },
        methods: {
            getFamilyName() {
                if(this.item.family_name) {
                    return this.item.family_name[0];
                }
                return "";
            },
            getHighlightedFields() {
                var fl = "";
                if(!this.item.hl) {
                    console.log("Error! No highlighted field found!");
                    return fl;
                }

                if(this.item.hl[0] != this.item.id) {
                    console.log("Error");
                    return fl;
                }
                let keys = Object.keys(this.item.hl[1]);
                if(keys.length > 0) {
                    var names = "";
                    keys.forEach((key, i) => {
                        names += this.item.hl[1][key];
                        names += ", ";
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