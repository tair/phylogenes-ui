<template>
  <div>
    <site-map :current-page="name"></site-map>
    <div class="d-flex justify-content-center p-5">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h4>Contact Us</h4>
          </div>
          <div class="card-footer text-center text-muted h5 mb-0">
            <div class="row">
              <div class="col">
                Phoenix Bioinformatics<br />
                39221 Paseo Padre Parkway, Ste. J<br />
                Fremont, CA 94538, USA<br /><br /><br />

                We are in the Pacific Time Zone<br />
                Tel. : (650) 995-7502<br />
                Fax : (877) 820-5814<br />
                info@phylogenes.org
                <br /><br /><br />

                <a
                  href="mailto:info@phylogenes.org?subject=Contact%20PhyloGenes"
                  >Email Us</a
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Relax from '@/views/Relax'
import SiteMap from '@/components/SiteMap'

export default {
  data() {
    return {
      name: 'Contact',
    }
  },
  components: {
    Relax,
    SiteMap,
  },
}
</script>

<style scoped></style>
