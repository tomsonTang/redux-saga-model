import React from "react";
import ReactDOM from "react-dom";
import {Provider} from 'react-redux'
import "antd/dist/antd.css";
import loading from 'redux-saga-model-loading';
import {SagaModel} from "../../../src";
import Layout from "./view/layout/index.jsx";
import UsersTable from "./view/users/index.jsx";

const sagaModel = new SagaModel({
  prefix:"first-store"
});

sagaModel.use(loading);

// 设置打开 redux-devtools
sagaModel.openReduxDevtool();
const store = sagaModel.store();

const sagaModel02 = new SagaModel({
  prefix:"second-store"
});

sagaModel02.use(loading);

// 设置打开 redux-devtools
sagaModel02.openReduxDevtool();
const store02 = sagaModel02.store();

ReactDOM.render(
  <div>
    <Provider store={store}>
      <Layout>
        <UsersTable/>
        <div>
          <p>建议：请打开 redux-devtools 查看交互流程过程中的 state 变化。<a href="https://github.com/tomsonTang/redux-saga-model-tutorial/blob/master/dividing.md#在线" target="_blank">打开 redux-devtools 教程</a></p>
        </div>
      </Layout>
    </Provider>
    <Provider store={store02}>
      <Layout>
        <UsersTable/>
        <div>
          <p>建议：请打开 redux-devtools 查看交互流程过程中的 state 变化。<a href="https://github.com/tomsonTang/redux-saga-model-tutorial/blob/master/dividing.md#在线" target="_blank">打开 redux-devtools 教程</a></p>
        </div>
      </Layout>
    </Provider>
  </div>,
  document.querySelector("#root")
);
