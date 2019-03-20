import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import About from './views/About.vue'
import Help from './views/Help.vue'
import Contact from './views/Contact.vue'
import Login from './views/Login.vue'
import TreeBrowse from './views/TreeBrowse.vue'
import TreeDetail from './views/TreeDetail.vue'
import TreeDetail2 from './views/TreeDetail2.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: Home
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
    }
  ]
})
