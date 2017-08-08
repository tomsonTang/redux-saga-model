'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SEP = '/';

/**
 * 
 * 
 * @param {string} fieldName 
 * @param {object} fieldValue 
 */
function register(fieldName, fieldValue) {
  if (!this[fieldName]) {
    this[fieldName] = fieldValue;
  } else {
    this[fieldName] = _extends({}, this[fieldName], fieldValue);
  }

  return this;
}

var ModelInteface = function () {
  function ModelInteface() {
    _classCallCheck(this, ModelInteface);
  }

  _createClass(ModelInteface, [{
    key: 'config',
    value: function config(opts) {
      for (var key in opts) {
        if (opts.hasOwnProperty(key)) {
          methodName = 'set' + (key[0].toUpperCase() + key.slice(1));
          this[methodName](opts[key]);
        }
      }
    }
  }, {
    key: 'setNamespaces',
    value: function setNamespaces(namespace) {
      if (!this.namespaces) {
        this.namespaces = namespace;
      } else {
        this.namespaces += '' + SEP + namespace;
      }
      return this;
    }
  }, {
    key: 'setStates',
    value: function setStates(states) {
      return register.call(this, 'setStates', states);
    }
  }, {
    key: 'setSagas',
    value: function setSagas(sagas) {
      return register.call(this, 'setSagas', sagas);
    }
  }, {
    key: 'setReducers',
    value: function setReducers(reducers) {
      return register.call(this, 'setReducers', reducers);
    }
  }, {
    key: 'setSubscriptions',
    value: function setSubscriptions(subscriptions) {
      return register.call(this, 'setSubscriptions', subscriptions);
    }
  }]);

  return ModelInteface;
}();

exports.default = ModelInteface;
;