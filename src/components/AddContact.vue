<template>
  <div class="container home">
    <div class="flex flex-col h-screen w-screen bg-grey-light">
      <div class="w-screen max-w-4xl h-screen shadow-md ml-auto mr-auto bg-grey-lightest">
        <div class="bg-grey-lightest shadow-lg cursor-default w-full h-full overflow-hidden overflow-y-scroll">
          <div class="overflow-x-hidden">
            <div class="bg-grey-darkest text-white w-full pl-4 py-3">
              Escargot Web Client
            </div>
            <div class="p-4">
              <h3 class="mb-4">Add Contact</h3>
              <form class="w-full">
                <div class="md:flex items-center mb-6">
                  <label class="block text-grey md:text-right mb-1 md:mb-0 pr-4" for="email">
                    Contact E-mail
                  </label>
                  <input class="bg-grey-lighter appearance-none border-2 border-grey-lighter rounded w-full py-2 px-4 text-grey-darker" type="email" v-model="email">
                </div>
                <div class="md:flex items-center">
                  <button class="shadow bg-blue text-white font-bold py-2 px-4 w-full rounded" type="button" @click="addContact()">
                    Add
                  </button>
                </div>
              </form>
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
    name: 'AddContact',
    data () {
      return {
        email: '',
        currentlyAdding: false,
      }
    },
    computed: {
      myUser() {
        return store.state.userData;
      },
      myContacts() {
        return store.state.contactData;
      },
    },
    methods: {
      addContact() {
        if(this.currentlyAdding) {
          console.log("Already adding");
          return;
        }

        if(this.email.indexOf(" ") >= 0 || this.email.indexOf("@") < 1) {
          alert("Invalid e-mail");
          return;
        }

        this.currentlyAdding = true;

        // Send the ADD command
        // ADD num AL example@passport.com example@passport.com
        bus.$emit('send', 'ADD', `AL ${this.email} ${this.email} 0`);

      }
    },
    mounted() {
      if(store.state.sessionId === null || store.state.token === null) {
        this.$router.push('/');
        return;
      }

      bus.$on('receivedMessage', message => {
        if(message.trim() !== "" && message.trim() !== "\r\n") {
          let parts = message.split(" ");

          switch(parts[0])
          {
            case "ADD":
              // Receive:
              // ADD msgNum AL versionNumber e-mail nickname(e-mail again)

              store.commit('addContact', {contact: {email: parts[4], nick: parts[4], lists: 2, groups: 0}});

              console.log("Yay! Received ADD. Added contact");

              this.currentlyAdding = false;
              this.email = '';

              this.$router.push('/home');

              break;

            case "219":
              alert("You cannot add an e-mail to both your Allow List and Block List.");
              this.currentlyAdding = false;
              break;

            case "210":
              alert("You can only have up to 150 contacts.");
              this.currentlyAdding = false;
              break;

            case "201":
              alert("Invalid e-mail.");
              this.currentlyAdding = false;
              break;

            case "205":
              alert("E-mail not found. Check the spelling and try again, if you'd like.");
              this.currentlyAdding = false;
              break;

            case "224":
              alert("Invalid group. Technically this should never happen. :(");
              this.currentlyAdding = false;
              break;
          }
        }
      });
    }
  }
</script>

<style scoped>
  .group:hover .group-hover\:text-white {
    color: #fff;
  }
</style>
