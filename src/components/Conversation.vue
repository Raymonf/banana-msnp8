<template>
  <div class="container home">
    <div class="flex flex-col h-screen w-screen bg-grey-light">
      <div class="w-screen max-w-4xl h-screen shadow-md ml-auto mr-auto bg-grey-lightest">
        <div class="bg-grey-lightest shadow-lg cursor-default w-full h-full overflow-hidden overflow-y-scroll">
          <div class="overflow-x-hidden h-full">
            <div class="bg-grey-darkest text-white w-full pl-4 py-3 top-title">
              Escargot Web Client
            </div>
            <div class="p-4 flex flex-col h-possible conversation">
                <div class="title">
                    <router-link to="/home" class="rounded bg-grey-light text-black py-2 px-4 no-underline hover:bg-grey">Back</router-link>
                </div>
                <div class="messages overflow-y-scroll">
                    <div class="message" v-for="message in conversationMessages" :key="message.id">
                        <p>{{ message.nick }} says:</p>
                        <p class="message-text">{{ message.text }}</p>
                    </div>
                </div>
                <div class="input-area">
                    HELLO WORLD
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import bus from '../bus';
  import store from '../store';

  export default {
    name: 'Conversation',
    data () {
      return {
        conversationMessages: []
      }
    },
    computed: {
      myUser() {
        return store.state.userData;
      },
      myContacts() {
        return store.state.contactData;
      },
      conversationId() {
        return this.$route.params.session;
      }
    },
    methods: {
      byteLength(msg) {
        return (new TextEncoder('utf-8').encode(msg)).length;
      },
      getMessages() {
        let messages = store.state.messages[this.conversationId];
        return typeof messages === 'undefined' ? [] : messages;
      },
      sendMessage() {
        let sendData = `MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nX-MMS-IM-Format: FN=Arial; EF=I; CO=0; CS=0; PF=22\r\n\r\n${this.message}`;

        store.commit('addMessage', {sessionId: this.conversationId, message: {
          id: -1,
          email: store.state.userData.email,
          nick: store.state.userData.nick,
          text: this.message,
          date: new Date()
        }});

        this.message = "";

        let message = `N ${this.byteLength(sendData) + 2}\r\n${sendData}`;

        bus.$emit('send', 'MSG', message);
      }
    },
    mounted() {
      if(store.state.sessionId === null || store.state.token === null || typeof this.$route.params.session === 'undefined') {
        //this.$router.push('/');
        //return;
      }

      this.conversationMessages = this.getMessages();

      setInterval(function() {
          this.conversationMessages = this.getMessages();
      }.bind(this), 600);

      console.log(this.conversationId);
    }
  }
</script>

<style scoped>
.message-text {
    white-space: pre-line;
    padding-left: 10px;
    margin-bottom: 4px;
    overflow-wrap: break-word;
}
.conversation {
    flex-flow: column;
}
.title {
    flex: 0 1 40px;
}
.messages {
    flex: 1 1 auto;
}
.input-area {
    flex: 0 1 40px;
}
.top-title {
    vertical-align: middle;
    height: 42px;
}
.h-possible {
    height: calc(100% - 42px);
}
</style>
