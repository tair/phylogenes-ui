<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">Navbar</a>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item active">
            <a class="nav-link" href="#"
              >Home <span class="sr-only">(current)</span></a
            >
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Link</a>
          </li>
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Dropdown
            </a>
            <div class="dropdown-menu" aria-labelledby="navbarDropdown">
              <a class="dropdown-item" href="#">Action</a>
              <a class="dropdown-item" href="#">Another action</a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item" href="#">Something else here</a>
            </div>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Disabled</a>
          </li>
        </ul>
        <form class="form-inline my-2 my-lg-0">
          <input
            class="form-control mr-sm-2"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
          <button class="btn btn-outline-success my-2 my-sm-0" type="submit">
            Search
          </button>
        </form>
      </div>
    </nav>

    <nav
      id="navbar2"
      class="navbar navbar-expand-lg navbar-light bg-light sticky-top2"
    >
      <!--<a class="navbar-brand" href="#">Navbar</a>-->
      <!--<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">-->
      <!--<span class="navbar-toggler-icon"></span>-->
      <!--</button>-->

      <!--<div class="collapse navbar-collapse" id="navbarSupportedContent">-->
      <!--<ul class="navbar-nav mr-auto">-->
      <!--<li class="nav-item active">-->
      <!--<a class="nav-link" href="#">Home <span class="sr-only">(current)</span></a>-->
      <!--</li>-->
      <!--<li class="nav-item">-->
      <!--<a class="nav-link" href="#">Link</a>-->
      <!--</li>-->
      <!--<li class="nav-item dropdown">-->
      <!--<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">-->
      <!--Dropdown-->
      <!--</a>-->
      <!--<div class="dropdown-menu" aria-labelledby="navbarDropdown">-->
      <!--<a class="dropdown-item" href="#">Action</a>-->
      <!--<a class="dropdown-item" href="#">Another action</a>-->
      <!--<div class="dropdown-divider"></div>-->
      <!--<a class="dropdown-item" href="#">Something else here</a>-->
      <!--</div>-->
      <!--</li>-->
      <!--<li class="nav-item">-->
      <!--<a class="nav-link disabled" href="#">Disabled</a>-->
      <!--</li>-->
      <!--</ul>-->
      <!--<form class="form-inline my-2 my-lg-0">-->
      <!--<input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">-->
      <!--<button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>-->
      <!--</form>-->
      <!--</div>-->
      <a class="navbar-brand" href="#">
        <i class="fab fa-pagelines fa-3x ml-3"></i>
      </a>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav ml-auto">
          <li>
            <form class="nav-link form-inline my-2 my-lg-0">
              <input
                class="form-control mr-sm-2 form-control-sm"
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              <button
                class="btn btn-flat btn-success my-2 my-sm-0 btn-sm"
                type="submit"
              >
                Search
              </button>
            </form>
          </li>

          <router-link to="/" tag="li">
            <a
              class="nav-link active"
              style="font-size: 15px;"
              data-toggle="tooltip"
              title="Home"
            >
              <i class="fas fa-home"></i>
            </a>
          </router-link>

          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              style="font-size: 15px;"
              href="#"
              id="navbarDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <i class="fas fa-cogs"></i>
            </a>
            <div class="dropdown-menu" aria-labelledby="navbarDropdown">
              <router-link to="/about">
                <a class="dropdown-item">
                  <span>About</span>
                </a>
              </router-link>
              <a class="dropdown-item" href="#">Action</a>
              <a class="dropdown-item" href="#">Another action</a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item" href="#">Something else here</a>
            </div>
          </li>

          <router-link to="/about" tag="li">
            <a
              class="nav-link"
              style="font-size: 15px;"
              data-toggle="tooltip"
              title="About Us"
            >
              <i class="fas fa-users"></i>
            </a>
          </router-link>

          <router-link to="/help" tag="li">
            <a
              class="nav-link"
              style="font-size: 15px;"
              data-toggle="tooltip"
              title="Help"
            >
              <i class="fas fa-question-circle"></i>
            </a>
          </router-link>

          <router-link to="/" tag="li">
            <a
              class="nav-link"
              style="font-size: 15px;"
              data-toggle="tooltip"
              title="Contact Us"
            >
              <i class="fas fa-address-card"></i>
            </a>
          </router-link>

          <router-link to="/" tag="li">
            <a
              class="nav-link"
              style="font-size: 15px;"
              data-toggle="tooltip"
              title="Login with ORCID"
            >
              <i class="fas fa-sign-in-alt"></i>
            </a>
          </router-link>
        </ul>
      </div>
    </nav>

    <main role="main" class="main-pane">
      <router-view></router-view>
    </main>

    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>
    <h1>test</h1>

    <footer-bar></footer-bar>
  </div>
</template>

<script>
import TopNavBar from '@/components/TopNavBar.vue'
import FooterBar from '@/components/FooterBar.vue'

export default {
  name: 'App2',
  components: {
    TopNavBar,
    FooterBar,
  },
  mounted() {
    window.onscroll = function () {
      myFunction()
    }

    var navbar = document.getElementById('navbar2')
    var sticky = navbar.offsetTop

    function myFunction() {
      if (window.pageYOffset >= sticky) {
        navbar.classList.add('sticky')
      } else {
        navbar.classList.remove('sticky')
      }
    }
  },
}
</script>

<style lang="scss">
@import 'assets/css/app.scss';
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
@import url('https://use.fontawesome.com/releases/v5.0.13/css/all.css');
/*@import url('https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/css/bootstrap.css');*/

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
  color: red;
  background-color: red;
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
  background-color: #efefef;
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
  margin-top: 20px;
}

code {
  font-size: 80%;
}
</style>
