import { createStore } from "vuex";
import createPersistedState from 'vuex-persistedstate'

// 如果你继续使用 Vuex 4
const store = createStore({
  state: {
    monitorId: null,
    token: null,
  },
  mutations: {
    setMonitorId(state, id) {
      state.monitorId = id;
    },
    setToken(state, token) {
      state.token = token;
    },
  },
  actions: {
    setMonitorIdAction({ commit }, id) {
      commit("setMonitorId", id);
    },
    setTokenAction({ commit }, token) {
      commit("setToken", token);
    },
  },
  plugins: [createPersistedState()]
});

export default store;