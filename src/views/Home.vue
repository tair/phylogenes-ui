<template>
  <div>

    <banner></banner>

    <div class="container-fluid" style="max-width: 1600px">
      <!--<info-bar></info-bar>-->

      <div class="row">
        <div class="col-sm-12 col-md-6 col-lg-5 mb-3 pr-3">
          <search-bar></search-bar>
        </div>
        <div class="col-sm-12 col-md-6 col-lg-7 pr-4">
          <protein-sequence-list></protein-sequence-list>
          <info-bar></info-bar>
          <video-card></video-card>
        </div>
      </div>
    </div>

  </div>

</template>

<script>
// @ is an alias to /src
import Banner from '@/components/home/Banner'
import SearchBar from '@/components/home/SearchBar'
import ProteinSequenceList from '@/components/home/ProteinSequenceList'
import VideoCard from '@/components/home/VideoCard'
import InfoBar from '@/components/home/InfoBar'

export default {
  name: 'Home',
  components: {
    Banner,
    SearchBar,
    ProteinSequenceList,
    VideoCard,
    InfoBar
  }
}
</script>

<style>
  .input-block-level {
    display: block;
    width: 100%;
  }

</style>
