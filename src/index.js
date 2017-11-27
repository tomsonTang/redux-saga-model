import flatten from "flatten";
import document from "global/document";
import window from "global/window";
import invariant from "invariant";
import isPlainObject from "is-plain-object";
import isFunction from "lodash.isfunction";
import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import * as sagaEffects from "redux-saga/effects";
import createSagaMiddleware from "redux-saga/lib/internal/middleware";
import {
  takeEveryHelper as takeEvery,
  takeLatestHelper as takeLatest,
  throttleHelper as throttle
} from "redux-saga/lib/internal/sagaHelpers";
import warning from "warning";
import handleActions from "./handleActions";
import Plugin from "./plugin";

const SEP = "/";

const getPrivateName = () => {
  return Math.floor(Math.random() * (1 << 30)).toString(16);
};

/**
 * 构造每个实例的 private 属性
 */
const installPrivateProperties = {};

export class SagaModel {
  constructor(createOpts = {}) {
    const opts = {
      initialState: {},
      initialReducer: {},
      initialMiddleware: [],
      initialModels: [],
      prefix: "",
      ...createOpts
    };

    this.__sagaModelKey = getPrivateName();

    installPrivateProperties[this.__sagaModelKey] = {
      ...opts,
      plugin: new Plugin(),
      models: this.filterModels(opts.initialModels, []),
      store: null
    };
  }

  filterModels(models, baseModels) {
    return models.reduce((prev, m) => {
      try {
        prev.push(this.checkModel(m, baseModels));
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
  checkModel(m, baseModels, hot) {
    const privateProps = installPrivateProperties[this.__sagaModelKey];

    // Clone model to avoid prefixing namespace multiple times
    const model = {
      ...m
    };

    // 允许默认不对 state 进行初始化
    if (!model.state) {
      model.state = {}
    }

    // 添加前缀
    if (privateProps.prefix) {
      if (model.namespace !== '@@saga-model-prefix') {
        model.namespace = `${privateProps.prefix}${SEP}${m.namespace}`;
      }
    }
    const { namespace, reducers, sagas } = model;

    invariant(namespace, "modelManager.model: namespace should be defined");

    // 非热加载时需要判断是否已存在特定的 namespace
    hot ||
      invariant(
        !baseModels.some(model => model.namespace === namespace),
        `modelManager.model: namespace should be unique :${
          model.namespace
        } ,if use webpack please use register with hot parameter`
      );

    invariant(
      !model.subscriptions ||
        isPlainObject(model.subscriptions) ||
        isFunction(model.subscriptions),
      "modelManager.model: subscriptions should be Object or Function"
    );
    invariant(
      !reducers || isPlainObject(reducers) || Array.isArray(reducers),
      "modelManager.model: reducers should be Object or array"
    );

    invariant(
      !Array.isArray(reducers) ||
        (isPlainObject(reducers[0]) && typeof reducers[1] === "function"),
      "modelManager.model: reducers with array should be modelManager.model({ reducers: [object, function" +
        "] })"
    );
    invariant(
      !sagas || isPlainObject(sagas),
      "modelManager.model: sagas should be Object"
    );

    function applyNamespace(type) {
      function getNamespacedReducers(reducers) {
        return Object.keys(reducers).reduce((memo, key) => {
          warning(
            key.indexOf(`${namespace}${SEP}`) !== 0,
            `modelManager.model: ${type.slice(0, -1)} ${
              key
            } should not be prefixed with namespace ${namespace}`
          );
          memo[`${namespace}${SEP}${key}`] = reducers[key];
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
  register(model) {
    const privateProps = installPrivateProperties[this.__sagaModelKey];

    const privatePropsModels = privateProps.models;
    if (!Array.isArray(model)) {
      model = [{ ...model }];
    }

    // push when before getStore
    model.forEach(m => {
      privatePropsModels.push(this.checkModel(m, privatePropsModels, false));
    });

    return this;
  }

  setHistory(history) {
    installPrivateProperties[this.__sagaModelKey].history = history;
    return this;
  }

  prefix() {
    return installPrivateProperties[this.__sagaModelKey].prefix;
  }

  history() {
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
  dump(createReducer, reducers, _unlisteners, namespace) {
    const privateProps = installPrivateProperties[this.__sagaModelKey];

    const store = privateProps.store;

    // Delete reducers
    delete store.asyncReducers[namespace];
    delete reducers[namespace];
    store.replaceReducer(createReducer(store.asyncReducers));
    store.dispatch({
      type: "@@saga-model/UPDATE"
    });

    const m = privateProps.models.filter(model => {
      return model.namespace === namespace;
    });

    // Cancel sagas
    m[0] &&
      Object.keys(m[0].sagas).forEach(key => {
        store.dispatch({
          type: `${key}/@@CANCEL_EFFECTS`
        });
      });

    // unlisten subscrioptions
    if (_unlisteners[namespace]) {
      const { unlisteners, noneFunctionSubscriptions } = _unlisteners[
        namespace
      ];
      warning(
        noneFunctionSubscriptions.length === 0,
        `modelManager.unmodel: subscription should return unlistener function, check these subscriptions ${noneFunctionSubscriptions.join(
          ", "
        )}`
      );
      for (const unlistener of unlisteners) {
        unlistener();
      }
      delete _unlisteners[namespace];
    }

    // delete model
    privateProps.models = privateProps.models.filter(
      model => model.namespace !== namespace
    );

    return this;
  }

  plugin() {
    return installPrivateProperties[this.__sagaModelKey].plugin;
  }

  models() {
    return installPrivateProperties[this.__sagaModelKey].models;
  }

  /**
   * Register an object of hooks on the application.
   *
   * @param hooks
   */
  use(hooks) {
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
  injectModel(createReducer, onError, unlisteners, model, hot) {
    const privateProps = installPrivateProperties[this.__sagaModelKey];
    const privatePropsModels = privateProps.models;
    const store = privateProps.store;

    if (!Array.isArray(model)) {
      model = [model];
    }

    model.forEach(m => {
      if(Object.prototype.toString.apply(m) === "[object Function]") {
        m = new m();
      }
      try {
        m = this.checkModel(m, privatePropsModels, hot);
      } catch (e) {
        console.error(e);
        console.error(`${m.namespace} register failed`);
        // 不打断系统流程 只是中断当前对应的 model 注册
        return;
      }

      // 如果是热替换且已存在对应的 namespace 则重新缓存
      let index = -1;
      if (hot) {
        privatePropsModels.some((model, i) => {
          return model.namespace === m.namespace ? ((index = i), true) : false;
        });
      }
      if (index >= 0) {
        m.sagas &&
          Object.keys(m.sagas).forEach(key => {
            store.dispatch({
              type: `${key}/@@CANCEL_EFFECTS`
            });
          });

        // delete model
        privatePropsModels.splice(index, 1);
      }
      privatePropsModels.push(m);

      // reducers
      store.asyncReducers[m.namespace] = this.getReducer(
        m.reducers,
        m.state,
        m
      );
      store.replaceReducer(createReducer(store.asyncReducers));
      store.dispatch({
        type: "@@saga-model/UPDATE"
      });
      // sagas
      if (m.sagas) {
        store.runSaga(this.getSaga(m.sagas, m, onError));
      }
      // subscriptions
      if (m.subscriptions) {
        unlisteners[m.namespace] = this.runSubscriptions(
          m.subscriptions,
          m,
          onError
        );
      }
    });
  }

  /**
   * 将 model.reducers 进行组合成一个统一对外的 reducer
   * @param {*} reducers model.reducers
   * @param {*} state model.state 维护的数据表
   * @param {*} model model
   */
  getReducer(reducers, state, model) {
    // Support reducer enhancer e.g. reducers: [realReducers, enhancer]
    if (Array.isArray(reducers)) {
      return reducers[1](handleActions(reducers[0], state, model));
    } else {
      return handleActions(reducers || {}, state, model);
    }
  }

  runSubscriptions(subs, model, onError) {
    const privateProps = installPrivateProperties[this.__sagaModelKey];

    invariant(
      privateProps.history,
      "modelManager.history: cant not be null or undefined"
    );

    const unlisteners = [];
    const noneFunctionSubscriptions = [];

    const run = (sub, key) => {
      const unlistener = sub(
        {
          dispatch: this.createDispatch(privateProps.store.dispatch, model),
          history: privateProps.history
        },
        onError
      );
      if (isFunction(unlistener)) {
        unlisteners.push(unlistener);
      } else {
        noneFunctionSubscriptions.push(key);
      }
    };

    if (isFunction(subs)) {
      run(subs, "_only");
    } else {
      for (const key in subs) {
        if (Object.prototype.hasOwnProperty.call(subs, key)) {
          const sub = subs[key];
          invariant(
            typeof sub === "function",
            "modelManager.getStore: subscription should be function"
          );
          run(sub, key);
        }
      }
    }

    return {
      unlisteners,
      noneFunctionSubscriptions
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
  getSaga(sagas, model, onError) {
    const _self = this;
    return function*() {
      for (const key in sagas) {
        if (Object.prototype.hasOwnProperty.call(sagas, key)) {
          // 对每个 saga 进行封装
          const watcher = _self.getWatcher(key, sagas[key], model, onError);
          const task = yield sagaEffects.fork(watcher);
          // 当 model 被卸载时取消任务。
          yield sagaEffects.fork(function*() {
            yield sagaEffects.take(`${key}/@@CANCEL_EFFECTS`);
            yield sagaEffects.cancel(task);
          });
        }
      }
    };
  }

  createDispatch(dispatch, model) {
    return action => {
      const { type } = action;
      invariant(type, "dispatch: action should be a plain Object with type");
      warning(
        type.indexOf(`${model.namespace}${SEP}`) !== 0,
        `dispatch: ${type} should not be prefixed with namespace ${
          model.namespace
        }`
      );
      return dispatch({
        ...action,
        type: this.prefixType(type, model)
      });
    };
  }

  /**
   * 重定向 actionType
   *
   * @param {any} type
   * @param {any} model
   * @returns
   */
  prefixType(type, model) {
    const prefixedType = `${model.namespace}${SEP}${type}`;
    // 当前 namespace 下的功能 type 已包含 namespace
    if (
      (model.reducers && model.reducers[type]) ||
      (model.sagas && model.sagas[type])
    ) {
      return type;
    }
    // 当前 namespace 下的功能 type 未包含 namespace
    if (
      (model.reducers && model.reducers[prefixedType]) ||
      (model.sagas && model.sagas[prefixedType])
    ) {
      return prefixedType;
    }
    // 其他 namespace
    return this.prefix() ? `${this.prefix()}${SEP}${type}` : `${type}`;
  }

  /**
   * 重置 saga 的 put take API
   *
   * @param {any} model
   * @returns
   */
  createEffects(model) {
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
      const { type } = action;
      invariant(type, "dispatch: action should be a plain Object with type");
      warning(
        type.indexOf(`${model.namespace}${SEP}`) !== 0,
        `sagas.put: ${type} should not be prefixed with namespace ${
          model.namespace
        }`
      );
      const newType = namespace
        ? this.prefix()
          ? `${this.prefix()}${SEP}${namespace}${SEP}${type}`
          : `${namespace}${SEP}${type}`
        : this.prefixType(type, model);

      return sagaEffects.put({
        ...action,
        type: newType
      });
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
          return sagaEffects.take(`${namespace}${SEP}${pattern}`);
        }

        if (~pattern.indexOf(SEP)) {
          const fullNamespaces = pattern.split(SEP);
          const actionType = fullNamespaces[fullNamespaces.length - 1];
          const namespaces = fullNamespaces.slice(0, fullNamespaces.length - 1);
          warning(
            namespaces !== model.namespace,
            `sagas.take: ${pattern} should not be prefixed with namespace ${
              model.namespace
            }`
          );
        } else {
          return sagaEffects.take(this.prefixType(pattern, model));
        }
      }
      return sagaEffects.take(pattern);
    }

    return {
      ...sagaEffects,
      put: this::put,
      take: this::take
    };
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
  getWatcher(key, _saga, model, onError) {
    let saga = _saga;
    let type = "takeEvery";
    let ms;
    const privateProps = installPrivateProperties[this.__sagaModelKey];

    // 是否指定了 effect 执行的 type
    if (Array.isArray(_saga)) {
      saga = _saga[0];
      const opts = _saga[1];
      if (opts && opts.type) {
        type = opts.type;
        // 节流
        if (type === "throttle") {
          invariant(
            opts.ms,
            "modelManager.getStore: opts.ms should be defined if type is throttle"
          );
          ms = opts.ms;
        }
      }
      invariant(
        ["watcher", "takeEvery", "takeLatest", "throttle"].indexOf(type) > -1,
        "modelManager.getStore: effect type should be takeEvery, takeLatest, throttle or watcher"
      );
    }

    /**
     * 封装 saga 对抛出的异常进行处理
     *
     * @param {any} action action
     */
    function* sagaWithCatch(action) {
      try {
        // 让 每个 saga 内部的 this 可以执行 对应的 model
        yield saga.call(model, action, this.createEffects(model));
      } catch (e) {
        onError(e);
      }
    }

    // 让 sagaWithCatch 内部的 this 执行外部的 this
    sagaWithCatch = this::sagaWithCatch;

    // saga hooks onEffect : Array
    const onSaga = privateProps.plugin.get("onSaga");
    // 将每个 saga 进行 AOP 封装
    const sagaWithOnSaga = this.applyOnSaga(onSaga, sagaWithCatch, model, key);

    switch (type) {
      case "watcher":
        return sagaWithCatch;
      case "takeLatest":
        return function*() {
          yield takeLatest(key, sagaWithOnSaga);
        };
      case "throttle":
        return function*() {
          yield throttle(ms, key, sagaWithOnSaga);
        };
      default:
        return function*() {
          yield takeEvery(key, sagaWithOnSaga);
        };
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
  applyOnSaga(fns, saga, model, key) {
    for (const fn of fns) {
      saga = fn(saga, sagaEffects, model, key);
    }
    return saga;
  }

  openReduxDevtool() {
    process.env.REDUX_DEVTOOLS_STATUS = "open";
  }

  /**
   *
   * @returns
   */
  store() {
    const privateProps = installPrivateProperties[this.__sagaModelKey];
    const plugin = privateProps.plugin;

    // error wrapper 注册默认的 onError handler 默认直接抛出异常
    const onError = plugin.apply("onError", err => {
      throw new Error(err.stack || err);
    });

    const onErrorWrapper = err => {
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
        UPDATE(state) {
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
    const sagas = [];
    // 全局的 reducers 并入外部传入的 reducer
    const reducers = {
      ...privateProps.initialReducer
    };

    // 遍历所有注册的 model
    for (const m of privateProps.models) {
      // 一个命名空间放一个根级 reducer 每个 model.reducers 都已被打上 namespace 的印记,这里为什么还要区分呢。
      reducers[m.namespace] = this.getReducer(m.reducers, m.state, m);
      // sagas 不是必须的
      if (m.sagas) sagas.push(this.getSaga(m.sagas, m, onErrorWrapper));
    }

    // extra reducers
    const extraReducers = plugin.get("extraReducers");
    invariant(
      Object.keys(extraReducers).every(key => !(key in reducers)),
      "modelManager.getStore: extraReducers is conflict with other reducers"
    );

    // extra enhancers
    const extraEnhancers = plugin.get("extraEnhancers");
    invariant(
      Array.isArray(extraEnhancers),
      "modelManager.getStore: extraEnhancers should be array"
    );

    // create store
    const extraMiddlewares = plugin.get("onAction");
    const reducerEnhancer = plugin.get("onReducer");
    const sagaMiddleware = createSagaMiddleware();
    let middlewares = [
      ...privateProps.initialMiddleware,
      sagaMiddleware,
      ...flatten(extraMiddlewares)
    ];

    let devtools = () => noop => noop;

    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      const openReduxDevTools = [
        // 实例化参数
        privateProps.openReduxDevTools,
        // openReduxDevtool 方法
        process.env.REDUX_DEVTOOLS_STATUS === "open",
        // localStroge
        JSON.parse(localStorage.getItem("reduxDevTools"))
      ].some(status => status);

      if (openReduxDevTools) {
        devtools = window.__REDUX_DEVTOOLS_EXTENSION__;
      }
    }

    const enhancers = [
      applyMiddleware(...middlewares),
      devtools(),
      ...extraEnhancers
    ];
    const store = (privateProps.store = createStore(
      // eslint-disable-line
      createReducer(),
      privateProps.initialState,
      compose(...enhancers)
    ));

    const _dispatch = store.dispatch;

    store.dispatch = function(action) {
      // debugger;
      if (this.prefix()) {
        _dispatch({
          ...action,
          type: `${this.prefix()}${SEP}${action.type}`
        });
      } else {
        _dispatch(action);
      }
    };

    function createReducer(asyncReducers) {
      return reducerEnhancer(
        combineReducers({
          ...reducers,
          ...extraReducers,
          ...asyncReducers
        })
      );
    }

    // store change
    const listeners = plugin.get("onStateChange");
    for (const listener of listeners) {
      store.subscribe(() => {
        listener(store.getState());
      });
    }

    // 重点 start saga
    sagas.forEach(sagaMiddleware.run);

    // run subscriptions
    const unlisteners = {};
    for (const model of privateProps.models) {
      if (model.subscriptions) {
        unlisteners[model.namespace] = this.runSubscriptions(
          model.subscriptions,
          model,
          onErrorWrapper
        );
      }
    }

    // inject model after start
    this.register = this.injectModel.bind(
      this,
      createReducer,
      onErrorWrapper,
      unlisteners
    );
    this.dump = this.dump.bind(this, createReducer, reducers, unlisteners);

    // extend store
    store.runSaga = sagaMiddleware.run;
    store.asyncReducers = {};
    store.register = this::this.register;
    store.dump = this::this.dump;
    store.use = this::this.use;
    store.prefix = this::this.prefix;
    store.dispatch = store::store.dispatch;

    return store;
  }
}

export default new SagaModel();
export const prefixStateKey = "@@saga-model-prefix"
