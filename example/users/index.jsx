import React from "react";
import ReactDOM from "react-dom";
import {SagaModel} from "../../src";
import Layout from "./view/layout/index.jsx";
import UsersTable from "./view/users/index.jsx";
import {Provider} from 'react-redux'
import "antd/dist/antd.css";
import usersModels from './view/users/model.js';

const sagaModel = new SagaModel({
  initialModels:[...usersModels],
});

ReactDOM.render(
  <Provider store={sagaModel.store()}>
    <Layout>
      <UsersTable />
    </Layout>
  </Provider>,
  document.querySelector("#root")
);
