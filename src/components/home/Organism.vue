<template>
	<div>
	<div class="white-background bg-white mb-5 mx-3">
		<button class="btn btn-default btn-organism" @click.prevent="switchView()" v-if="showText">View species tree</button>
		<button class="btn btn-default btn-organism" @click.prevent="switchView()" v-if="!showText">Switch to see full list of species in plain text</button>		
		<div class="scroll-div bg-white my-2 px-5" v-if="showText">
			<p class="text-lg mr-5 pr-5">Protein sequences from these plant species are included in the current PhyloGenes release (version 1.0):</p>

			<p>Amborella trichopoda<br>
			Arabidopsis thaliana<br>
			Brachypodium distachyon (purple false brome)<br>
			Brassica rapa subsp. Pekinensis (Chinese cabbage)<br>
			Chlamydomonas reinhardtii<br>
			Citrus sinensis (orange)<br>
			Cucumis sativus (cucumber)<br>
			Erythranthe guttata (yellow monkey flower)<br>
			Glycine max (soybean)<br>
			Gossypium hirsutum (cotton)<br>
			Helianthus annuus (sunflower)<br>
			Hordeum vulgare (barley)<br>
			Medicago truncatula (barrelclover)<br>
			Musa acuminata (banana)<br>
			Nicotiana tabacum (tobacco)<br>
			Oryza sativa (rice)<br>
			Ostreococcus tauri<br>
			Phoenix dactylifera (date palm)<br>
			Physcomitrella patens<br>
			Populus trichocarpa (black cottonwood)<br>
			Prunus persica (peach)<br>
			Ricinus communis (castor bean)<br>
			Setaria italica (foxtail millet)<br>
			Solanum lycopersicum (tomato)<br>
			Sorghum bicolor (sorghum)<br>
			Theobroma cacao (cocoa)<br>
			Triticum aestivum (wheat)<br>
			Vitis vinifera (grape)<br>
			Zea mays (corn)<br>
			Zostera marina (eelgrass)</p>

			<p class="text-lg">Protein sequences from the following non-plant model organisms are include to provide functional information that can be useful for when no experimental plant data is available:</p>

			<p>Caenorhabditis elegans (nematode worm)<br>
			Danio rerio (zebrafish)<br>
			Dictyostelium discoideum<br>
			Drosophila melanogaster (fruit fly)<br>
			Escherichia coli<br>
			Homo sapiens (human)<br>
			Mus musculus (mouse)<br>
			Rattus norvegicus (rat)<br>
			Saccharomyces cerevisiae (budding yeast)<br>
			Schizosaccharomyces pombe (fission yeast)</p>

		</div>
		<div class="scroll-div bg-white my-5 d-flex align-items-center" v-if="!showText">
			<img src="../../../src/assets/img/speciestree.png" alt="speciestree" style="width:100%">
		</div>
	</div>
</div>
</template>

<script>
    export default {
        name: "Organism",
        data() {
            return {
                showText: true,
            }
        },
        methods: {
        	switchView(){
        		this.showText = !this.showText;
        	}
        }
    }
</script>

<style scoped>
	.scroll-div {
	    position: absolute;
	    top: 0;
	    bottom: 0;
	    overflow-y: scroll;
	}
	.white-background {
	    position: absolute;
	    top: 0; left:0;
	    bottom: 0; right:0;
	}
	.btn-organism {
		position: absolute;
		right: 0;
		z-index: 1;
	}
</style>