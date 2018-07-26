import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/Login'
import Home from '@/components/Home'
import AddContact from '@/components/AddContact'
import Conversation from '@/components/Conversation'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login
    },
    {
      path: '/home',
      name: 'Home',
      component: Home
    },
    {
      path: '/contacts/add',
      name: 'AddContact',
      component: AddContact
    },
    {
      path: '/conversation/:session',
      name: 'Conversation',
      component: Conversation
    }
  ]
})
