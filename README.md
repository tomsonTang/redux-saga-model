# redux-saga-model
从 [`dva`](https://github.com/dvajs/dva) 中抽取出对 model 的处理

`npm i redux-saga-model`

# why

1. dva 与 react 进行了捆绑。
2. dva 封装了构造 store 的过程，忽略了store 的 initialState。
3. dva 直接将 store 与 Provider 等进行了捆绑。





# 使用规范及建议

- 允许传入默认的 state，reducer，middleware。
- 每个 modle 写法更新成类的写法。
- ​



# 提高

