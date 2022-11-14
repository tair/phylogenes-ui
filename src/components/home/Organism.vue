<template>
  <div>
    <div class="white-background bg-white mb-5 mx-3">
      <button
        class="btn btn-default btn-organism"
        @click.prevent="switchView()"
        v-if="showText"
      >
        View species tree
      </button>
      <button
        class="btn btn-default btn-organism"
        @click.prevent="switchView()"
        v-if="!showText"
      >
        Switch to see full list of species in plain text
      </button>
      <a class="btn btn-outline btn-organism a-link">
        <router-link class="text-magenta" to="/grafting"
          >Not seeing your species?</router-link
        >
      </a>
      <div class="scroll-div bg-white my-2 px-5" v-if="showText">
        <p class="text-lg mr-5 pr-5">
          Protein sequences from these plant species are included in the current
          PhyloGenes release (version 4.1):
        </p>
        <div class="row">
          <div class="col-sm-12 col-md-6 col-lg-6">
            <p>
              <a
                v-for="data in plantSpecies.slice(
                  0,
                  (plantSpecies.length + 1) / 2
                )"
                :href="
                  'https://conf.arabidopsis.org/display/PHGSUP/' +
                  data.sciName.replace(' ', '+')
                "
              >
                <i>{{ data.sciName }}</i
                >&nbsp;
                <template v-if="data.cmnName">({{ data.cmnName }})</template>
                <br />
              </a>
            </p>
          </div>
          <div class="col-sm-12 col-md-6 col-lg-6">
            <p>
              <a
                v-for="data in plantSpecies.slice(
                  (plantSpecies.length + 1) / 2
                )"
                :href="
                  'https://conf.arabidopsis.org/display/PHGSUP/' +
                  data.sciName.replace(' ', '+')
                "
              >
                <i>{{ data.sciName }}</i
                >&nbsp;
                <template v-if="data.cmnName">({{ data.cmnName }})</template>
                <br />
              </a>
            </p>
          </div>
        </div>

        <p class="text-lg">
          Protein sequences from the following non-plant model organisms are
          include to provide functional information that can be useful for when
          no experimental plant data is available:
        </p>

        <p>
          <template v-for="data in nonPlantSpecies" href>
            <i>{{ data.sciName }}</i
            >&nbsp;
            <template v-if="data.cmnName">({{ data.cmnName }})</template>
            <br />
          </template>
        </p>
      </div>
      <div
        class="scroll-div bg-white mt-lg d-flex align-items-center"
        v-if="!showText"
      >
        <img
          src="../../../src/assets/img/species-tree-Panther17.png"
          alt="speciestree"
          style="width: 100%; height: 100%;"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Organism',
  data() {
    return {
      showText: true,
      plantSpecies: [
        { sciName: 'Amborella trichopoda', cmnName: '' },
        { sciName: 'Arabidopsis thaliana', cmnName: '' },
        { sciName: 'Brachypodium distachyon', cmnName: 'purple false brome' },
        { sciName: 'Brassica napus', cmnName: 'rapeseed' },
        {
          sciName: 'Brassica rapa subsp. Pekinensis',
          cmnName: 'Chinese cabbage',
        },
        { sciName: 'Capsicum annuum', cmnName: 'pepper' },
        { sciName: 'Chlamydomonas reinhardtii', cmnName: '' },
        { sciName: 'Citrus sinensis', cmnName: 'orange' },
        { sciName: 'Cucumis sativus', cmnName: 'cucumber' },
        { sciName: 'Erythranthe guttata', cmnName: 'yellow monkey flower' },
        { sciName: 'Eucalyptus grandis', cmnName: 'flooded gum' },
        { sciName: 'Glycine max', cmnName: 'soybean' },
        { sciName: 'Gossypium hirsutum', cmnName: 'cotton' },
        { sciName: 'Helianthus annuus', cmnName: 'sunflower' },
        { sciName: 'Hordeum vulgare', cmnName: 'barley' },
        { sciName: 'Juglans regia', cmnName: 'walnut' },
        { sciName: 'Klebsormidium nitens', cmnName: '' },
        { sciName: 'Lactuca sativa', cmnName: 'lettuce' },
        { sciName: 'Manihot esculenta', cmnName: 'cassava' },
        { sciName: 'Medicago truncatula', cmnName: 'barrelclover' },
        { sciName: 'Marchantia polymorpha', cmnName: 'common liverwort' },
        { sciName: 'Musa acuminata', cmnName: 'banana' },
        { sciName: 'Nelumbo nucifera', cmnName: 'sacred lotus' },
        { sciName: 'Nicotiana tabacum', cmnName: 'tobacco' },
        { sciName: 'Oryza sativa', cmnName: 'rice' },
        { sciName: 'Physcomitrella patens', cmnName: '' },
        { sciName: 'Populus trichocarpa', cmnName: 'black cottonwood' },
        { sciName: 'Prunus persica', cmnName: 'peach' },
        { sciName: 'Ricinus communis', cmnName: 'castor bean' },
        { sciName: 'Selaginella moellendorffii', cmnName: '' },
        { sciName: 'Setaria italica', cmnName: 'foxtail millet' },
        { sciName: 'Solanum lycopersicum', cmnName: 'tomato' },
        { sciName: 'Solanum tuberosum', cmnName: 'potato' },
        { sciName: 'Sorghum bicolor', cmnName: 'sorghum' },
        { sciName: 'Spinacia oleracea', cmnName: 'spinach' },
        { sciName: 'Theobroma cacao', cmnName: 'cocoa' },
        { sciName: 'Triticum aestivum', cmnName: 'wheat' },
        { sciName: 'Vitis vinifera', cmnName: 'grape' },
        { sciName: 'Zea mays', cmnName: 'corn' },
        { sciName: 'Zostera marina', cmnName: 'eelgrass' },
      ],
      nonPlantSpecies: [
        { sciName: 'Caenorhabditis elegans', cmnName: 'nematode worm' },
        { sciName: 'Danio rerio', cmnName: 'zebrafish' },
        { sciName: 'Dictyostelium discoideum', cmnName: '' },
        { sciName: 'Drosophila melanogaster', cmnName: 'fruit fly' },
        { sciName: 'Escherichia coli', cmnName: '' },
        { sciName: 'Homo sapiens', cmnName: 'human' },
        { sciName: 'Rattus norvegicus', cmnName: 'rat' },
        { sciName: 'Saccharomyces cerevisiae', cmnName: 'budding yeast' },
        { sciName: 'Schizosaccharomyces pombe', cmnName: 'fission yeast' },
      ],
    }
  },
  methods: {
    switchView() {
      this.showText = !this.showText
    },
  },
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
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
.btn-organism {
  cursor: pointer;
  position: absolute;
  right: 0;
  z-index: 1;
}
.a-link {
  top: 40px;
}
.mt-lg {
  margin-top: 80px;
}
</style>
