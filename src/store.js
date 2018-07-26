import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

import bus from './bus';

export default new Vuex.Store({
  state: {
    connected: false,
    sessionId: null,
    token: null,
    messageId: 1,
    authState: 0,
    userData: {
      email: '',
      nick: '',
      status: 'NLN',
      message: ''
    },
    contactData: {
      numContacts: -1,
      contacts: [],
      numGroups: -1,
      groups: [],
      contactPresence: {}
    },
    switchboardSessions: {},
    messages: {},
    conversations: {}
  },
  mutations: {
    addSwitchboardSession: function(state, {session}) {
      state.switchboardSessions[session.sessionId] = session;
    },
    incrementSwitchboardId: function(state, {sessionId}) {
      console.log("Incrementing Switchboard message ID for " + sessionId);
      state.switchboardSessions[sessionId].messageId++;
    },
    setSwitchboardId: function(state, {sessionId, num}) {
      console.log("Setting Switchboard message ID for " + sessionId);
      state.switchboardSessions[sessionId].messageId = num;
    },
    addMessage: function(state, {sessionId, message}) {
      if(typeof state.messages[sessionId] === 'undefined') {
        state.messages[sessionId] = [];
      }
      console.log("Adding Switchboard message for " + sessionId);
      state.messages[sessionId].push(message);
    },

    setToken: function(state, {token}) {
      state.token = token;
    },
    setSessionId: function(state, {sessionId}) {
      state.sessionId = sessionId;
    },
    setMessageId: function(state, {messageId}) {
      console.log("Old messageId:", state.messageId, "New:", messageId);
      state.messageId = messageId;
    },
    incrementMessageId: function(state) {
      console.log("Incrementing - Old messageId:", state.messageId, "New:", state.messageId + 1);
      state.messageId++;
    },
    setAuthState: function(state, {authState}) {
      console.log("Incrementing authState - Old:", state.authState, "New:", authState);
      state.authState = authState;
    },

    setUserData: function(state, {userData}) {
      state.userData = userData;
    },
    setUserStatus: function(state, {presence}) {
      state.userData.status = presence;
    },
    setNumContacts: function(state, {numContacts}) {
      state.contactData.numContacts = numContacts;
    },
    addContact: function(state, {contact}) {
      state.contactData.contacts.push(contact);
    },
    setNumGroups: function(state, {numGroups}) {
      state.contactData.numGroups = numGroups;
    },
    setGroup: function(state, {num, group}) {
      state.contactData.groups[num] = group;
    },
    setContactPresence: function(state, {email, status, nick}) {
      state.contactData.contactPresence[email] = status;

      let obj = state.contactData.contacts.find((o, i) => {
        if (o.email === email) {
          state.contactData.contacts[i]['nick'] = nick;
          return true; // stop searching
        }
      });
    },
    removeContactPresence: function(state, {email}) {
      delete state.contactData.contactPresence[email];
    },
  },
  actions: {
    msnp_receive: (context, message) => {
    }
  }
});
