
import {createStore, applyMiddleware, compose, combineReducers} from 'redux';
import createSagaMiddleware from 'redux-saga/lib/internal/middleware';
import * as sagaEffects from 'redux-saga/effects';
import isPlainObject from 'is-plain-object';
import invariant from 'invariant';
import warning from 'warning';
import flatten from 'flatten';
import window from 'global/window';
import document from 'global/document';
import {takeEveryHelper as takeEvery, takeLatestHelper as takeLatest, throttleHelper as throttle} from 'redux-saga/lib/internal/sagaHelpers';
import isFunction from 'lodash.isfunction';
import handleActions from './handleActions';
import Plugin from './plugin';

const SEP = '/';

export function sagaModelManagerFactory(createOpts) {
  const {
    initialState = {},
    initialReducer = {},
    initialMiddleware = [],
    initialModles = []
  } = createOpts || {};

  const plugin = new Plugin();

  const initialCheckModels = initialModles.filter((m) => {
    let ret;
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
  })

  const sagaModelManager = {
    // properties
    _models: initialCheckModels,
    _store: null,
    _plugin: plugin,
    // methods
    use,
    model,
    getStore,
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
    this
      ._models
      .push(checkModel(model, mobile));
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
    this
      ._models
      .push(m);
    const store = this._store;

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
    const store = this._store;

    // Delete reducers
    delete store.asyncReducers[namespace];
    delete reducers[namespace];
    store.replaceReducer(createReducer(store.asyncReducers));
    store.dispatch({type: '@@saga-model/UPDATE'});

    // Cancel effects
    store.dispatch({type: `${namespace}/@@CANCEL_EFFECTS`});

    // unlisten subscrioptions
    if (_unlisteners[namespace]) {
      const {unlisteners, noneFunctionSubscriptions} = _unlisteners[namespace];
      warning(noneFunctionSubscriptions.length === 0, `app.unmodel: subscription should return unlistener function, check these subscriptions ${noneFunctionSubscriptions.join(', ')}`,);
      for (const unlistener of unlisteners) {
        unlistener();
      }
      delete _unlisteners[namespace];
    }

    // delete model from this._models
    this._models = this
      ._models
      .filter(model => model.namespace !== namespace);

    return this;
  }

  /**
   *
   */
  function getStore() {

    // error wrapper 注册默认的 onError handler 默认直接抛出异常
    const onError = plugin.apply('onError', (err) => {
      throw new Error(err.stack || err);
    });

    const onErrorWrapper = (err) => {
      if (err) {
        if (typeof err === 'string') 
          err = new Error(err);
        
        // 若发生异常将控制权交给注册了 onError 的 handler
        onError(err, app._store.dispatch);
      }
    };

    // internal model for destroy
    model.call(this, {
      namespace: '@@saga-model',
      state: 0,
      reducers: {
        UPDATE(state) {
          return state + 1;
        }
      }
    });

    // get reducers and sagas from model 全局的 sagas
    const sagas = [];
    // 全局的 reducers 并入外部传入的 reducer
    const reducers = {
      ...initialReducer
    };
    
    // 遍历所有注册的 modle
    for (const m of this._models) {
      // 一个命名空间放一个根级 reducer 每个 modle.reducers 都已被打上 namespace 的印记,这里为什么还要区分呢。
      reducers[m.namespace] = getReducer(m.reducers, m.state);
      // sagas 不是必须的
      if (m.sagas) 
        sagas.push(getSaga(m.sagas, m, onErrorWrapper));
      }
    
    // extra reducers
    const extraReducers = plugin.get('extraReducers');
    invariant(Object.keys(extraReducers).every(key => !(key in reducers)), 'modelManager.getStore: extraReducers is conflict with other reducers',);

    // extra enhancers
    const extraEnhancers = plugin.get('extraEnhancers');
    invariant(Array.isArray(extraEnhancers), 'modelManager.getStore: extraEnhancers should be array',);

    // create store
    const extraMiddlewares = plugin.get('onAction');
    const reducerEnhancer = plugin.get('onReducer');
    const sagaMiddleware = createSagaMiddleware();
    let middlewares = [
      ...initialMiddleware, sagaMiddleware, ...flatten(extraMiddlewares)
    ];

    let devtools = () => noop => noop;
    if (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION__) {
      devtools = window.__REDUX_DEVTOOLS_EXTENSION__;
    }
    
    const enhancers = [
      applyMiddleware(...middlewares),
      devtools(),
      ...extraEnhancers
    ];
    const store = this._store = createStore( // eslint-disable-line
        createReducer(), initialState, compose(...enhancers),);

    function createReducer(asyncReducers) {
      return reducerEnhancer(combineReducers({
        ...reducers,
        ...extraReducers,
        ...asyncReducers
      }));
    }

    // extend store
    store.runSaga = sagaMiddleware.run;
    store.asyncReducers = {};

    // store change
    const listeners = plugin.get('onStateChange');
    for (const listener of listeners) {
      store.subscribe(() => {
        listener(store.getState());
      });
    }

    // 重点 start saga
    sagas.forEach(sagaMiddleware.run);

    // run subscriptions
    const unlisteners = {};
    for (const model of this._models) {
      if (model.subscriptions) {
        unlisteners[model.namespace] = runSubscriptions(model.subscriptions, model, this, onErrorWrapper);
      }
    }

    // inject model after start
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
    const model = {
      ...m
    };
    const {namespace, reducers, sagas} = model;

    invariant(namespace, 'app.model: namespace should be defined',);
    invariant(!app._models.some(model => model.namespace === namespace), 'app.model: namespace should be unique',);
    invariant(!model.subscriptions || isPlainObject(model.subscriptions), 'app.model: subscriptions should be Object',);
    invariant(!reducers || isPlainObject(reducers) || Array.isArray(reducers), 'app.model: reducers should be Object or array',);
    invariant(!Array.isArray(reducers) || (isPlainObject(reducers[0]) && typeof reducers[1] === 'function'), 'app.model: reducers with array should be app.model({ reducers: [object, function' +
        '] })',);
    invariant(!sagas || isPlainObject(sagas), 'app.model: sagas should be Object',);

    function applyNamespace(type) {
      function getNamespacedReducers(reducers) {
        return Object
          .keys(reducers)
          .reduce((memo, key) => {
            warning(key.indexOf(`${namespace}${SEP}`) !== 0, `app.model: ${type.slice(0, -1)} ${key} should not be prefixed with namespace ${namespace}`,);
            memo[`${namespace}${SEP}${key}`] = reducers[key];
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
      return reducers[1](handleActions(reducers[0], state));
    } else {
      return handleActions(reducers || {}, state);
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
    return function * () {
      for (const key in sagas) {
        if (Object.prototype.hasOwnProperty.call(sagas, key)) {
          // 对每个 effect 进行封装
          const watcher = getWatcher(key, sagas[key], model, onError);
          const task = yield sagaEffects.fork(watcher);
          // 当 model 被卸载时取消任务。
          yield sagaEffects.fork(function * () {
            yield sagaEffects.take(`${model.namespace}/@@CANCEL_EFFECTS`);
            yield sagaEffects.cancel(task);
          });
        }
      }
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
  function getWatcher(key, _saga, model, onError) {
    let saga = _saga;
    let type = 'takeEvery';
    let ms;

    // 是否指定了 effect 执行的 type
    if (Array.isArray(_saga)) {
      saga = _saga[0];
      const opts = _saga[1];
      if (opts && opts.type) {
        type = opts.type;
        // 节流
        if (type === 'throttle') {
          invariant(opts.ms, 'modelManager.getStore: opts.ms should be defined if type is throttle',);
          ms = opts.ms;
        }
      }
      invariant(['watcher', 'takeEvery', 'takeLatest', 'throttle'].indexOf(type) > -1, 'modelManager.getStore: effect type should be takeEvery, takeLatest, throttle or watcher',);
    }

    /**
     * 封装 saga 对抛出的异常进行处理
     *
     * @param {any} args action
     */
    function * sagaWithCatch(...args) {
      try {
        yield saga(...args.concat(createEffects(model)));
      } catch (e) {
        onError(e);
      }
    }

    // saga hooks onEffect : Array
    const onSaga = plugin.get('onSaga');
    // 将每个 saga 进行 AOP 封装
    const sagaWithOnEffect = applyOnEffect(onEffect, sagaWithCatch, model, key);

    switch (type) {
      case 'watcher':
        return sagaWithCatch;
      case 'takeLatest':
        return function * () {
          yield takeLatest(key, sagaWithOnEffect);
        };
      case 'throttle':
        return function * () {
          yield throttle(ms, key, sagaWithOnEffect);
        };
      default:
        return function * () {
          yield takeEvery(key, sagaWithOnEffect);
        };
    }
  }

  function runSubscriptions(subs, model, app, onError) {
    const unlisteners = [];
    const noneFunctionSubscriptions = [];
    for (const key in subs) {
      if (Object.prototype.hasOwnProperty.call(subs, key)) {
        const sub = subs[key];
        invariant(typeof sub === 'function', 'modelManager.getStore: subscription should be function');
        const unlistener = sub({
          dispatch: createDispatch(app._store.dispatch, model),
        }, onError);
        if (isFunction(unlistener)) {
          unlisteners.push(unlistener);
        } else {
          noneFunctionSubscriptions.push(key);
        }
      }
    }
    return {unlisteners, noneFunctionSubscriptions};
  }

  /**
     * 重定向 actionType
     *
     * @param {any} type
     * @param {any} model
     * @returns
     */
  function prefixType(type, model) {
    const prefixedType = `${model.namespace}${SEP}${type}`;
    if ((model.reducers && model.reducers[prefixedType]) || (model.sagas && model.sagas[prefixedType])) {
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
      const {type} = action;
      invariant(type, 'dispatch: action should be a plain Object with type');
      warning(type.indexOf(`${model.namespace}${SEP}`) !== 0, `sagas.put: ${type} should not be prefixed with namespace ${model.namespace}`,);
      return sagaEffects.put({
        ...action,
        type: prefixType(type, model)
      });
    }
    function take(pattern) {
      // 判断是否捕获当前 namespaces。
      if(typeof pattern === 'string'){

        // 如果是想 take 当前命名空间的话加上 namespace
        if(~pattern.indexOf(SEP)){
          const fullNamespaces = pattern.split(SEP);
          const actionType = fullNamespaces[fullNamespaces.length-1];
          const namespaces = fullNamespaces.slice(0,fullNamespaces.length-1);
          warning(namespaces !== model.namespace, `sagas.take: ${pattern} should not be prefixed with namespace ${model.namespace}`);
        }
        else{
          return sagaEffects.take(prefixType(type, model))    
        }
      }
      return sagaEffects.take(pattern);
    }


    return {
      ...sagaEffects,
      put
    };
  }

  function createDispatch(dispatch, model) {
    return (action) => {
      const {type} = action;
      invariant(type, 'dispatch: action should be a plain Object with type');
      warning(type.indexOf(`${model.namespace}${SEP}`) !== 0, `dispatch: ${type} should not be prefixed with namespace ${model.namespace}`,);
      return dispatch({
        ...action,
        type: prefixType(type, model)
      });
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
    for (const fn of fns) {
      saga = fn(saga, sagaEffects, model, key);
    }
    return saga;
  }

}

export default sagaModelManagerFactory();