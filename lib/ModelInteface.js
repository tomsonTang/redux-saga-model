'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    this[fieldName] = (0, _extends3.default)({}, this[fieldName], fieldValue);
  }

  return this;
}

var ModelInteface = function () {
  function ModelInteface() {
    (0, _classCallCheck3.default)(this, ModelInteface);
  }

  (0, _createClass3.default)(ModelInteface, [{
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