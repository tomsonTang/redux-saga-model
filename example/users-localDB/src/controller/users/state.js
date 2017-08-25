export default {
  /**
   * user list 有序
   * [
   *  {//user
   *    key:string,
   *    name:string,
   *    phone:string,
   *    website:string,
   *  },
   *  //...
   * ]
   */
  list: [],
  /**
   * 当前 list 内最大的 key
   * 增加或删除用户需要更新
   */
  maxKey: 0,
  /**
   * 当前 list 的总量
   * 增加或删除用户需要更新
   */
  count: 0
}
