"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prefixStateKey = exports.SagaModel = undefined;

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _flatten = require("flatten");

var _flatten2 = _interopRequireDefault(_flatten);

var _document = require("global/document");

var _document2 = _interopRequireDefault(_document);

var _window = require("global/window");

var _window2 = _interopRequireDefault(_window);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _isPlainObject = require("is-plain-object");

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _lodash = require("lodash.isfunction");

var _lodash2 = _interopRequireDefault(_lodash);

var _redux = require("redux");

var _effects = require("redux-saga/effects");

var sagaEffects = _interopRequireWildcard(_effects);

var _middleware = require("redux-saga/lib/internal/middleware");

var _middleware2 = _interopRequireDefault(_middleware);

var _sagaHelpers = require("redux-saga/lib/internal/sagaHelpers");

var _warning = require("warning");

var _warning2 = _interopRequireDefault(_warning);

var _handleActions = require("./handleActions");

var _handleActions2 = _interopRequireDefault(_handleActions);

var _plugin = require("./plugin");

var _plugin2 = _interopRequireDefault(_plugin);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SEP = "/";

var getPrivateName = function getPrivateName() {
  return Math.floor(Math.random() * (1 << 30)).toString(16);
};

/**
 * 构造每个实例的 private 属性
 */
var installPrivateProperties = {};

var SagaModel = exports.SagaModel = function () {
  function SagaModel() {
    var createOpts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, SagaModel);

    var opts = (0, _extends3.default)({
      initialState: {},
      initialReducer: {},
      initialMiddleware: [],
      initialModels: [],
      prefix: ""
    }, createOpts);

    this.__sagaModelKey = getPrivateName();

    installPrivateProperties[this.__sagaModelKey] = (0, _extends3.default)({}, opts, {
      plugin: new _plugin2.default(),
      models: this.filterModels(opts.initialModels, []),
      store: null
    });
  }

  (0, _createClass3.default)(SagaModel, [{
    key: "filterModels",
    value: function filterModels(models, baseModels) {
      var _this = this;

      return models.reduce(function (prev, m) {
        try {
          prev.push(_this.checkModel(m, baseModels));
        } catch (error) {
          console.error(error);
        }
        return prev;
      }, []);
    }

    /**
     * 判断 model 是否合法，同时为所有的 model.reducers 和 model.sagas 打上 namespace 的印记
     *
     * @param {any} m model
     * @param {any} baseModels 已存在的 models
     * @param hot 是否热加载，如果是热加载则不重新运行对应的 model
     * @returns
     */

  }, {
    key: "checkModel",
    value: function checkModel(m, baseModels, hot) {
      var privateProps = installPrivateProperties[this.__sagaModelKey];

      // Clone model to avoid prefixing namespace multiple times
      var model = (0, _extends3.default)({}, m);

      // 不允许不对 state 进行初始化
      if (model.state === undefined) {
        console.error(model.namespace + " model'state should not be undefined!!");
      }

      // 添加前缀
      if (privateProps.prefix) {
        if (model.namespace !== '@@saga-model-prefix') {
          model.namespace = "" + privateProps.prefix + SEP + m.namespace;
        }
      }
      var namespace = model.namespace,
          reducers = model.reducers,
          sagas = model.sagas;


      (0, _invariant2.default)(namespace, "modelManager.model: namespace should be defined");

      // 非热加载时需要判断是否已存在特定的 namespace
      hot || (0, _invariant2.default)(!baseModels.some(function (model) {
        return model.namespace === namespace;
      }), "modelManager.model: namespace should be unique :" + model.namespace + " ,if use webpack please use register with hot parameter");

      (0, _invariant2.default)(!model.subscriptions || (0, _isPlainObject2.default)(model.subscriptions) || (0, _lodash2.default)(model.subscriptions), "modelManager.model: subscriptions should be Object or Function");
      (0, _invariant2.default)(!reducers || (0, _isPlainObject2.default)(reducers) || Array.isArray(reducers), "modelManager.model: reducers should be Object or array");

      (0, _invariant2.default)(!Array.isArray(reducers) || (0, _isPlainObject2.default)(reducers[0]) && typeof reducers[1] === "function", "modelManager.model: reducers with array should be modelManager.model({ reducers: [object, function" + "] })");
      (0, _invariant2.default)(!sagas || (0, _isPlainObject2.default)(sagas), "modelManager.model: sagas should be Object");

      function applyNamespace(type) {
        function getNamespacedReducers(reducers) {
          return (0, _keys2.default)(reducers).reduce(function (memo, key) {
            (0, _warning2.default)(key.indexOf("" + namespace + SEP) !== 0, "modelManager.model: " + type.slice(0, -1) + " " + key + " should not be prefixed with namespace " + namespace);
            memo["" + namespace + SEP + key] = reducers[key];
            return memo;
          }, {});
        }

        // 给所有的 reducer 和 sagas 加上 namespace 前缀
        if (model[type]) {
          if (type === "reducers" && Array.isArray(model[type])) {
            // reducers hanlers
            model[type][0] = getNamespacedReducers(model[type][0]);
          } else {
            // sagas handlers
            model[type] = getNamespacedReducers(model[type]);
          }
        }
      }

      applyNamespace("reducers");
      applyNamespace("sagas");

      return model;
    }

    /**
     * Register a model.
     *
     * @param model
     */

  }, {
    key: "register",
    value: function register(model) {
      var _this2 = this;

      var privateProps = installPrivateProperties[this.__sagaModelKey];

      var privatePropsModels = privateProps.models;
      if (!Array.isArray(model)) {
        model = [(0, _extends3.default)({}, model)];
      }

      // push when before getStore
      model.forEach(function (m) {
        privatePropsModels.push(_this2.checkModel(m, privatePropsModels, false));
      });

      return this;
    }
  }, {
    key: "setHistory",
    value: function setHistory(history) {
      installPrivateProperties[this.__sagaModelKey].history = history;
      return this;
    }
  }, {
    key: "prefix",
    value: function prefix() {
      return installPrivateProperties[this.__sagaModelKey].prefix;
    }
  }, {
    key: "history",
    value: function history() {
      return installPrivateProperties[this.__sagaModelKey].history;
    }

    /**
     *  dump a model
     *
     * @param {any} createReducer
     * @param {any} reducers
     * @param {any} _unlisteners
     * @param {any} namespace
     * @param {any} m model
     * @returns
     * @memberof sagaModelManager
     */

  }, {
    key: "dump",
    value: function dump(createReducer, reducers, _unlisteners, namespace) {
      var privateProps = installPrivateProperties[this.__sagaModelKey];

      var store = privateProps.store;

      // Delete reducers
      delete store.asyncReducers[namespace];
      delete reducers[namespace];
      store.replaceReducer(createReducer(store.asyncReducers));
      store.dispatch({
        type: "@@saga-model/UPDATE"
      });

      var m = privateProps.models.filter(function (model) {
        return model.namespace === namespace;
      });

      // Cancel sagas
      m[0] && (0, _keys2.default)(m[0].sagas).forEach(function (key) {
        store.dispatch({
          type: key + "/@@CANCEL_EFFECTS"
        });
      });

      // unlisten subscrioptions
      if (_unlisteners[namespace]) {
        var _unlisteners$namespac = _unlisteners[namespace],
            unlisteners = _unlisteners$namespac.unlisteners,
            noneFunctionSubscriptions = _unlisteners$namespac.noneFunctionSubscriptions;

        (0, _warning2.default)(noneFunctionSubscriptions.length === 0, "modelManager.unmodel: subscription should return unlistener function, check these subscriptions " + noneFunctionSubscriptions.join(", "));
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _getIterator3.default)(unlisteners), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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

      // delete model
      privateProps.models = privateProps.models.filter(function (model) {
        return model.namespace !== namespace;
      });

      return this;
    }
  }, {
    key: "plugin",
    value: function plugin() {
      return installPrivateProperties[this.__sagaModelKey].plugin;
    }
  }, {
    key: "models",
    value: function models() {
      return installPrivateProperties[this.__sagaModelKey].models;
    }

    /**
     * Register an object of hooks on the application.
     *
     * @param hooks
     */

  }, {
    key: "use",
    value: function use(hooks) {
      installPrivateProperties[this.__sagaModelKey].plugin.use(hooks);
      return this;
    }

    /**
     *
     *
     * @param {any} createReducer
     * @param {any} onError
     * @param {any} unlisteners
     * @param {any} model
     * @param hot 是否热加载，如果是热加载则不重新运行对应的 model
     */
    // inject model dynamically injectModel.bind(this, createReducer,
    // onErrorWrapper, unlisteners);

  }, {
    key: "injectModel",
    value: function injectModel(createReducer, onError, unlisteners, model, hot) {
      var _this3 = this;

      var privateProps = installPrivateProperties[this.__sagaModelKey];
      var privatePropsModels = privateProps.models;
      var store = privateProps.store;

      if (!Array.isArray(model)) {
        model = [model];
      }

      model.forEach(function (m) {
        if (Object.prototype.toString.apply(m) === "[object Function]") {
          m = new m();
        }
        try {
          m = _this3.checkModel(m, privatePropsModels, hot);
        } catch (e) {
          console.error(e);
          console.error(m.namespace + " register failed");
          // 不打断系统流程 只是中断当前对应的 model 注册
          return;
        }

        // 如果是热替换且已存在对应的 namespace 则重新缓存
        var index = -1;
        if (hot) {
          privatePropsModels.some(function (model, i) {
            return model.namespace === m.namespace ? (index = i, true) : false;
          });
        }
        if (index >= 0) {
          m.sagas && (0, _keys2.default)(m.sagas).forEach(function (key) {
            store.dispatch({
              type: key + "/@@CANCEL_EFFECTS"
            });
          });

          // delete model
          privatePropsModels.splice(index, 1);
        }
        privatePropsModels.push(m);

        // reducers
        store.asyncReducers[m.namespace] = _this3.getReducer(m.reducers, m.state, m);
        store.replaceReducer(createReducer(store.asyncReducers));
        store.dispatch({
          type: "@@saga-model/UPDATE"
        });
        // sagas
        if (m.sagas) {
          store.runSaga(_this3.getSaga(m.sagas, m, onError));
        }
        // subscriptions
        if (m.subscriptions) {
          unlisteners[m.namespace] = _this3.runSubscriptions(m.subscriptions, m, onError);
        }
      });
    }

    /**
     * 将 model.reducers 进行组合成一个统一对外的 reducer
     * @param {*} reducers model.reducers
     * @param {*} state model.state 维护的数据表
     * @param {*} model model
     */

  }, {
    key: "getReducer",
    value: function getReducer(reducers, state, model) {
      // Support reducer enhancer e.g. reducers: [realReducers, enhancer]
      if (Array.isArray(reducers)) {
        return reducers[1]((0, _handleActions2.default)(reducers[0], state, model));
      } else {
        return (0, _handleActions2.default)(reducers || {}, state, model);
      }
    }
  }, {
    key: "runSubscriptions",
    value: function runSubscriptions(subs, model, onError) {
      var _this4 = this;

      var privateProps = installPrivateProperties[this.__sagaModelKey];

      (0, _invariant2.default)(privateProps.history, "modelManager.history: cant not be null or undefined");

      var unlisteners = [];
      var noneFunctionSubscriptions = [];

      var run = function run(sub, key) {
        var unlistener = sub({
          dispatch: _this4.createDispatch(privateProps.store.dispatch, model),
          history: privateProps.history
        }, onError);
        if ((0, _lodash2.default)(unlistener)) {
          unlisteners.push(unlistener);
        } else {
          noneFunctionSubscriptions.push(key);
        }
      };

      if ((0, _lodash2.default)(subs)) {
        run(subs, "_only");
      } else {
        for (var key in subs) {
          if (Object.prototype.hasOwnProperty.call(subs, key)) {
            var sub = subs[key];
            (0, _invariant2.default)(typeof sub === "function", "modelManager.getStore: subscription should be function");
            run(sub, key);
          }
        }
      }

      return {
        unlisteners: unlisteners,
        noneFunctionSubscriptions: noneFunctionSubscriptions
      };
    }

    /**
     * 返回一个生成器，其内部对每个 saga 进行 fork 处理
     *
     * @param {any} sagas
     * @param {any} model
     * @param {any} onError
     * @returns
     */

  }, {
    key: "getSaga",
    value: function getSaga(sagas, model, onError) {
      var _self = this;
      return _regenerator2.default.mark(function _callee2() {
        var _this5 = this;

        var _loop, key;

        return _regenerator2.default.wrap(function _callee2$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _loop = _regenerator2.default.mark(function _loop(key) {
                  var watcher, task;
                  return _regenerator2.default.wrap(function _loop$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          if (!Object.prototype.hasOwnProperty.call(sagas, key)) {
                            _context2.next = 7;
                            break;
                          }

                          // 对每个 saga 进行封装
                          watcher = _self.getWatcher(key, sagas[key], model, onError);
                          _context2.next = 4;
                          return sagaEffects.fork(watcher);

                        case 4:
                          task = _context2.sent;
                          _context2.next = 7;
                          return sagaEffects.fork(_regenerator2.default.mark(function _callee() {
                            return _regenerator2.default.wrap(function _callee$(_context) {
                              while (1) {
                                switch (_context.prev = _context.next) {
                                  case 0:
                                    _context.next = 2;
                                    return sagaEffects.take(key + "/@@CANCEL_EFFECTS");

                                  case 2:
                                    _context.next = 4;
                                    return sagaEffects.cancel(task);

                                  case 4:
                                  case "end":
                                    return _context.stop();
                                }
                              }
                            }, _callee, this);
                          }));

                        case 7:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _loop, _this5);
                });
                _context3.t0 = _regenerator2.default.keys(sagas);

              case 2:
                if ((_context3.t1 = _context3.t0()).done) {
                  _context3.next = 7;
                  break;
                }

                key = _context3.t1.value;
                return _context3.delegateYield(_loop(key), "t2", 5);

              case 5:
                _context3.next = 2;
                break;

              case 7:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee2, this);
      });
    }
  }, {
    key: "createDispatch",
    value: function createDispatch(dispatch, model) {
      var _this6 = this;

      return function (action) {
        var type = action.type;

        (0, _invariant2.default)(type, "dispatch: action should be a plain Object with type");
        (0, _warning2.default)(type.indexOf("" + model.namespace + SEP) !== 0, "dispatch: " + type + " should not be prefixed with namespace " + model.namespace);
        return dispatch((0, _extends3.default)({}, action, {
          type: _this6.prefixType(type, model)
        }));
      };
    }

    /**
     * 重定向 actionType
     *
     * @param {any} type
     * @param {any} model
     * @returns
     */

  }, {
    key: "prefixType",
    value: function prefixType(type, model) {
      var prefixedType = "" + model.namespace + SEP + type;
      // 当前 namespace 下的功能 type 已包含 namespace
      if (model.reducers && model.reducers[type] || model.sagas && model.sagas[type]) {
        return type;
      }
      // 当前 namespace 下的功能 type 未包含 namespace
      if (model.reducers && model.reducers[prefixedType] || model.sagas && model.sagas[prefixedType]) {
        return prefixedType;
      }
      // 其他 namespace
      return this.prefix() ? "" + this.prefix() + SEP + type : "" + type;
    }

    /**
     * 重置 saga 的 put take API
     *
     * @param {any} model
     * @returns
     */

  }, {
    key: "createEffects",
    value: function createEffects(model) {
      /**
       * 对 saga 的 put 进行封装，
       * 默认分发的 action 会补充当前 namespace（包括 prefix）,且必须是当前 model 存在能够被捕获的 saga 或 reducer
       * 否则需要提供 namespace
       *
       * @param {any} action
       * @param {any} namespace 其他 namespace
       * @returns
       */
      function put(action, namespace) {
        var type = action.type;

        (0, _invariant2.default)(type, "dispatch: action should be a plain Object with type");
        (0, _warning2.default)(type.indexOf("" + model.namespace + SEP) !== 0, "sagas.put: " + type + " should not be prefixed with namespace " + model.namespace);
        var newType = namespace ? this.prefix() ? "" + this.prefix() + SEP + namespace + SEP + type : "" + namespace + SEP + type : this.prefixType(type, model);

        return sagaEffects.put((0, _extends3.default)({}, action, {
          type: newType
        }));
      }

      /**
       * 对 saga 的 take 进行封装，默认捕获的 action 会补充当前 namespace,且必须是当前 model 存在能够被捕获的 saga 或 reducer
       * 否则需要提供 namespace
       *
       * @param {any} pattern
       * @param {any} namespace 其他 namespace
       * @returns
       */
      function take(pattern, namespace) {
        // 判断是否捕获当前 namespaces。
        if (typeof pattern === "string") {
          // 如果是想 take 当前命名空间的话加上 namespace

          if (namespace) {
            return sagaEffects.take("" + namespace + SEP + pattern);
          }

          if (~pattern.indexOf(SEP)) {
            var fullNamespaces = pattern.split(SEP);
            var actionType = fullNamespaces[fullNamespaces.length - 1];
            var namespaces = fullNamespaces.slice(0, fullNamespaces.length - 1);
            (0, _warning2.default)(namespaces !== model.namespace, "sagas.take: " + pattern + " should not be prefixed with namespace " + model.namespace);
          } else {
            return sagaEffects.take(this.prefixType(pattern, model));
          }
        }
        return sagaEffects.take(pattern);
      }

      return (0, _extends3.default)({}, sagaEffects, {
        put: put.bind(this),
        take: take.bind(this)
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

  }, {
    key: "getWatcher",
    value: function getWatcher(key, _saga, model, onError) {
      var _marked = [sagaWithCatch].map(_regenerator2.default.mark);

      var saga = _saga;
      var type = "takeEvery";
      var ms = void 0;
      var privateProps = installPrivateProperties[this.__sagaModelKey];

      // 是否指定了 effect 执行的 type
      if (Array.isArray(_saga)) {
        saga = _saga[0];
        var opts = _saga[1];
        if (opts && opts.type) {
          type = opts.type;
          // 节流
          if (type === "throttle") {
            (0, _invariant2.default)(opts.ms, "modelManager.getStore: opts.ms should be defined if type is throttle");
            ms = opts.ms;
          }
        }
        (0, _invariant2.default)(["watcher", "takeEvery", "takeLatest", "throttle"].indexOf(type) > -1, "modelManager.getStore: effect type should be takeEvery, takeLatest, throttle or watcher");
      }

      /**
       * 封装 saga 对抛出的异常进行处理
       *
       * @param {any} action action
       */
      function sagaWithCatch(action) {
        return _regenerator2.default.wrap(function sagaWithCatch$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;
                _context4.next = 3;
                return saga.call(model, action, this.createEffects(model));

              case 3:
                _context4.next = 8;
                break;

              case 5:
                _context4.prev = 5;
                _context4.t0 = _context4["catch"](0);

                onError(_context4.t0);

              case 8:
              case "end":
                return _context4.stop();
            }
          }
        }, _marked[0], this, [[0, 5]]);
      }

      // 让 sagaWithCatch 内部的 this 执行外部的 this
      sagaWithCatch = sagaWithCatch.bind(this);

      // saga hooks onEffect : Array
      var onSaga = privateProps.plugin.get("onSaga");
      // 将每个 saga 进行 AOP 封装
      var sagaWithOnSaga = this.applyOnSaga(onSaga, sagaWithCatch, model, key);

      switch (type) {
        case "watcher":
          return sagaWithCatch;
        case "takeLatest":
          return _regenerator2.default.mark(function _callee3() {
            return _regenerator2.default.wrap(function _callee3$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    _context5.next = 2;
                    return (0, _sagaHelpers.takeLatestHelper)(key, sagaWithOnSaga);

                  case 2:
                  case "end":
                    return _context5.stop();
                }
              }
            }, _callee3, this);
          });
        case "throttle":
          return _regenerator2.default.mark(function _callee4() {
            return _regenerator2.default.wrap(function _callee4$(_context6) {
              while (1) {
                switch (_context6.prev = _context6.next) {
                  case 0:
                    _context6.next = 2;
                    return (0, _sagaHelpers.throttleHelper)(ms, key, sagaWithOnSaga);

                  case 2:
                  case "end":
                    return _context6.stop();
                }
              }
            }, _callee4, this);
          });
        default:
          return _regenerator2.default.mark(function _callee5() {
            return _regenerator2.default.wrap(function _callee5$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    _context7.next = 2;
                    return (0, _sagaHelpers.takeEveryHelper)(key, sagaWithOnSaga);

                  case 2:
                  case "end":
                    return _context7.stop();
                }
              }
            }, _callee5, this);
          });
      }
    }

    /**
     * 对每一个 saga 进行链式封装
     *
     * @param {any} fns onSaga hooks
     * @param {any} saga sagaWithCatch
     * @param {any} model
     * @param {any} key sagaName/actionType
     * @returns
     */

  }, {
    key: "applyOnSaga",
    value: function applyOnSaga(fns, saga, model, key) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(fns), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var fn = _step2.value;

          saga = fn(saga, sagaEffects, model, key);
        }
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

      return saga;
    }
  }, {
    key: "openReduxDevtool",
    value: function openReduxDevtool() {
      process.env.REDUX_DEVTOOLS_STATUS = "open";
    }

    /**
     *
     * @returns
     */

  }, {
    key: "store",
    value: function store() {
      var privateProps = installPrivateProperties[this.__sagaModelKey];
      var plugin = privateProps.plugin;

      // error wrapper 注册默认的 onError handler 默认直接抛出异常
      var onError = plugin.apply("onError", function (err) {
        throw new Error(err.stack || err);
      });

      var onErrorWrapper = function onErrorWrapper(err) {
        if (err) {
          if (typeof err === "string") err = new Error(err);

          // 若发生异常将控制权交给注册了 onError 的 handler
          onError(err, privateProps.store.dispatch);
        }
      };

      // internal model for destroy
      this.register({
        namespace: "@@saga-model",
        state: 0,
        reducers: {
          UPDATE: function UPDATE(state) {
            return state + 1;
          }
        }
      });
      // 将当前 prefix 放在 state 中方便使用者直接获取
      this.register({
        namespace: "@@saga-model-prefix",
        state: this.prefix(),
        reducers: {}
      });

      // get reducers and sagas from model 全局的 sagas
      var sagas = [];
      // 全局的 reducers 并入外部传入的 reducer
      var reducers = (0, _extends3.default)({}, privateProps.initialReducer);

      // 遍历所有注册的 model
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = (0, _getIterator3.default)(privateProps.models), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var m = _step3.value;

          // 一个命名空间放一个根级 reducer 每个 model.reducers 都已被打上 namespace 的印记,这里为什么还要区分呢。
          reducers[m.namespace] = this.getReducer(m.reducers, m.state, m);
          // sagas 不是必须的
          if (m.sagas) sagas.push(this.getSaga(m.sagas, m, onErrorWrapper));
        }

        // extra reducers
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

      var extraReducers = plugin.get("extraReducers");
      (0, _invariant2.default)((0, _keys2.default)(extraReducers).every(function (key) {
        return !(key in reducers);
      }), "modelManager.getStore: extraReducers is conflict with other reducers");

      // extra enhancers
      var extraEnhancers = plugin.get("extraEnhancers");
      (0, _invariant2.default)(Array.isArray(extraEnhancers), "modelManager.getStore: extraEnhancers should be array");

      // create store
      var extraMiddlewares = plugin.get("onAction");
      var reducerEnhancer = plugin.get("onReducer");
      var sagaMiddleware = (0, _middleware2.default)();
      var middlewares = [].concat((0, _toConsumableArray3.default)(privateProps.initialMiddleware), [sagaMiddleware], (0, _toConsumableArray3.default)((0, _flatten2.default)(extraMiddlewares)));

      var devtools = function devtools() {
        return function (noop) {
          return noop;
        };
      };

      if (_window2.default.__REDUX_DEVTOOLS_EXTENSION__) {
        var openReduxDevTools = [
        // 实例化参数
        privateProps.openReduxDevTools,
        // openReduxDevtool 方法
        process.env.REDUX_DEVTOOLS_STATUS === "open",
        // localStroge
        JSON.parse(localStorage.getItem("reduxDevTools"))].some(function (status) {
          return status;
        });

        if (openReduxDevTools) {
          devtools = _window2.default.__REDUX_DEVTOOLS_EXTENSION__;
        }
      }

      var enhancers = [_redux.applyMiddleware.apply(undefined, (0, _toConsumableArray3.default)(middlewares)), devtools()].concat((0, _toConsumableArray3.default)(extraEnhancers));
      var store = privateProps.store = (0, _redux.createStore)(
      // eslint-disable-line
      createReducer(), privateProps.initialState, _redux.compose.apply(undefined, (0, _toConsumableArray3.default)(enhancers)));

      var _dispatch = store.dispatch;

      store.dispatch = function (action) {
        // debugger;
        if (this.prefix()) {
          _dispatch((0, _extends3.default)({}, action, {
            type: "" + this.prefix() + SEP + action.type
          }));
        } else {
          _dispatch(action);
        }
      };

      function createReducer(asyncReducers) {
        return reducerEnhancer((0, _redux.combineReducers)((0, _extends3.default)({}, reducers, extraReducers, asyncReducers)));
      }

      // store change
      var listeners = plugin.get("onStateChange");
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        var _loop2 = function _loop2() {
          var listener = _step4.value;

          store.subscribe(function () {
            listener(store.getState());
          });
        };

        for (var _iterator4 = (0, _getIterator3.default)(listeners), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          _loop2();
        }

        // 重点 start saga
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

      sagas.forEach(sagaMiddleware.run);

      // run subscriptions
      var unlisteners = {};
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = (0, _getIterator3.default)(privateProps.models), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var model = _step5.value;

          if (model.subscriptions) {
            unlisteners[model.namespace] = this.runSubscriptions(model.subscriptions, model, onErrorWrapper);
          }
        }

        // inject model after start
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

      this.register = this.injectModel.bind(this, createReducer, onErrorWrapper, unlisteners);
      this.dump = this.dump.bind(this, createReducer, reducers, unlisteners);

      // extend store
      store.runSaga = sagaMiddleware.run;
      store.asyncReducers = {};
      store.register = this.register.bind(this);
      store.dump = this.dump.bind(this);
      store.use = this.use.bind(this);
      store.prefix = this.prefix.bind(this);
      store.dispatch = store.dispatch.bind(store);

      return store;
    }
  }]);
  return SagaModel;
}();

exports.default = new SagaModel();
var prefixStateKey = exports.prefixStateKey = "@@saga-model-prefix";