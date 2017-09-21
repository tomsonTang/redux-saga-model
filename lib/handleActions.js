"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function identify(value) {
  return value;
}

/**
 * reducer 高阶处理函数，接收 reducer 并返回一个新的 reducer
 * 包装每个 reducer，该高阶 reducer 保证只有当 actionType 对应时才调用入参 reducer
 * 与传统的 reducer 不一样在于 传统的 reducer 需要在内部判断 actionType，
 * 而该高阶 reducer 保证了只有当 actionType 正确对应了才执行入参 reducer，
 * 入参 reducer 可以直接对数据进行维护，免去对 actionType 的判断逻辑。
 *
 * @param {any} actionType
 * @param {any} [reducer=identify]
 * @param {any} ctx 执行 reducer 的上下文
 * @returns
 */
function handleAction(actionType) {
  var reducer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : identify;
  var ctx = arguments[2];

  return function (state, action) {
    var type = action.type;

    if (type && actionType !== type) {
      return state;
    }
    return reducer.call(ctx, state, action);
  };
}

/**
 *
 *
 * @param {any} reducers
 * @returns
 */
function reduceReducers() {
  for (var _len = arguments.length, reducers = Array(_len), _key = 0; _key < _len; _key++) {
    reducers[_key] = arguments[_key];
  }

  /**
   *  @param {any} previous state
   *  @param {any} current action
   */
  return function (previous, current) {
    return reducers.reduce(
    /**
     *
     *  @param {any} p state
     *  @param {any} r reducer
     */
    function (p, r) {
      return r(p, current);
    }, previous);
  };
}

/**
 * 无序链式调用 handlers 中的 reducer ，所有 reducer 维护同一个 state
 *
 * @param {{ actionType:reducer }} handlers
 * @param {any} defaultState
 * @param {any} ctx 执行  handle 的上下文
 * @returns
 */
function handleActions(handlers, defaultState, ctx) {
  var reducers = (0, _keys2.default)(handlers).map(function (type) {
    return handleAction(type, handlers[type], ctx);
  });
  // 将 reducer 包装成调用链，这里有个问题：
  // 由于这个链式调用并不保障每次 reducers 对 state 进行更新时，链内只有一个 reducer 响应 actionType。
  // 导致的结果是如果有多个 reducer 对同一 actionType 进行响应的话，无法保证这些 reducers 之间的调用顺序。

  // 更新：
  // 这样做的目的是因为，一般对于同一个 actionType 允许有多个 reducer 进行响应，而这些 reducers 每个都负责维护不同的 state 结构，故当多个 reducer 对同一 actionType 进行响应时，reducers 的调用顺序无关紧要。
  var reducer = reduceReducers.apply(undefined, (0, _toConsumableArray3.default)(reducers));
  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
    var action = arguments[1];
    return reducer(state, action);
  };
}

exports.default = handleActions;