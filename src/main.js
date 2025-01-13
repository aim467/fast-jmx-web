import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "@/assets/css/reset.scss";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import * as echarts from "echarts";

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.config.globalProperties.$echarts = echarts;

app.config.globalProperties.$messageBox = ElementPlus.ElMessageBox;
const Notification = ElementPlus.ElNotification;
app.config.globalProperties.$notify = (options) => {
  Notification(options);
};
app.config.globalProperties.$message = ElementPlus.ElMessage;

app.use(router);
app.use(store);
app.use(ElementPlus)
app.mount("#app");
