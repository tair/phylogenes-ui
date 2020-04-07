<template>
  <div>
    <site-map :current-page="name"></site-map>

    <div class="container mt-5">
      <div class="row">
        <div class="col-lg-4 col-md-6">
          <div class="card">
            <div class="embed-responsive embed-responsive-16by9">
              <iframe
                class="embed-responsive-item"
                src="https://www.youtube.com/embed/ZyWYID2cTK0"
                allowfullscreen
              ></iframe>
            </div>
            <div class="card-body">
              <h5 class="card-title">The Basics</h5>
            </div>
          </div>
        </div>
        <div class="col-lg-4 col-md-6">
          <div class="card">
            <div class="embed-responsive embed-responsive-16by9">
              <iframe
                class="embed-responsive-item"
                src="https://www.youtube.com/embed/V04jvRh5YFE"
                allowfullscreen
              ></iframe>
            </div>
            <div class="card-body">
              <h5 class="card-title">How are Panther Trees Built?</h5>
            </div>
          </div>
        </div>
        <div class="col-lg-4 col-md-6">
          <div class="card">
            <div class="embed-responsive embed-responsive-16by9">
              <iframe
                class="embed-responsive-item"
                src="https://www.youtube.com/embed/CrrSAc-vjG4"
                allowfullscreen
              ></iframe>
            </div>
            <div class="card-body">
              <h5 class="card-title">My Workspace Features</h5>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col mr-5">
          <div class="h5 text-primary mt-4">How can I search PhyloGenes?</div>
          You can use UniProt IDs, AGI identifiers (A. thaliana), PANTHER family
          names, Gene Ontology terms and ...
          <div class="h5 text-primary mt-4">
            What happens when I enter a protein sequence?
          </div>
          If your protein sequence comes from a species included in the current
          PhyloGenes release, this action finds the tree containing the sequence
          that matches the sequence you entered. BLAST > cutoff? > tree. If your
          protein sequence comes from a species not included in the current
          PhyloGenes release, this action integrates your sequence into the best
          matching tree. HMM > recalculation > display
          <div class="h5 text-primary mt-4">
            How can I use PhyloGenes for candidate gene validation?
          </div>
          See our [video] or [instruction manual].
          <div class="h5 text-primary mt-4">How are Panther trees built?</div>
          The trees are constructed using the [GIGA algorithm].
        </div>
        <div class="col">
          <div class="h5 text-primary mt-4">
            How can I use PhyloGenes for searching for more than one gene at a
            time?
          </div>
          Not yet.
          <div class="h5 text-primary mt-4">
            Is there a command line version of PhyloGenes?
          </div>
          Not yet.
          <div class="h5 text-primary mt-4">Can I upload a whole genome?</div>
          Not yet.
          <div class="h5 text-primary mt-4">
            How can I use PhyloGenes for teaching?
          </div>
          Yes, [here] are some sample exercises.
          <div class="h5 text-primary mt-4">
            Can I get updates on what's coming up next?
          </div>
          Join our user community through our low traffic [mailing list] to keep
          up with what's new.
        </div>
      </div>
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
      name: 'Help',
    }
  },
}
</script>

<style scoped></style>
