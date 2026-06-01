import { createRouter, createWebHistory } from 'vue-router';
import PlaygroundPage from '@/pages/PlaygroundPage.vue';
import AboutPage from '@/pages/AboutPage.vue';

const routes = [
    { path: '/', name: 'playground', component: PlaygroundPage },
    { path: '/about', name: 'about', component: AboutPage },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
