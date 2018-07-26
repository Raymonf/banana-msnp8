// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Vuex from 'vuex';
import axios from 'axios';
import bus from './bus';
import store from './store';
import VueI18n from 'vue-i18n';

import locale from './locale'

window.axios = axios;

Vue.config.productionTip = false;
Vue.use(Vuex);
Vue.use(VueI18n)

const i18n = new VueI18n({
	locale: 'en',
	messages: locale,
});

/* eslint-disable no-new */
new Vue({
	el: '#app',
	router,
	template: '<App/>',
	components: { App },
	store,
	bus,
	i18n
});
