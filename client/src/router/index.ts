import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export const constantRoutes: RouteRecordRaw[] = []

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes,
})

export default router
