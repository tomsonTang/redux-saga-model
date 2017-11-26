# redux-saga-model
此项目为从 [`dva`](https://github.com/dvajs/dva) 中抽取出对 model 的处理。

`npm i --save redux-saga-model`

or 

`yarn add redux-saga-model`

## why

在 redux 的初期使用中，我们在 react 组件中进行异步处理，并在 then 中同步分发 action，在 reducer 中实时更新数据，但这样容易出现冗余代码且不易于后期维护，后前我们使用了 redux-thunk ，将每个 thunk 作为异步处理的流程块 ，随着业务的复杂我们发现对于更复杂的流程控制，redux-thunk 也是力不从心，接着我们发现了 redux-saga，并对其强大的异步处理流程控制着迷，但这个时候我们发现我们的每个模块单元下的目录结构如下：

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


## 改变

- 独立出来的 model 处理器称为 sagaModel ，通过实例化 SagaModel 拿到 sagaModel。

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

  同理，在 plugins 中，也将 dva 中的 `onEffect` 改成了 `onSaga`。

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

- 在每个 model 内的 saga，默认执行类型是 `takeEvery` 可以像 dva 一样将每个 saga 传入数组格式，更换其执行类型：

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
      updateName:[*({payload},effects)=>{
        yield effects.put({
            type:'update',
            payload,
          });
      },{ type: 'takeEvery' }],
      updateAddress:[*({payload},effects)=>{
        yield //...
      },{ type: 'takeLatest' }]
    }
  }
  ```

  支持的类型与 dva 相同 `watcher` `takeLatest` `throttle` `takeEvery` 默认是 `takeEvery`
  在 dva 中，每个 saga 都允许省略当前 model 的 namespace 前缀直接分发( put )当前 reducer 的名字作为 actionType ，但是同样的特性不支持 take( 在 `watcher` 中自己决定接受什么 action)，这里将其改进为支持该特性。

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
      watchUpdateName:[*({payload},effects)=>{
        // yield effects.take('index/update_name');
        yield effects.take('update_name');
        yield effects.put({
            type:'update',
            payload,
          });
      },{ type: 'watcher' }],
  }
  ```

- 为每个 saga 以及 reducer 内部的 this 提供指向当前的 model。

- 不再提供与 react，react-router 的绑定，在 dva 中可以直接 start 启动，而这里需要你自己根据实际情况进行处理， 实例化 SagaModel 后通过 sagaModel 的 `store` 方法获取配置完成的 store，自己进行下一步的处理，如需要与 react-router 进行绑定，可以参考 [`react-router-redux-saga-model`](https://github.com/tomsonTang/react-router-redux-saga-model) 以及其对应的案例。

- API 的命名改变，具体如下。



## API

- **SagaModel** 
  model 处理器类，处理过程与 dva基本相似，入参均为可选：
  - initialState  :Object  传入 createStore 的默认 state
  - initialReducer  :Object  不包含在 model 中的其他 reducers
  - initialMiddleware :Array  其他 middleware， logging 等各种
  - initialModels  :Array  在获取 store 时启动所有的 model，正常情况下推荐使用改默认入参将所有的 model 进行启动，如果需要异步启动可以使用 `sagaModel.register` 方法。
  - history  :Object 通过 [`history`](https://github.com/ReactTraining/history) 构造的实例，可以用于在 model 的 substrtions 中使用。
  - prefix : String 当需要使用多个 store 且将多个 store 进行隔离时使用,使用时会将其作为 namespace 的前缀，故在任意 store 的上下文的 state 中取数据时，需要加上 prefix 前缀。

  ```javascript
  import {SagaModel} from 'redux-saga-model';
  const sagaModel = new SagaModel({initialState, initialReducer, initialMiddleware, initialModels,history,prefix});

  const store = sagaModel.store();
  ```

- **sagaModel.use**
  使用插件

  ```javascript
  import sagaModel from 'redux-saga-model';
  import someCrossSliceReducer from 'somewhere';
  import reduceReducers from 'reduce-reducers'

  sagaModel.use({
      onReducer:(reducer)=>{
        return reduceReducers(reducer, someCrossSliceReducer);
      },
      onError:(error,dispatch)=>{
        // ... 统一捕获所有异常
      }
    	//...
  })
  ```

  插件类型：如[前面所述](https://github.com/tomsonTang/redux-saga-model#改变)，基本与 dva 一致，除了把 `onEffect` 改成了 `onSaga` 。

  ```javascript
  hooks = {
    onError: [],
    onStateChange: [],
    onAction: [],
    onHmr: [],
    onReducer: [],
    onSaga: [],
    extraReducers: [],
    extraEnhancers: [],
  }
  ```

- **sagaModel.plugin**
  获取所有插件

  ```javascript
  import sagaModel from 'redux-saga-model';

  const plugins = sagaModel.plugin();
  ```

- **sagaModel.prefix**
   获取初始化时设置的 prefix

   ```javascript
   import sagaModel from 'redux-saga-model';

   const prefix = sagaModel.prefix();
   ```

- **sagaModel.setHistory**
   设置 history

   ```javascript
   import createBrowserHistory from "history/createBrowserHistory";
   import sagaModel from 'redux-saga-model';

   sagaModel.setHistory(createBrowserHistory());
   ```

- **sagaModel.history**
  获取 history

  ```jsx
  import createBrowserHistory from "history/createBrowserHistory";
  import {ConnectedRouter} from "react-router-redux";
  import sagaModel from 'redux-saga-model';

  sagaModel.setHistory(createBrowserHistory());

  export default (props)=>{
      return (
      	<ConnectedRouter history={sagaModel.history()}>
            { props.children }
          </ConnectedRouter>
      );
  }
  ```

- **sagaModel.store**
   获取配置完成的 store，并启动所有的已存在的 models

   ```jsx
   import {Provider} from "react-redux";
   import sagaModel from 'redux-saga-model';
   import APP from './app';

   export default ()=>{
       return (
         <Provider store={sagaModel.store()}>
           <APP />
         </Provider>
     );
   }
   ```

- **sagaModel.register**
   注册一个 model，可以在任何时刻调用。
   sagaModel.register(models,hot) :

   - models : 可以是单个 model 也可以是数组形式的 models
   - hot :任意非空值 这里的非空是指 not undefined ，not null 你可以设置为 true 或时间戳等任意格式，这里的 hot 代表是否处于热替换状态下，当且仅当在获取 store 后注册 model ,处于热替换状态且下会存在重新执行指定代码块的情况故会重新注册 model。若非热替换状态下(不传 hot 参数)重复注册相同 model则会引发 `namespace 重复 ` 异常。

   注意：

   当使用多个 store 时，在初始化设置了 prefix 后，model 的 register 需要推迟，而不是在实例化 sagaModel 的时候进行入参。

   ```javascript
   import sagaModel from 'redux-saga-model';
   import userModel from 'users/userModel';
   import indexModel from 'index/indexModel';
   import todoModel from 'todo/todoModel';

   sagaModel.register(indexModel);

   const store = sagaModel.store();

   sagaModel.register(todoModel);

   //sagaModel.register([indexModel,todoModel]);

   new Promise((resolve,reject)=>{
       setTimeout(()=>{
           sagaModel.register(userModel);
         	resolve();
       },1000);
   });
   ```

- **sagaModel.dump**
  卸载一个指定 namespace 的 model

  ```javascript
  import userModel from 'users/userModel';
  import sagaModel from 'redux-saga-model';

  sagaModel.register(userModel);
  sagaModel.dump(userModel.namespace);
  ```

- **sagaModel.models**
  获取所有的 models

  ```javascript
  import sagaModel from 'redux-saga-model';

  console.log(sagaModel.models().length);
  ```

- **其他内部 API**

- **store 上的挂载**
   为了支持方便的异步注册，在 store 上挂载了 `register` 、 `dump` 、 `runSaga` 、`prefix`方法

   ```javascript
   import sagaModel from 'redux-saga-model';
   const store = sagaModel.store();

   //somewhere
   const {register,dump,prefix} = store;

   //somewhere maybe react
   const {register,dump,prefix} = this.context.store;
   ```

   ​

## 用例

[react-router-redux-saga-model](https://github.com/tomsonTang/react-router-redux-saga-model)

## 指南

[redux-saga-model-tutorial](https://github.com/tomsonTang/redux-saga-model-tutorial)
