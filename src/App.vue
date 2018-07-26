<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import axios from 'axios';
import bus from './bus';

export default {
  name: 'app',
  mounted: function() {
    // /gateway/gateway.dll?Action=open&Server=NS&IP=m1.escargot.log1p.xyz

    bus.$emit('busHello');

    // Initialize to get the session ID


  }
}
</script>

<style>
</style>
