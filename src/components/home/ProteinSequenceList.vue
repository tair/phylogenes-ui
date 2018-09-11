<template>
    <div class="row">
        <div class="col-sm-12 col-md-6 col-lg-6 pr-3 mb-2">
            <div class="card elevation-0 border-success">
                <div class="card-header bg-danger pb-0">
                    <h4>Protein sequences</h4>
                    <p class="text-sm">Plant species</p>
                </div>
                <div class="list-group" style="max-height: 200px; overflow: auto">
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">soybean (Glycine max)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">poplar (Populus trichocarpa)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">grape (Vitis vinifera)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">tomato (Solanum lycopersicum)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">corn (Zea mays)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">rice (Oryza sativa ssp. japonica)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">Brachypodium (Brachypodium distachyon)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-danger">moss (Physcomitrella patens)</a>
                </div>
            </div>
        </div>
        <div class="col-sm-12 col-md-6 col-lg-6">

            <div class="card elevation-0">
                <div class="card-header text-white bg-warning pb-0">
                    <h4>Protein sequences</h4>
                    <p class="text-sm">Non-plant species</p>
                </div>

                <div class="list-group" style="max-height: 200px; overflow: auto">
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">worm (Caenorhabditis elegans)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">human (Homo sapiens)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">green algae (Chlamydomonas reinhardii)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">mouse (Mus musculus)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">rat (Rrattus norvegicus)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">zebrafish (Danio rerio)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">Escherichia coli</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">slime mold (Dictyostelium discoidum)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">fruit fly	(Drosophila melanogaster)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">budding yeast (Schizosaccharomyces pombe)</a>
                    <a href="#" class="list-group-item list-group-item-action borderless text-info">fission yeast (Saccharomyces cerevisiae)</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "ProteinSequenceList"
    }
</script>

<style scoped>

</style>
