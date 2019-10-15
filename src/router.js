import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import About from './views/About.vue'
import Help from './views/Help.vue'
import Contact from './views/Contact.vue'
import Login from './views/Login.vue'
import TreeBrowse from './views/TreeBrowse.vue'
import TreeDetail from './views/TreeDetail.vue'
import TreeDetailTemp from './views/TreeDetailTemp.vue'
import TreeGrafting from './views/TreeGrafting'
import {store} from './store'
import {TREE_ACTION_SET_SEARCH} from './store/types_tree'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: TreeGrafting
    },
    {
      path: '/about',
      component: About
    },
    {
        path: '/help',
        component: Help
    },
    {
        path: '/contact',
        component: Contact
    }
    ,
    {
        path: '/login',
        component: Login
    },
    {
        path: '/tree',
        component: TreeBrowse,
        pathToRegexpOptions: {strict: true}
    },
    {
        path: '/tree/',
        redirect: '/tree',
        pathToRegexpOptions: {strict: true}
    },
    {
        path: '/tree/:id',
        component: TreeDetail
    },
    {
      path: '/treeGrafted/',
      name: 'treeGrafted',
      component: TreeDetailTemp,
    },
    {
        path: '/gene-id/:id',
        beforeEnter: (to, from, next) => {
          store.dispatch(TREE_ACTION_SET_SEARCH,to.params.id);
          next('/tree');
        }
    }
  ]
})
