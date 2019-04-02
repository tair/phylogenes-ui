<template>
  <div>

    <banner></banner>

    <div class="container-fluid px-5">

      <div class="d-flex flex-row">
        <div class="col-sm-12 col-md-6 col-lg-6 px-3">
          <summary-stats></summary-stats>
          <search-bar></search-bar>
          <button class="btn btn-mblue text-magenta my-3 px-3 py-2" @click.prevent="goToSample()">Explore a sample tree</button>
          <video-card></video-card>
        </div>
        <div class="same-height col-sm-12 col-md-6 col-lg-6 px-3">
          <organism></organism>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
// @ is an alias to /src
import Banner from '@/components/home/Banner'
import SearchBar from '@/components/home/SearchBar'
import SummaryStats from '@/components/home/SummaryStats'
import VideoCard from '@/components/home/VideoCard'
import Organism from '@/components/home/Organism'

export default {
  name: 'Home',
  components: {
    Banner,
    SearchBar,
    SummaryStats,
    VideoCard,
    Organism,
  },
  methods: {
    goToSample(){
      this.$router.push('/tree/PTHR11101');
    }
  }
}
</script>

<style scoped>
  .parent {
    display: flex;
  }
.panel {
  position: relative;
  width: 200px;
  background: pink;
}
.same-height {
  position: relative;
}
.panel-inner {
  position: absolute;
  top: 0; left: 0;
  right: 0; bottom: 0;
  overflow-y: scroll;
}
</style>
