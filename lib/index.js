'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.sagaModelManagerFactory = sagaModelManagerFactory;

var _redux = require('redux');

var _middleware = require('redux-saga/lib/internal/middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _effects = require('redux-saga/effects');

var sagaEffects = _interopRequireWildcard(_effects);

var _isPlainObject = require('is-plain-object');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _flatten = require('flatten');

var _flatten2 = _interopRequireDefault(_flatten);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

var _sagaHelpers = require('redux-saga/lib/internal/sagaHelpers');

var _lodash = require('lodash.isfunction');

var _lodash2 = _interopRequireDefault(_lodash);

var _handleActions = require('./handleActions');

var _handleActions2 = _interopRequireDefault(_handleActions);

var _plugin = require('./plugin');

var _plugin2 = _interopRequireDefault(_plugin);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var SEP = '/';

function sagaModelManagerFactory(createOpts) {
  var _ref = createOpts || {},
      _ref$initialState = _ref.initialState,
      initialState = _ref$initialState === undefined ? {} : _ref$initialState,
      _ref$initialReducer = _ref.initialReducer,
      initialReducer = _ref$initialReducer === undefined ? {} : _ref$initialReducer,
      _ref$initialMiddlewar = _ref.initialMiddleware,
      initialMiddleware = _ref$initialMiddlewar === undefined ? [] : _ref$initialMiddlewar,
      _ref$initialModles = _ref.initialModles,
      initialModles = _ref$initialModles === undefined ? [] : _ref$initialModles;

  var plugin = new _plugin2.default();

  var initialCheckModels = initialModles.filter(function (m) {
    var ret = void 0;
    try {
      ret = checkModel(m);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        return console.error(error);
      } else {
        throw error;
      }
    }
    return ret;
  });

  var sagaModelManager = {
    // properties
    _models: initialCheckModels,
    _store: null,
    _plugin: plugin,
    // methods
    use: use,
    model: model,
    getStore: getStore
  };

  return sagaModelManager;

  // ////////////////////////////////// Methods

  /**
     * Register an object of hooks on the application.
     *
     * @param hooks
     */
  function use(hooks) {
    plugin.use(hooks);
    return this;
  }

  /**
   * Register a model.
   *
   * @param model
   */
  function model(model) {
    // push when before getStore
    this._models.push(checkModel(model, mobile));
    return this;
  }

  /**
   *
   *
   * @param {any} createReducer
   * @param {any} onError
   * @param {any} unlisteners
   * @param {any} m
   */
  // inject model dynamically injectModel.bind(this, createReducer,
  // onErrorWrapper, unlisteners);
  function injectModel(createReducer, onError, unlisteners, m) {
    m = checkModel(m);
    this._models.push(m);
    var store = this._store;

    // reducers
    store.asyncReducers[m.namespace] = getReducer(m.reducers, m.state);
    store.replaceReducer(createReducer(store.asyncReducers));
    // sagas
    if (m.sagas) {
      store.runSaga(getSaga(m.sagas, m, onError));
    }
    // subscriptions
    if (m.subscriptions) {
      unlisteners[m.namespace] = runSubscriptions(m.subscriptions, m, this, onError);
    }
  }

  // Unexpected key warn problem: https://github.com/reactjs/redux/issues/1636
  function unmodel(createReducer, reducers, _unlisteners, namespace) {
    var store = this._store;

    // Delete reducers
    delete store.asyncReducers[namespace];
    delete reducers[namespace];
    store.replaceReducer(createReducer(store.asyncReducers));
    store.dispatch({ type: '@@saga-model/UPDATE' });

    // Cancel effects
    store.dispatch({ type: namespace + '/@@CANCEL_EFFECTS' });

    // unlisten subscrioptions
    if (_unlisteners[namespace]) {
      var _unlisteners$namespac = _unlisteners[namespace],
          unlisteners = _unlisteners$namespac.unlisteners,
          noneFunctionSubscriptions = _unlisteners$namespac.noneFunctionSubscriptions;

      (0, _warning2.default)(noneFunctionSubscriptions.length === 0, 'app.unmodel: subscription should return unlistener function, check these subscriptions ' + noneFunctionSubscriptions.join(', '));
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = unlisteners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var unlistener = _step.value;

          unlistener();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      delete _unlisteners[namespace];
    }

    // delete model from this._models
    this._models = this._models.filter(function (model) {
      return model.namespace !== namespace;
    });

    return this;
  }

  /**
   *
   */
  function getStore() {

    // error wrapper 注册默认的 onError handler 默认直接抛出异常
    var onError = plugin.apply('onError', function (err) {
      throw new Error(err.stack || err);
    });

    var onErrorWrapper = function onErrorWrapper(err) {
      if (err) {
        if (typeof err === 'string') err = new Error(err);

        // 若发生异常将控制权交给注册了 onError 的 handler
        onError(err, app._store.dispatch);
      }
    };

    // internal model for destroy
    model.call(this, {
      namespace: '@@saga-model',
      state: 0,
      reducers: {
        UPDATE: function UPDATE(state) {
          return state + 1;
        }
      }
    });

    // get reducers and sagas from model 全局的 sagas
    var sagas = [];
    // 全局的 reducers 并入外部传入的 reducer
    var reducers = _extends({}, initialReducer);

    // 遍历所有注册的 modle
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = this._models[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var m = _step2.value;

        // 一个命名空间放一个根级 reducer 每个 modle.reducers 都已被打上 namespace 的印记,这里为什么还要区分呢。
        reducers[m.namespace] = getReducer(m.reducers, m.state);
        // sagas 不是必须的
        if (m.sagas) sagas.push(getSaga(m.sagas, m, onErrorWrapper));
      }

      // extra reducers
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    var extraReducers = plugin.get('extraReducers');
    (0, _invariant2.default)(Object.keys(extraReducers).every(function (key) {
      return !(key in reducers);
    }), 'modelManager.getStore: extraReducers is conflict with other reducers');

    // extra enhancers
    var extraEnhancers = plugin.get('extraEnhancers');
    (0, _invariant2.default)(Array.isArray(extraEnhancers), 'modelManager.getStore: extraEnhancers should be array');

    // create store
    var extraMiddlewares = plugin.get('onAction');
    var reducerEnhancer = plugin.get('onReducer');
    var sagaMiddleware = (0, _middleware2.default)();
    var middlewares = [].concat(_toConsumableArray(initialMiddleware), [sagaMiddleware], _toConsumableArray((0, _flatten2.default)(extraMiddlewares)));

    var devtools = function devtools() {
      return function (noop) {
        return noop;
      };
    };
    if (process.env.NODE_ENV !== 'production' && _window2.default.__REDUX_DEVTOOLS_EXTENSION__) {
      devtools = _window2.default.__REDUX_DEVTOOLS_EXTENSION__;
    }

    var enhancers = [_redux.applyMiddleware.apply(undefined, _toConsumableArray(middlewares)), devtools()].concat(_toConsumableArray(extraEnhancers));
    var store = this._store = (0, _redux.createStore)( // eslint-disable-line
    createReducer(), initialState, _redux.compose.apply(undefined, _toConsumableArray(enhancers)));

    function createReducer(asyncReducers) {
      return reducerEnhancer((0, _redux.combineReducers)(_extends({}, reducers, extraReducers, asyncReducers)));
    }

    // extend store
    store.runSaga = sagaMiddleware.run;
    store.asyncReducers = {};

    // store change
    var listeners = plugin.get('onStateChange');
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      var _loop = function _loop() {
        var listener = _step3.value;

        store.subscribe(function () {
          listener(store.getState());
        });
      };

      for (var _iterator3 = listeners[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        _loop();
      }

      // 重点 start saga
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    sagas.forEach(sagaMiddleware.run);

    // run subscriptions
    var unlisteners = {};
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = this._models[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var _model = _step4.value;

        if (_model.subscriptions) {
          unlisteners[_model.namespace] = runSubscriptions(_model.subscriptions, _model, this, onErrorWrapper);
        }
      }

      // inject model after start
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    this.model = injectModel.bind(this, createReducer, onErrorWrapper, unlisteners);

    this.unmodel = unmodel.bind(this, createReducer, reducers, unlisteners);

    return store;
  }

  // ////////////////////////////////// Helpers

  /**
     * 判断 modle 是否合法，同时为所有的 modle.reducers 和 modle.sagas 打上 namespace 的印记
     *
     * @param {any} m modle
     * @returns
     */
  function checkModel(m) {
    // Clone model to avoid prefixing namespace multiple times
    var model = _extends({}, m);
    var namespace = model.namespace,
        reducers = model.reducers,
        sagas = model.sagas;


    (0, _invariant2.default)(namespace, 'app.model: namespace should be defined');
    (0, _invariant2.default)(!app._models.some(function (model) {
      return model.namespace === namespace;
    }), 'app.model: namespace should be unique');
    (0, _invariant2.default)(!model.subscriptions || (0, _isPlainObject2.default)(model.subscriptions), 'app.model: subscriptions should be Object');
    (0, _invariant2.default)(!reducers || (0, _isPlainObject2.default)(reducers) || Array.isArray(reducers), 'app.model: reducers should be Object or array');
    (0, _invariant2.default)(!Array.isArray(reducers) || (0, _isPlainObject2.default)(reducers[0]) && typeof reducers[1] === 'function', 'app.model: reducers with array should be app.model({ reducers: [object, function' + '] })');
    (0, _invariant2.default)(!sagas || (0, _isPlainObject2.default)(sagas), 'app.model: sagas should be Object');

    function applyNamespace(type) {
      function getNamespacedReducers(reducers) {
        return Object.keys(reducers).reduce(function (memo, key) {
          (0, _warning2.default)(key.indexOf('' + namespace + SEP) !== 0, 'app.model: ' + type.slice(0, -1) + ' ' + key + ' should not be prefixed with namespace ' + namespace);
          memo['' + namespace + SEP + key] = reducers[key];
          return memo;
        }, {});
      }

      // 给所有的 reducer 和 effect 加上 namespace 前缀
      if (model[type]) {
        if (type === 'reducers' && Array.isArray(model[type])) {
          // reducers hanlers
          model[type][0] = getNamespacedReducers(model[type][0]);
        } else {
          // sagas handlers
          model[type] = getNamespacedReducers(model[type]);
        }
      }
    }

    applyNamespace('reducers');
    applyNamespace('sagas');

    return model;
  }

  /**
     * 将 modle.reducers 进行组合成一个统一对外的 reducer
     * @param {*} reducers modle.reducers
     * @param {*} state modle.state 维护的数据表
     */
  function getReducer(reducers, state) {
    // Support reducer enhancer e.g. reducers: [realReducers, enhancer]
    if (Array.isArray(reducers)) {
      return reducers[1]((0, _handleActions2.default)(reducers[0], state));
    } else {
      return (0, _handleActions2.default)(reducers || {}, state);
    }
  }

  /**
     * 返回一个生成器，其内部对每个 effect 进行 fork 处理
     *
     * @param {any} sagas
     * @param {any} model
     * @param {any} onError
     * @returns
     */
  function getSaga(sagas, model, onError) {
    return regeneratorRuntime.mark(function _callee3() {
      var _this = this;

      var key;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.t0 = regeneratorRuntime.keys(sagas);

            case 1:
              if ((_context3.t1 = _context3.t0()).done) {
                _context3.next = 7;
                break;
              }

              key = _context3.t1.value;

              if (!Object.prototype.hasOwnProperty.call(sagas, key)) {
                _context3.next = 5;
                break;
              }

              return _context3.delegateYield(regeneratorRuntime.mark(function _callee2() {
                var watcher, task;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        // 对每个 effect 进行封装
                        watcher = getWatcher(key, sagas[key], model, onError);
                        _context2.next = 3;
                        return sagaEffects.fork(watcher);

                      case 3:
                        task = _context2.sent;
                        _context2.next = 6;
                        return sagaEffects.fork(regeneratorRuntime.mark(function _callee() {
                          return regeneratorRuntime.wrap(function _callee$(_context) {
                            while (1) {
                              switch (_context.prev = _context.next) {
                                case 0:
                                  _context.next = 2;
                                  return sagaEffects.take(model.namespace + '/@@CANCEL_EFFECTS');

                                case 2:
                                  _context.next = 4;
                                  return sagaEffects.cancel(task);

                                case 4:
                                case 'end':
                                  return _context.stop();
                              }
                            }
                          }, _callee, this);
                        }));

                      case 6:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, _this);
              })(), 't2', 5);

            case 5:
              _context3.next = 1;
              break;

            case 7:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    });
  }

  /**
     * 针对每个 saga 进行处理
     * 最终返回一个生成器
     *
     * @param {any} key saga.key 已被打上 namespace 的 tag
     * @param {any} _saga saga.value
     * @param {any} model
     * @param {any} onError
     * @returns
     */
  function getWatcher(key, _saga, model, onError) {
    var _marked = [sagaWithCatch].map(regeneratorRuntime.mark);

    var saga = _saga;
    var type = 'takeEvery';
    var ms = void 0;

    // 是否指定了 effect 执行的 type
    if (Array.isArray(_saga)) {
      saga = _saga[0];
      var opts = _saga[1];
      if (opts && opts.type) {
        type = opts.type;
        // 节流
        if (type === 'throttle') {
          (0, _invariant2.default)(opts.ms, 'modelManager.getStore: opts.ms should be defined if type is throttle');
          ms = opts.ms;
        }
      }
      (0, _invariant2.default)(['watcher', 'takeEvery', 'takeLatest', 'throttle'].indexOf(type) > -1, 'modelManager.getStore: effect type should be takeEvery, takeLatest, throttle or watcher');
    }

    /**
     * 封装 saga 对抛出的异常进行处理
     *
     * @param {any} args action
     */
    function sagaWithCatch() {
      var _len,
          args,
          _key,
          _args4 = arguments;

      return regeneratorRuntime.wrap(function sagaWithCatch$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;

              for (_len = _args4.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = _args4[_key];
              }

              _context4.next = 4;
              return saga.apply(undefined, _toConsumableArray(args.concat(createEffects(model))));

            case 4:
              _context4.next = 9;
              break;

            case 6:
              _context4.prev = 6;
              _context4.t0 = _context4['catch'](0);

              onError(_context4.t0);

            case 9:
            case 'end':
              return _context4.stop();
          }
        }
      }, _marked[0], this, [[0, 6]]);
    }

    // saga hooks onEffect : Array
    var onSaga = plugin.get('onSaga');
    // 将每个 saga 进行 AOP 封装
    var sagaWithOnEffect = applyOnEffect(onEffect, sagaWithCatch, model, key);

    switch (type) {
      case 'watcher':
        return sagaWithCatch;
      case 'takeLatest':
        return regeneratorRuntime.mark(function _callee4() {
          return regeneratorRuntime.wrap(function _callee4$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return (0, _sagaHelpers.takeLatestHelper)(key, sagaWithOnEffect);

                case 2:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee4, this);
        });
      case 'throttle':
        return regeneratorRuntime.mark(function _callee5() {
          return regeneratorRuntime.wrap(function _callee5$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.next = 2;
                  return (0, _sagaHelpers.throttleHelper)(ms, key, sagaWithOnEffect);

                case 2:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee5, this);
        });
      default:
        return regeneratorRuntime.mark(function _callee6() {
          return regeneratorRuntime.wrap(function _callee6$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return (0, _sagaHelpers.takeEveryHelper)(key, sagaWithOnEffect);

                case 2:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee6, this);
        });
    }
  }

  function runSubscriptions(subs, model, app, onError) {
    var unlisteners = [];
    var noneFunctionSubscriptions = [];
    for (var key in subs) {
      if (Object.prototype.hasOwnProperty.call(subs, key)) {
        var sub = subs[key];
        (0, _invariant2.default)(typeof sub === 'function', 'modelManager.getStore: subscription should be function');
        var unlistener = sub({
          dispatch: createDispatch(app._store.dispatch, model)
        }, onError);
        if ((0, _lodash2.default)(unlistener)) {
          unlisteners.push(unlistener);
        } else {
          noneFunctionSubscriptions.push(key);
        }
      }
    }
    return { unlisteners: unlisteners, noneFunctionSubscriptions: noneFunctionSubscriptions };
  }

  /**
     * 重定向 actionType
     *
     * @param {any} type
     * @param {any} model
     * @returns
     */
  function prefixType(type, model) {
    var prefixedType = '' + model.namespace + SEP + type;
    if (model.reducers && model.reducers[prefixedType] || model.sagas && model.sagas[prefixedType]) {
      return prefixedType;
    }
    return type;
  }

  /**
     * 重置 saga 的 put API
     *
     * @param {any} model
     * @returns
     */
  function createEffects(model) {

    function put(action) {
      var type = action.type;

      (0, _invariant2.default)(type, 'dispatch: action should be a plain Object with type');
      (0, _warning2.default)(type.indexOf('' + model.namespace + SEP) !== 0, 'sagas.put: ' + type + ' should not be prefixed with namespace ' + model.namespace);
      return sagaEffects.put(_extends({}, action, {
        type: prefixType(type, model)
      }));
    }
    function take(pattern) {
      // 判断是否捕获当前 namespaces。
      if (typeof pattern === 'string') {

        // 如果是想 take 当前命名空间的话加上 namespace
        if (~pattern.indexOf(SEP)) {
          var fullNamespaces = pattern.split(SEP);
          var actionType = fullNamespaces[fullNamespaces.length - 1];
          var namespaces = fullNamespaces.slice(0, fullNamespaces.length - 1);
          (0, _warning2.default)(namespaces !== model.namespace, 'sagas.take: ' + pattern + ' should not be prefixed with namespace ' + model.namespace);
        } else {
          return sagaEffects.take(prefixType(type, model));
        }
      }
      return sagaEffects.take(pattern);
    }

    return _extends({}, sagaEffects, {
      put: put
    });
  }

  function createDispatch(dispatch, model) {
    return function (action) {
      var type = action.type;

      (0, _invariant2.default)(type, 'dispatch: action should be a plain Object with type');
      (0, _warning2.default)(type.indexOf('' + model.namespace + SEP) !== 0, 'dispatch: ' + type + ' should not be prefixed with namespace ' + model.namespace);
      return dispatch(_extends({}, action, {
        type: prefixType(type, model)
      }));
    };
  }

  /**
     * 对 每一个 effect 进行链式封装
     *
     * @param {any} fns onEffect hooks
     * @param {any} saga sagaWithCatch
     * @param {any} model
     * @param {any} key sagaName
     * @returns
     */
  function applyOnEffect(fns, saga, model, key) {
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = fns[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var fn = _step5.value;

        saga = fn(saga, sagaEffects, model, key);
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    return saga;
  }
}

exports.default = sagaModelManagerFactory();