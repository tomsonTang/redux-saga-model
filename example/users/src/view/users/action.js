export const onCellChange = (user)=>{
  return{
    type:'users/ui/onCellChange',
    payload:user
  }
}

export const onDelete = (user)=>{
  return{
    type:'users/ui/onDelete',
    payload:user
  }
}

export const handleAdd = (user)=>{
  return{
    type:'users/ui/handleAdd',
    payload:user
  }
}

export const getUsers = ()=>{
  return {
    type:'users/db/getUsers',
    payload:{},
  }
}
