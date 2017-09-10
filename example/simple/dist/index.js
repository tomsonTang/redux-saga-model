"use strict";

var _lib = require("../../../lib");

var _lib2 = _interopRequireDefault(_lib);

var _model = require("./model.js");

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var store = _lib2.default.store();
_lib2.default.register(_model2.default);

function dispatch() {
  console.log('111');
  store.dispatch({
    type: _model.namespace + "/addAsync",
    payload: Math.floor(Math.random() * 10)
  });
}

dispatch();

setTimeout(function () {
  console.log('after 2s\n');
  dispatch();
}, 2000);

store.subscribe(function () {
  console.log("====================================");
  console.log("current state", store.getState());
  console.log("====================================");
});