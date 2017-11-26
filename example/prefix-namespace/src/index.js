import {SagaModel} from "../../../src";
import model, { namespace } from "./model.js";

const sagaModel01 = new SagaModel({prefix:"first"})
const store01 = sagaModel01.store();

sagaModel01.register([model]);

function dispatch(store) {
  store.dispatch({
    type: `${namespace}/addAsync`,
    payload: Math.floor(Math.random() * 10)
  });
}

dispatch(store01)

const sagaModel02 = new SagaModel({prefix:"second"})
const store02 = sagaModel02.store();

sagaModel02.register([model]);

dispatch(store02)

store01.subscribe(() => {
  console.log("====================================");
  console.log("current state", store01.getState());
  console.log("====================================");
});

store02.subscribe(() => {
  console.log("====================================");
  console.log("current state", store02.getState());
  console.log("====================================");
});
