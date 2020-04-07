<template>
  <div>
    <top-nav-bar></top-nav-bar>

    <main id="main2" role="main" class="main-pane">
      <keep-alive>
        <router-view></router-view>
      </keep-alive>
    </main>

    <footer-bar></footer-bar>
  </div>
</template>

<script>
import TopNavBar from '@/components/TopNavBar.vue'
import FooterBar from '@/components/FooterBar.vue'

export default {
  components: {
    TopNavBar,
    FooterBar,
  },
  mounted() {
    console.log('Env name ' + process.env.VUE_APP_NAME)
    // window.onscroll = function() {myFunction()};
    //
    // var navbar = document.getElementById("navbar2");
    // var main2 = document.getElementById("main2");
    // var sticky = navbar.offsetTop;
    //
    //
    // function myFunction() {
    //     if (window.pageYOffset >= sticky) {
    //         navbar.classList.add("sticky");
    //         main2.classList.add("main-pane2");
    //         main2.classList.remove("main-pane");
    //
    //     } else {
    //         navbar.classList.remove("sticky");
    //         main2.classList.remove("main-pane2");
    //         main2.classList.add("main-pane");
    //     }
    // }
  },
}
</script>

<style lang="scss">
@import 'assets/css/app.scss';
@import '~pretty-checkbox/src/pretty-checkbox.scss';
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
@import url('https://use.fontawesome.com/releases/v5.6.0/css/all.css');
/*@import "/node_modules/@fortawesome/fontawesome-free/css/all.css";*/

input::-webkit-input-placeholder {
  color: #adb5bd !important;
}

input:-moz-placeholder {
  /* Firefox 18- */
  color: #adb5bd !important;
}

input::-moz-placeholder {
  /* Firefox 19+ */
  color: #adb5bd !important;
}

input:-ms-input-placeholder {
  color: #adb5bd !important;
}

#navbar2 {
  overflow: hidden;
  background-color: #333;
}

.sticky {
  position: fixed;
  top: 0;
  width: 100%;
}

nav.sticky-top2 {
  z-index: 1003;
}

#app {
  font-family: 'Source Sans Pro';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

/* Sticky footer styles
  -------------------------------------------------- */
html {
  position: relative;
  min-height: 100%;
}
body {
  /* Margin bottom by footer height */
  margin-bottom: 60px;
  background-color: #e9e9e9;
}
.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  /* Set the fixed height of the footer here */
  height: 60px;
  line-height: 60px; /* Vertically center the text there */
  background-color: #fff;
}

/* Custom page CSS
  -------------------------------------------------- */
/* Not required for template or sticky footer method. */

body > .container {
  padding: 60px 15px 0;
}

.footer > .container {
  padding-right: 15px;
  padding-left: 15px;
}

.main-pane {
  margin-top: 60px;
}

.main-pane2 {
  margin-top: 115px;
}

code {
  font-size: 80%;
}

.borderless {
  border: none;
}
</style>
