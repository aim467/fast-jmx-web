import { createRouter, createWebHistory } from "vue-router";
import { ElMessage } from "element-plus";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login.vue"),
    meta: {
      title: "登录",
      requiresAuth: false,
    },
  },
  {
    path: "/",
    name: "index",
    component: () => import("@/views/index.vue"),
    children: [
      { path: "/mbean", component: () => import("@/views/MBean") },
      { path: "/thread", component: () => import("@/views/Thread") },
      { path: "/memory", component: () => import("@/views/Memory") },
      { path: "/basic", component: () => import("@/views/Basic") },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("username");

  document.title = to.meta.title || "监控系统";

  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      next();
    } else {
      ElMessage.warning("请先登录");
      next({
        path: "/login",
        query: { redirect: to.fullPath },
      });
    }
  } else {
    if (to.path === "/login" && isAuthenticated) {
      next("/");
    } else {
      next();
    }
  }
});

router.afterEach((to, from) => {
  // 路由切换后的操作，如关闭加载动画等
});

export default router;
