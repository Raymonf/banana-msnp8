<template>
	<div class="container home">
		<div class="flex flex-col h-screen w-screen bg-grey-light">
			<div class="w-screen max-w-4xl h-screen shadow-md ml-auto mr-auto bg-grey-lightest">
				<div class="bg-grey-lightest shadow-lg cursor-default w-full h-full overflow-hidden overflow-y-scroll">
					<div class="overflow-x-hidden">
						<div class="bg-grey-darkest text-white w-full pl-4 py-3">
							Escargot Web Client
						</div>
						<div class="p-4 border-b shadow-md">
							<p class="font-semibold text-lg mb-1 text-black">
								<span>{{ myUser.nick }}</span>
								<span class="text-grey-darker">({{ myUser.email }})</span>
							</p>
							<p class="text-grey-darkest mb-2">
								<!-- TODO: refactor -->
								<select v-model="currentStatus" class="rounded px-2 py-2 bg-grey-lighter">
									<option value="NLN">{{ $t('presence.NLN') }}</option>
									<option value="BSY">{{ $t('presence.BSY') }}</option>
									<option value="BRB">{{ $t('presence.BRB') }}</option>
									<option value="AWY">{{ $t('presence.AWY') }}</option>
									<option value="PHN">{{ $t('presence.PHN') }}</option>
									<option value="LUN">{{ $t('presence.LUN') }}</option>
									<option value="HDN">{{ $t('presence.HDN') }}</option>
								</select>
							</p>
							<p class="text-grey-darker">
								<span class="font-bold text-grey-darkest">Status:</span>
								<span v-if="myUser.message.length > 0">
									{{ myUser.message }}
								</span>
								<span v-else>
									<i>(Nothing set)</i> - <a href="#" class="text-blue hover:text-blue-dark no-underline">Click here to set (TODO)</a>
								</span>
							</p>
						</div>
					</div>
					
					<div class="h-auto">
						<div class="pt-4 pb-4 bg-grey-lighter pl-4">
							Conversations
						</div>

						<router-link v-for="(message, key) in myMessages" :key="key" :to="'/conversation/' + key" class="no-underline">
							<div class="group hover:bg-blue p-4 shadow no-underline">
									<p class="font-semibold text-lg my-1 text-black group-hover:text-white no-underline">{{ key }}</p>
									<p class="text-grey-darker group-hover:text-white my-1 no-underline">Started by <strong>{{ mySessions[key].email }}</strong></p>
							</div>
						</router-link>
					</div>

					<div class="h-auto">
						<div class="pt-4 pb-4 bg-grey-lighter pl-4">
							Online ({{ onlineContacts.length }})
						</div>

						<div class="group hover:bg-blue p-4 shadow" v-for="contact in onlineContacts" :key="contact.email">
							<p class="font-semibold text-lg my-1 text-black group-hover:text-white">{{ contact.nick }}</p>
							<p class="text-grey-darker group-hover:text-white my-1">{{ contact.email }}</p>
						</div>
					</div>

					<div class="h-auto">
						<div class="pt-4 pb-4 bg-grey-lighter pl-4">
							Offline ({{ offlineContacts.length }})
						</div>

						<div class="group hover:bg-blue p-4 shadow" v-for="contact in offlineContacts" :key="contact.email">
							<p class="font-semibold text-lg my-1 text-black group-hover:text-white">{{ contact.nick }}</p>
							<p class="text-grey-darker group-hover:text-white my-1">{{ contact.email }}</p>
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
	name: 'Home',
	data () {
		return {
		  offlineContacts: [],
			onlineContacts: [],
			currentStatus: "NLN",
		}
	},
	watch: {
		currentStatus() {
			store.commit('setUserStatus', {presence: this.currentStatus});
			// Send to server
			bus.$emit('send', 'CHG', `${this.currentStatus} 0`);
		}
	},
	computed: {
		myUser() {
			return store.state.userData;
		},
		myContacts() {
			return store.state.contactData;
		},
		myMessages() {
			return store.state.messages;
		},
		mySessions() {
			return store.state.switchboardSessions;
		}
	},
	methods: {
		encode_utf8( s )
    {
      return unescape( encodeURIComponent( s ) );
    },

    substr_utf8_bytes(str, startInBytes, lengthInBytes) {
      let resultStr = '';
      let startInChars = 0;
      for (let bytePos = 0; bytePos < startInBytes; startInChars++) {
        let ch = str.charCodeAt(startInChars);
        bytePos += (ch < 128) ? 1 : this.encode_utf8(str[startInChars]).length;
      }

      let end = startInChars + lengthInBytes - 1;

      for (let n = startInChars; startInChars <= end; n++) {
        let ch = str.charCodeAt(n);
        end -= (ch < 128) ? 1 : this.encode_utf8(str[n]).length;

        resultStr += str[n];
      }

      return resultStr;
		},

		hasPresence(contact) {
			return Object.keys(this.myContacts.contactPresence).includes(contact.email);
		},
    getOnlineContacts() {
      return this.myContacts.contacts.filter(contact => {
        return Object.keys(this.myContacts.contactPresence).includes(contact.email);
      });
    },
    getOfflineContacts() {
      return this.myContacts.contacts.filter(contact => {
        return !Object.keys(this.myContacts.contactPresence).includes(contact.email);
      });
    }
	},
	mounted() {
	  const parent = this;

		if(store.state.sessionId === null || store.state.token === null) {
			this.$router.push('/');
			return;
		}

		parent.offlineContacts = parent.getOfflineContacts();
		parent.onlineContacts = parent.getOnlineContacts();

		setInterval(function() {
      parent.offlineContacts = parent.getOfflineContacts();
      parent.onlineContacts = parent.getOnlineContacts();
    }, 1000);

		bus.$on('receivedMessage', async message => {
			if(message.trim() !== "" && message.trim() !== "\r\n") {
				let parts = message.split(" ");

				switch(parts[0])
				{
					case "FLN":
						// User is now ofFLiNe
						// FLN raymonf@outlook.com
						// No opcode

						store.commit('removeContactPresence', {email: decodeURIComponent(parts[1])});

            break;
					case "NLN":
						// User changed their presence! Update in the array...
						// NLN NLN example@passport.com Mike 12

						store.commit('setContactPresence', {email: parts[2], status: parts[1], nick: decodeURIComponent(parts[3])});

						break;

          case "RNG":
            // SWITCHBOARD!!!!!!
            /*
            0 RNG
            1 switchboardSessionId
            2 server
            3 authType (CKI always)
            4 authKey (for auth later)
            5 E-mail of user inviting
            6 Nickname of user inviting (URL encoded)
             */

            let open = await axios.post('https://m1.escargot.log1p.xyz/gateway/gateway.dll?Action=open&Server=SB&IP=' + parts[2],
							`ANS 1 ${store.state.userData.email} ${parts[4]} ${parts[1]}\r\n`);

            let gatewayId = open.headers['x-msn-messenger'];

            gatewayId = gatewayId.substring(gatewayId.indexOf("=") + 1, gatewayId.indexOf(";"));

            console.log("Switchboard gateway session ID: ", gatewayId);

            store.commit('addSwitchboardSession', {session: {
              gatewayId,
              sessionId: parts[1],
              server: parts[2],
              authKey: parts[4],
              email: parts[5],
              nick: parts[6],
              members: []
            }});

						bus.$emit('parsesb', parts[1], open.data);

            bus.$on('receivedSbMessage_' + parts[1], function(message) {
							let msgParts = message.split(" ");

							switch(msgParts[0]) {
                default:
                  console.log("UNHANDLED SWITCHBOARD COMMAND:", msgParts[0]);
                  break;

                case "BYE":
                  // Check if the last person in this SB session has left
                  // Yes:
                  // Remove session ID from switchboardSessions?


                  // No:
                  // remove user from member list in conversations but keep conversation...?
                  break;


                case "IRO":
                  // Add user to members ([])

                  break;

                case "MSG":
                  if(message.indexOf("X-MMS-IM-Format: ") >= 0) {
                    let index = message.indexOf("\r\n\r\n");

                    let messageText = this.substr_utf8_bytes(message, index + 4, message.length - (index + 4));
                    let messageId = "msg" + parts[1] + "-";

                    var ranIds = new Uint32Array(6);
                    window.crypto.getRandomValues(ranIds);

                    for (var i = 0; i < ranIds.length; i++) {
                      messageId += toString(ranIds[i]);
                    }

                    store.commit('addMessage', {
                      sessionId: parts[1],
                      message: {
                        id: messageId,
                        email: msgParts[1],
                        nick: decodeURIComponent(msgParts[2]),
                        text: messageText,
                        date: new Date()
                      }
                    });
                  }
                  break;
              }
						});
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
