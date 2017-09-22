import sagaModel from "../../../src";
import model, { namespace } from "./model.js";

const store = sagaModel.store();

sagaModel.register([model]);

function dispatch() {
  store.dispatch({
    type: `${namespace}/addAsync`,
    payload: Math.floor(Math.random() * 10)
  });
}
//提示 register 失败 ，但不会中断流程
sagaModel.register(model);

// case 1
// dispatch 后如果在短时间内重新 register 故 state 不会更新
// dispatch();
// setTimeout(()=>{
//   console.log('\nafter 0.5s\n');
//   // 热替换
//   try {
//     sagaModel.register(model,true);
//   } catch (e) {
//     console.error(e.stack);
//   }
// },500)

// case 2
// dispatch 后间隔一定时间内重新 register 故 state 会更新
dispatch();
setTimeout(()=>{
  console.log('\nafter 1.5s\n');
  // 热替换
  sagaModel.register(model,true);
},1500)
setTimeout(()=>{
  console.log('\nafter 2s\n');
  dispatch();
},2000);


store.subscribe(() => {
  console.log("====================================");
  console.log("current state", store.getState());
  console.log("====================================");
});
