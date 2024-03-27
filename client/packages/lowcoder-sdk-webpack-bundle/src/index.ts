// @ts-nocheck
import "../../lowcoder/src/index.less";
import * as sdk from "../../lowcoder";
export * from "../../lowcoder";

window.$lowcoder_sdk = sdk;

/* Manually adding dependecies to sdk bundle */
/* TODO: Find a webpack plugin to add dependecies on runtime like in vite build */
import * as $axios from 'axios';
import * as $redux from 'redux';
import * as $react_router from 'react-router';
import * as $react_router_dom from 'react-router-dom';
import * as $react_redux from 'react-redux';
import * as $react from 'react';
import * as $react_dom from 'react-dom';
import * as $lodash from 'lodash';
import * as $history from 'history';
import * as $antd from 'antd';
import * as $$dnd_kit_core from '@dnd-kit/core';
import * as $$dnd_kit_modifiers from '@dnd-kit/modifiers';
import * as $$dnd_kit_sortable from '@dnd-kit/sortable';
import * as $$dnd_kit_utilities from '@dnd-kit/utilities';
import $moment from 'moment';
import $dayjs from 'dayjs';
import * as $styled_components_named_exports from 'styled-components';
import $styled_components from 'styled-components';
window.$axios = $axios;
window.$redux = $redux;
window.$react_router = $react_router;
window.$react_router_dom = $react_router_dom;
window.$react_redux = $react_redux;
window.$react = $react;
window.$react_dom = $react_dom;
window.$lodash = $lodash;
window.$history = $history;
window.$antd = $antd;
window.$$dnd_kit_core = $$dnd_kit_core;
window.$$dnd_kit_modifiers = $$dnd_kit_modifiers;
window.$$dnd_kit_sortable = $$dnd_kit_sortable;
window.$$dnd_kit_utilities = $$dnd_kit_utilities;
window.$moment = $moment;
window.$dayjs = $dayjs;
Object.assign($styled_components, $styled_components_named_exports);
window.$styled_components = $styled_components;
