import Vue from 'vue'
import VueCodemirror from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import { PluginObject } from 'vue/types/umd'

Vue.use(VueCodemirror as PluginObject<unknown>)
