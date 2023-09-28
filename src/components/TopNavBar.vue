<template>
  <div>
    <!-- Fixed navbar -->
    <nav
      id="navbar2"
      class="navbar navbar-expand-md navbar-light fixed-top elevation-2 bg-dblue"
    >
      <a class="my-logo" href="/">
        <img
          width="75"
          height="48"
          src="../../src/assets/img/phy-logo2.png"
          alt
        />
      </a>
      <a
        class="my-logo2"
        :href="`${profileDomain}`"
        target="_blank"
      >
        <span>Supported by </span>
        <img
          width="60"
          height="60"
          src="../../src/assets/img/tairLogo.gif"
          alt
        />
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
          <router-link to="/" tag="li">
            <a
              class="nav-link pr-3 active"
              style="font-size: 15px;"
              data-toggle="tooltip"
              title="Home"
              >Home</a
            >
          </router-link>

          <a
            href="https://conf.arabidopsis.org/display/PHGSUP/About+PhyloGenes"
            target="_blank"
            class="nav-link pr-3"
            style="font-size: 15px;"
            data-toggle="tooltip"
            title="About Us"
            >About</a
          >

          <a
            href="https://conf.arabidopsis.org/display/PHGSUP"
            target="_blank"
            class="nav-link pr-3"
            style="font-size: 15px;"
            data-toggle="tooltip"
            title="Help"
            >Help</a
          >

          <router-link to="/contact" tag="li">
            <a
              class="nav-link pr-3"
              style="font-size: 15px;"
              data-toggle="tooltip"
              title="Contact Us"
              >Contact</a
            >
          </router-link>

          <li>
            <form
              class="nav-link form-inline my-2 my-lg-0"
              @submit.prevent="onSearch()"
            >
              <input
                class="form-control mr-sm-2 form-control-sm nav-input-width"
                v-model="searchText"
                style="border: none;"
                type="text"
                placeholder="search by UniProt ID, gene ID, gene symbol or keyword"
                aria-label="Search"
              />
              <button
                class="btn btn-sm btn-pggrey mr-2"
                @click.prevent="onSearch()"
              >
                <i class="fa fa-search"></i>
              </button>
              <button class="btn btn-sm btn-pggrey" @click.prevent="onReset()">
                <i class="fa fa-times"></i>
              </button>
            </form>
          </li>

          <a
            v-if="!isLoggedIn"
            :href="`${profileDomain}/community/abrc-new-register.faces`"
            target="_blank"
            class="nav-link pr-3"
            style="font-size: 15px;"
            data-toggle="tooltip"
            title="Register"
            >Register</a
          >
          <a
            v-if="!isLoggedIn"
            :href="`${loginDomain}/#/contentaccess/login?partnerId=tair&redirect=https:%2F%2Fphylogenes-sandbox.arabidopsis.org`"
            target="_blank"
            class="nav-link pr-3"
            style="font-size: 15px;"
            data-toggle="tooltip"
            title="Login"
            >Login</a
          >
          <a
            v-if="isLoggedIn"
            class="nav-link pr-3"
            style="font-size: 15px; cursor: pointer;"
            data-toggle="tooltip"
            title="Logout"
            @click.prevent="onLogout"
            >Logout</a
          >
        </ul>
      </div>
    </nav>
  </div>
</template>
<script>
import Cookies from 'js-cookie'
import * as types from '@/store/types_tree'
import { mapActions } from 'vuex'
import { mapGetters } from 'vuex'

export default {
  name: 'TopNavBar',
  data() {
    return {
      treeFilters: null,
      searchText: null,
      isLoggedIn: true,
      loginDomain: process.env.VUE_APP_LOGIN_DOMAIN,
      profileDomain: process.env.VUE_APP_PROFILE_DOMAIN,
    }
  },
  created() {
    this.treeFilters = this.stateTreeFilters
  },
  mounted() {
    const credentialId = Cookies.get('credentialId')
    if (credentialId) {
      this.isLoggedIn = true
    } else {
      this.isLoggedIn = false
    }
  },
  computed: {
    ...mapGetters({
      stateTreeFilters: types.TREE_GET_FILTERS,
    }),
  },
  methods: {
    ...mapActions({
      setSearchText: types.TREE_ACTION_SET_SEARCH,
      resetFilter: types.TREE_ACTION_RESET_FILTER,
      stateAction_doSearch: types.TREE_ACTION_DO_SEARCH,
    }),
    onSearch() {
      this.resetFilter()
      this.setSearchText(this.searchText)
      this.stateAction_doSearch()
      this.$router.push('/tree')
      this.searchText = null
    },
    onReset() {
      this.searchText = null
    },
    onLogout() {
      Cookies.set('credentialId', null)
      this.isLoggedIn = false
    },
  },
}
</script>
<style scoped>
.my-logo {
  position: absolute;
  padding: 10px;
}
.my-logo2 {
  position: absolute;
  margin-left: 100px;
  padding: 10px;
}
.nav-input-width {
  width: 305px !important;
}
.announce {
  color: #f40400;
  background-color: whitesmoke;
  font-size: 16px;
  font-weight: 600;
}
.announce-link {
  color: #f40400 !important;
  text-decoration: underline;
}
.announceUl {
  list-style-type: none;
  padding-left: 7rem;
  margin-bottom: 0.5rem;
}
</style>
