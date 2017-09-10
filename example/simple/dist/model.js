'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.namespace = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _reduxSaga = require('redux-saga');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var namespace = exports.namespace = 'i\'m a namespace';

exports.default = {
  namespace: namespace,
  state: {
    num: 0
  },
  reducers: {
    add: function add(state, _ref) {
      var payload = _ref.payload;

      return { num: state.num + payload };
    }
  },
  sagas: {
    addAsync: _regenerator2.default.mark(function addAsync(action, effects) {
      return _regenerator2.default.wrap(function addAsync$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              console.log('get action', action);
              _context.next = 3;
              return (0, _reduxSaga.delay)(1000);

            case 3:
              _context.next = 5;
              return effects.put({
                type: 'add',
                payload: action.payload
              });

            case 5:
            case 'end':
              return _context.stop();
          }
        }
      }, addAsync, this);
    })
  }
};