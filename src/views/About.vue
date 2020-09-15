<template>
  <div class="m-0 p-0 bg-white">
    <site-map :current-page="name"></site-map>

    <div class="container mt-5">
      <h3 class="text-primary">
        The current data version of PhyloGenes is 1.0.0. The version number
        refers to the combination of phylogenetic trees and gene functional data
        displayed in this tool.
      </h3>

      <div class="h1 mt-5 text-primary">What's New?</div>

      This is the beta release for PhyloGenes. Lorem ipsum dolor sit amet,
      consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore
      et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
      ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
      dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
      nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
      culpa qui officia deserunt mollit anim id est laborum.

      <div class="h1 mt-5 text-primary">NSF Abstract/Project Plan</div>

      <div class="row">
        <div class="col">
          Addressing the food needs of an increasing global population in the
          the 21st century will require significant improvements in agriculture
          akin to the Green Revolution of the previous century. To address this
          goal it is of critical importance to understand as much as possible
          about the functions of the tens of thousands of genes present in each
          plant species, in order to select those functions of most relevance to
          engineering favorable traits such as drought tolerance or increased
          grain quality. Much of what we currently know about plant gene
          function comes from experiments in model plant systems such as
          Arabidopsis thaliana, but because of evolutionary relatedness this
          information can be used to predict the functions of genes in crop
          species such as maize and rice, and to provide targeted hypotheses
          that can be followed up by further experiments. We will increase both
          the efficiency and accuracy of gene function prediction in plants by
          organizing and integrating high quality data from a number of sources
          and presenting it in a user-friendly format that makes clear the
          evolutionary relationships between genes. We will develop software for
          visualizing the evolutionary relationships as a gene family tree,
          providing an organizing framework for disparate experimental
          observations from a number of experimental systems. The project will
          provide software for use, and for data sharing, by a broad community
          of both researchers and students.
        </div>
        <div class="col">
          The project’s inclusion of local community college students will
          provide training and increase participation in computer science,
          genomics and plant biology by groups that are underrepresented in
          these fields. The project output will be a powerful and intuitive
          software tool for inferring plant gene function from phylogenetic
          relationships and experimental evidence. To achieve this goal the
          project aims are to: 1) assemble sets of of phylogenetic trees using
          selected model organism and plant genomes, along with a suite of web
          services to ensure easy access to the data; 2) follow user-driven
          design principles to design and build the user interface, in order to
          visualize the phylogenetic trees and associate the genes within each
          tree with high quality functional information including Gene Ontology
          annotations, gene expression patterns, protein domains, sequence
          variations and mutant phenotypes; 3) provide an analysis platform that
          streamlines workflows and includes personal workspaces for users to
          add their own data and make it public when their work is completed,
          thus enriching the knowledgebase; and 4) produce workshops, course
          materials and online content to train scientists at all academic
          levels on how to use the software.
        </div>
      </div>

      <div class="h1 mt-5 text-primary">Grant number:</div>
      NNNNNNNNNN.

      <div class="h1 mt-5 text-primary">
        Data Sources included in the current release:
      </div>
      <ul>
        <li>
          UniProt Reference Proteomes for A. thaliana, B. distachyon, O. sativa,
          etc
        </li>
        <li>Panther13</li>
      </ul>

      <div class="h1 mt-5 text-primary">What's Coming</div>
      <ul>
        <li>
          New datasets to be added by 04/01/2019 are: GEO datasets 123 and 456
          for tomato
        </li>
        <li>
          Ability to integrate your sequence from a species not included in the
          Panther14 trees onto the best matching tree.
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import SiteMap from '@/components/SiteMap'

export default {
  components: {
    SiteMap,
  },
  data() {
    return {
      name: 'About',
    }
  },
}
</script>
