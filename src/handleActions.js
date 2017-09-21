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
function handleAction(actionType, reducer = identify, ctx) {
  return (state, action) => {
    const { type } = action;
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
function reduceReducers(...reducers) {
  /**
   *  @param {any} previous state
   *  @param {any} current action
   */
  return (previous, current) =>
    reducers.reduce(
      /**
       *
       *  @param {any} p state
       *  @param {any} r reducer
       */
      (p, r) => r(p, current),
      previous
    );
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
  const reducers = Object.keys(handlers).map(type =>
    handleAction(type, handlers[type], ctx)
  );
  // 将 reducer 包装成调用链，这里有个问题：
  // 由于这个链式调用并不保障每次 reducers 对 state 进行更新时，链内只有一个 reducer 响应 actionType。
  // 导致的结果是如果有多个 reducer 对同一 actionType 进行响应的话，无法保证这些 reducers 之间的调用顺序。

  // 更新：
  // 这样做的目的是因为，一般对于同一个 actionType 允许有多个 reducer 进行响应，而这些 reducers 每个都负责维护不同的 state 结构，故当多个 reducer 对同一 actionType 进行响应时，reducers 的调用顺序无关紧要。
  const reducer = reduceReducers(...reducers);
  return (state = defaultState, action) => reducer(state, action);
}

export default handleActions;
