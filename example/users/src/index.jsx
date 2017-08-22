import React from "react";
import ReactDOM from "react-dom";
import {Provider} from 'react-redux'
import "antd/dist/antd.css";
import loading from 'redux-saga-model-loading';
import {SagaModel} from "../../../src";
import Layout from "./view/layout/index.jsx";
import UsersTable from "./view/users/index.jsx";
import usersModels from './view/users/model.js';

const sagaModel = new SagaModel({
  initialModels:[...usersModels],
});

sagaModel.use(loading);

// 设置打开 redux-devtools
sagaModel.openReduxDevtool();

ReactDOM.render(
  <Provider store={sagaModel.store()}>
    <Layout>
      <UsersTable />
      <div>
        <p>建议：请打开 redux-devtools 查看交互流程过程中的 state 变化。<a href="https://github.com/tomsonTang/redux-saga-model-tutorial/blob/master/dividing.md#在线" target="_blank">打开 redux-devtools 教程</a></p>
      </div>
    </Layout>
  </Provider>,
  document.querySelector("#root")
);
