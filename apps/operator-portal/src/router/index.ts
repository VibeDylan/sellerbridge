import { createRouter, createWebHistory } from 'vue-router'
import SellersView from '../views/SellersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/sellers' },
    { path: '/sellers', name: 'sellers', component: SellersView },
  ],
})

export default router
