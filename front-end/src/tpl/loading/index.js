// import $ from 'jquery';
/* global $ */
import tpl from './index.tpl';
import './index.scss';

export default () => ({
  name: 'pageLoading',
  render() {
    return tpl();
  },
  show() {
    $('.loading-icon').show();
  },
  hide() {
    $('.loading-icon').hide();
  },
});
