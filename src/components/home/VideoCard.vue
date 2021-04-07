<template>
  <div class="mb-5 elevation-0">
    <div class="embed-responsive embed-responsive-5by3">
      <iframe
        class="embed-responsive-item"
        src="https://www.youtube.com/embed/oIXdai9fu6o?rel=0"
        allowfullscreen
      ></iframe>
    </div>

    <div class="bg-pggrey pt-2">
      <a href="https://www.youtube.com/watch?v=UE7FJpKcP1o" target="_blank">
        <p class="text-magenta linkTxt">
          More in a Webinar <i class="fab fa-youtube ml-1"></i>
        </p>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: "VideoCard",
};
</script>

<style scoped>
.linkTxt {
  font-size: 2rem;
}

.embed-responsive-5by3{
   padding-bottom: 60%;
}
</style>
