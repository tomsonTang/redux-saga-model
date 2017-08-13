# redux-saga-model
此项目为从 [`dva`](https://github.com/dvajs/dva) 中抽取出对 model 的处理。

`npm i redux-saga-model`

or 

`yarn add redux-saga-model`

# why

在 redux 的初期使用中，我们在 react 组件中进行异步处理，并在 then 中同步分发 action，在 reducer 中实时更新数据，但这样容易出现冗余代码且不易于后期维护，后前我们使用了 redux-thunk ，将每个 thunk 作为异步处理的流程块 ，随着业务的复杂我们发现对于更复杂的流程控制，redux-thunk 也是力不从心，接着我们发现了 redux-saga，并对其强大的异步处理流程控制感到着迷，但这个时候我们发现我们的每个模块单元下的目录结构如下：

```
|
  |--components/
  |--action.js
  |--reducer.js
  |--router.js
  |--selector.js
  |--saga.js
  |...
```

我们发现了 dva，这个强大的框架将 saga.js 与reducer.js 进行了有效的结合：

```
|
  |--components/
  |--action.js
  |--model.js
  |--router.js
  |--selector.js
  |...
```

每个 model 都有独立的维护机制，各自负责属于自己的一块 state-tree。每个 model 将对其独立的 state-tree 进行维护的 reducers 进行封装，同时把负责业务逻辑的 saga 放入 model 中，并为每个 model 增加 namespace 。看起来的确很完美，但是我们发现其中这个 model (我们统称为 saga-model) 的处理( dva )与 react 进行了捆绑，同时由于我们有一套自己实现的项目启动工具，想要将这个 saga-model 的优秀思想进行结合。故我们将其进行抽取，同时进行改造。


# 改变

- 独立出来的 model 处理器成为 sagaModel ，通过实例化 SagaModel 拿到 sagaModel。

- 可以很明显的入参 `initialState` `initialReducer` `initialMiddleware` 而不需要 dva 那样晦涩。

- ​ 每个 model 中的代码结构如下：

  ```javascript
  {
    namespace:'index',
    state:{
      name:'Tim'
    },
    reducers:{
      update:function(state,{payload}){
        return{ ...state,name:payload.name };
      }
    },
    sagas:{
      *updateName({payload},effects){
        yield effects.put({
            type:'update',
            payload,
          });
      }
    }
  }
  ```

  可以发现与 dva 的 model 基本一致，但是把 dva 中的 model 的 `effects` 字段换成了 `sagas` 因为根据 redux-saga 的官方文档介绍，这个叫法更符合其用意。

  通理，在 plugins 中，也将 dva 中的 `onEffect` 改成了 `onSaga`。

  ```javascript
  this.hooks = {
    onError: [],
    onStateChange: [],
    onAction: [],
    onHmr: [],
    onReducer: [],
    onSaga: [],
    extraReducers: [],
    extraEnhancers: [],
  };
  ```

- 不再提供与 react，react-router 的绑定，在 dva 中可以直接 start 启动，而这里需要你自己根据实际情况进行处理， 实例化 SagaModel 后通过 sagaModel 的 `store` 方法获取配置完成的 store，自己进行下一步的处理，如需要与 react-router 进行绑定，可以参考 [`react-router-redux-saga-model`](https://github.com/tomsonTang/react-router-redux-saga-model) 以及其对应的案例。



# API

- **SagaModel** 
  model 处理器类，处理过程与 dva基本相似，入参均为可选：
  - initialState  :Object  传入 createStore 的默认 state
  - initialReducer  :Object  不包含在 model 中的其他 reducers
  - initialMiddleware :Array  其他 middleware， logging 等各种
  - initialModels :Array  在获取 store 时启动所有的 model，正常情况下推荐使用改默认入参将所有的 model 进行启动，如果需要异步启动可以使用 `sagaModel.register` 方法。
  - history  :Object 通过 [`history`](https://github.com/ReactTraining/history) 构造的实例，可以用于在 model 的 substrtions 中使用。
- **sagaModel.use**
  使用插件
- **sagaModel.plugin**
  获取所有插件
- **sagaModel.setHistory**
  设置 history
- **sagaModel.history**
  获取 history
- **sagaModel.store**
   获取配置完成的 store，并启动所有的已存在的 models
- **sagaModel.register**
   注册一个 model，可以在调用 `store` 方法前或则调用后使用
- **sagaModel.dump**
  卸载一个指定 namespace 的 model
- **sagaModel.models**
  获取所有的 models
- **其他内部 API**

# 用例

[`react-router-redux-saga-model`](https://github.com/tomsonTang/react-router-redux-saga-model)