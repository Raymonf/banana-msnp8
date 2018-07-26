import Vue from 'vue';
import store from './store';
// import utf8 from 'utf8';

export default new Vue({
  data() {
    return {}
  },
  created() {
    this.$on('busHello', this.sayHi);
    this.$on('send', this.sendMsnpRequest);
    this.$on('sendraw', this.sendMsnpRequestRaw);
    this.$on('poll', this.poll);
    this.$on('parsesb', this.parseSwitchboardMessage);
  },
  methods: {
    sayHi()
    {
      console.log('Banana has started');
      console.log(this.substr_utf8_bytes("HELLO WORLD", 0, 5));
    },

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

    handleSwitchboardMessage(sessionId, message) {
      let obj = store.state.switchboardSessions[sessionId];

      let parts = message.split(" ");

      if(parts.length >= 1) {
        if(Number.isInteger(parts[1]) &&  obj.messageId < parts[1]) {
          console.log("Updating Switchboard messageId to ", parts[1] + 1);
          store.commit('setSwitchboardId', {sessionId, num: parts[1] + 1});
        }
      }

      this.$emit("receivedSbMessage_" + sessionId, message);

      console.log("[SB " + sessionId + "] << " + message);
    },

    parseSwitchboardMessage(sessionId, input) {
      if(!Object.keys(store.state.switchboardSessions).includes(sessionId))
      {
        setTimeout(function() {
          this.parseSwitchboardMessage(sessionId, input);
        }.bind(this), 100);
        return;
      }

      let lines = input.split("\r\n");

      if(lines.length < 2) {
        return;
      }

      let words = lines[0].split(" ");

      if(words.includes("MSG") || words.includes("NOT")) {
        let length = parseInt(words[3]);
        let remainingLines = lines.splice(1).join("\r\n");

        if(remainingLines.length > length) {
          let subLen = lines[0].length + 2 + length;
          input = this.substr_utf8_bytes(input, subLen, input.length - subLen);

          this.handleSwitchboardMessage(sessionId, lines[0] + "\r\n" + this.substr_utf8_bytes(remainingLines, 0, length));

          // Continue to parse
          this.parseSwitchboardMessage(sessionId, input);
        }
        else
        {
          // Handle it
          this.handleSwitchboardMessage(sessionId, lines[0] + "\r\n" + remainingLines);
        }
      } else {
        let subLen = lines[0].length + 2;

        input = this.substr_utf8_bytes(input, subLen, input.length - subLen);

        this.handleSwitchboardMessage(sessionId, lines[0]);

        // console.log("Single: " + lines[0]);

        // Continue to parse
        this.parseSwitchboardMessage(sessionId, input);
      }
    },

    async poll()
    {
      this.pollSwitchboards();

      let request = await axios.post('https://m1.escargot.log1p.xyz/gateway/gateway.dll?Action=poll&SessionID=' + encodeURIComponent(store.state.sessionId));

      let parts = request.data.split(/\r?\n/);

      if(parts.length < 2) return;

      parts.forEach(message => {
        if(message.trim() !== "" && message.trim() !== "\r\n") {
          this.$emit("receivedMessage", message);

          let parts = message.split(" ");

          if(parts.length >= 1) {
            if(store.state.messageId < parts[1]) {
              console.log("Updating messageId to ", parts[1] + 1);
              store.commit('setMessageId', parts[1] + 1);
            }
          }

          console.log("<< " + message);
        }
      })
    },
    async pollSwitchboards()
    {
      Object.keys(store.state.switchboardSessions).forEach(async key => {
        let request = await axios.post('https://m1.escargot.log1p.xyz/gateway/gateway.dll?Action=poll&SessionID=' + encodeURIComponent(store.state.switchboardSessions[key].gatewayId));

        this.parseSwitchboardMessage(key, request.data);

        // request.data.split(/\r?\n/).forEach(message => {
        //   this.$emit("receivedSbMessage_" + key, message);

        //   let parts = message.split(" ");

        //   if(parts.length >= 1) {
        //     if(store.state.switchboardSessions[key].messageId < parts[1]) {
        //       console.log("Updating Switchboard messageId to ", parts[1] + 1);
        //       store.commit('setSwitchboardId', {sessionId: key, num: parts[1] + 1});
        //     }
        //   }

        //   console.log("[SB " + key + "] << " + message);
        // })
      });
    },
    async sendMsnpRequest(opcode, payload)
    {
      console.log("Incrementing mId from sendMsnpRequest");

      store.commit('incrementMessageId');

      console.log(`>> ${opcode} ${store.state.messageId} ${payload}`);

      let request = await axios.post('https://m1.escargot.log1p.xyz/gateway/gateway.dll?SessionID=' + encodeURIComponent(store.state.sessionId),
        `${opcode} ${store.state.messageId} ${payload}\r\n`);

      let parts = request.data.split(/\r?\n/);

      if(parts.length < 2) return;

      parts.forEach(reply => {
        if(reply.trim() !== "" && reply.trim() !== "\r\n") {
          this.$emit("receivedMessage", reply);

          console.log("<< " + reply);
        }
      })
    },
    async sendMsnpRequestRaw(payload)
    {
      console.log(`[RAW] >> ${payload}`);

      let request = await axios.post('https://m1.escargot.log1p.xyz/gateway/gateway.dll?SessionID=' + encodeURIComponent(store.state.sessionId),
        payload);

      let parts = request.data.split(/\r?\n/);

      if(parts.length < 2) return;

      parts.forEach(reply => {
        if(reply.trim() !== "" && reply.trim() !== "\r\n") {
          this.$emit("receivedMessage", reply);

          console.log("[RAW] << " + reply);
        }
      })
    },

    async sendSwitchboardRequest(sessionId, opcode, payload)
    {
      console.log("Incrementing mId from sendSwitchboardRequest");

      let obj = store.state.switchboardSessions[sessionId];

      store.commit('incrementSwitchboardId', {sessionId});

      console.log(`>> ${opcode} ${store.state.messageId}` + (payload.length > 0 ? ` ${payload}` : ''));

      let request = await axios.post('https://m1.escargot.log1p.xyz/gateway/gateway.dll?SessionID=' + encodeURIComponent(obj.gatewayId),
        `${opcode} ${store.state.messageId}` + (payload.length > 0 ? ` ${payload}` : '') + `\r\n`);

      let parts = request.data.split(/\r?\n/);

      if(parts.length < 2) return;

      parts.forEach(reply => {
        if(reply.trim() !== "" && reply.trim() !== "\r\n") {
          this.$emit("receivedMessage", reply);

          console.log("<< " + reply);
        }
      })
    },
  }
});
