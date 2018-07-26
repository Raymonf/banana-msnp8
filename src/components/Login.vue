<template>
	<div class="container login">
		<div class="flex flex-col justify-center items-center h-screen w-screen bg-grey">
			<div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
				<div class="mb-4">
					<label class="block text-grey-darker text-sm font-bold mb-2" for="email">
						E-mail
					</label>
					<input class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker" id="email" type="email" placeholder="E-mail address" v-model="email" @change="error.show = false">
				</div>
				<div class="mb-2">
					<label class="block text-grey-darker text-sm font-bold mb-2" for="password">
						Password
					</label>
					<input class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker mb-3" id="password" type="password" placeholder="Password" v-model="password" @change="error.show = false">
					<!-- .border-red -->
					<!-- <p class="text-red text-xs italic">Please choose a password.</p> -->
				</div>
				<div class="mb-2">
					<p class="text-red text-xs" v-if="error.show">{{ error.text }}</p>
					<p class="text-black text-xs" v-if="message.show">{{ message.text }}</p>
				</div>
				<div class="flex flex-col">
					<button class="bg-blue block hover:bg-blue-dark text-white font-bold py-2 px-4 rounded w-full" :class="{['opacity-50 cursor-not-allowed']: !enabled}" type="button" @click.prevent="login">
						Sign In
					</button>
          <div class="flex flex-row mt-4 mb-0">
            <a class="text-sm text-blue hover:text-blue-darker mr-2" href="https://escargot.log1p.xyz#create-account">
              Register
            </a>
            <a class="text-sm text-blue hover:text-blue-darker" href="https://escargot.log1p.xyz/forgot">
              Reset Password
            </a>
          </div>
				</div>
			</div>
      <p class="text-center text-grey-lightest text-xs">
        Escargot Web Client
      </p>
		</div>
	</div>
</template>

<script>
import bus from '../bus';
import store from '../store';

export default {
	name: 'Login',
	data () {
		return {
			enabled: true,
			email: '',
			password: '',
			error: {
				show: false,
				text: ''
			},
			message: {
				show: false,
				text: ''
			}
		}
	},
	methods: {
		async getToken()
		{
			let rst = await axios({
				method: 'POST',
				url: 'https://m1.escargot.log1p.xyz/NotRST.srf',
				headers: {
						"X-User": this.email,
						"X-Password": this.password,
					}
				}
			);

			return typeof rst.headers["x-token"] === 'undefined' ? false : rst.headers["x-token"];
		},
		async login()
		{
			if(!this.enabled) return;

			this.enabled = false;

			this.message.show = true;
			this.message.text = 'Logging in...';

			let token = await this.getToken();

			if(token === false)
			{
				this.error.show = true;
				this.error.text = "Invalid credentials.";
			}
			else
			{
				this.message.text = 'Opening MSN session...';

				// Open session
				store.commit('setToken', {token});

				if(store.state.sessionId === null)
				{
					try
					{
						let open = await axios.post('https://m1.escargot.log1p.xyz/gateway/gateway.dll?Action=open&Server=NS&IP=m1.escargot.log1p.xyz',
							"VER 1 MSNP8 CVR0\r\n");

						console.log(open);

						let sessionId = open.headers['x-msn-messenger'];
						sessionId = sessionId.substring(sessionId.indexOf("=") + 1, sessionId.indexOf(";"));

						console.log("New session ID: ", sessionId);

						store.commit('setSessionId', {sessionId});
					}
					catch(e)
					{
						this.message.text = "Unable to start a HTTP gateway session.";
						this.enabled = true;

						throw e;

						return;
					}
				}

				if(store.state.connected === false)
				{
					// Continue to authenticate
					//	CVR 2 0x0409 winnt 5.1 i386 MSNMSGR 14.0.8089.0726 msmsgs
					//	USR 3 TWN I [email]

					bus.$emit('send', 'CVR', `0x0409 winnt 5.1 i386 MSNMSGR 14.0.8089.0726 msmsgs ${this.email}`);

					bus.$on('receivedMessage', message => {
						if(message.trim() !== "" && message.trim() !== "\r\n") {
							let parts = message.split(" ");

							switch(parts[0])
							{
								case "CVR":
									// Send USR to let server know we're authing

									bus.$emit('send', 'USR', `TWN I ${this.email}`);

									break;
								case "USR":
									// Authenticate with token

									if(store.state.authState == 0) {
										store.commit('setAuthState', {authState: 1});
										bus.$emit('send', 'USR', `TWN S ${store.state.token}`);
									}
									else
									{
										// We should have USR num OK
										if(parts[2] === "OK") {
											// Yay!
											this.message.text = `Getting your contacts...`;
											this.message.show = true;

											let status = "NLN";

											store.commit('setUserData', {userData: {
												email: decodeURIComponent(parts[3]),
												nick: decodeURIComponent(parts[4]),
												status,
												message: ''
											}});

											bus.$emit('send', 'SYN', '0');

											// We have to send the initial presence after syncing contacts
											// CHG 12 NLN 0
											// Now online, capabilities: 0
											bus.$emit('send', 'CHG', `${status} 0`);
										}
										else
										{
											this.message.text = "Login failed.";
											this.enabled = true;
											return;
										}
									}

									break;
								case "SYN":
									// The syncing of contacts begins now!!
									// 0:SYN 1:5 2:[1] 3:[10] 4:[1]
									// SYN num NewVersionNumber #contacts #groups

									store.commit('setNumContacts', {numContacts: parts[3]});
									store.commit('setNumGroups', {numGroups: parts[4]});

									this.$router.push('/home');

									break;
								case "GTC":
									// Privacy, TODO
									console.log("GTC received: " + message);
									break;
								case "BLP":
									// Privacy, TODO
									console.log("BLP received: " + message);
									break;
								case "LSG":
									// LSG - List of groups
									// LSG 0 Other%20Contacts 0
									store.commit('setGroup', {num: parts[1], group: {name: decodeURIComponent(parts[2])}});
									break;
								case "LST":
									// LST - List of contacts
									// LST principal3@passport.com principal3 11 1,3
									// LST principal2@passport.com principal2 4 3
									// LST e-mail nickname BitwiseListNumbers GroupNumbers
									store.commit('addContact', {contact: {email: parts[1], nick: decodeURIComponent(parts[2]), lists: parts[3], groups: parts[4]}});
									break;
								case "CHG":
									// Server confirms
									// CHG 5 NLN 0
									// CHG num Status Capabilities
									console.log(`Server confirmed our status of ${parts[2]}, capability number: ${parts[3]}`)
									break;
								case "ILN":
									// Handle presence of other users
									// ILN 12 AWY example@passport.com Mike 0
									// ILN num Status E-mail Nickname Capabilities

									console.log(`ILN notice - ${parts[3]} (${parts[4]}) is ${parts[2]}`);
									store.commit('setContactPresence', {email: parts[3], status: parts[2], nick: decodeURIComponent(parts[4])});

									break;

								// Opcodes not meant for login
                case "NLN":
                case "ADD":
								case "QNG":
									break;

								default:
									console.log("Unhandled by Login: ", message);
									break;
							}
						}
					});

					setInterval(function () {
						bus.$emit('poll');
					}.bind(this), 1000);

					setInterval(function () {
						bus.$emit('sendraw', 'PNG\r\n');
					}.bind(this), 10000);
				}
			}

			this.message.show = false;

			this.enabled = true;
		}
	}
}
</script>

<style scoped>
</style>
