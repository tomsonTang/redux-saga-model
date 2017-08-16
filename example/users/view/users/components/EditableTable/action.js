export const onCellChange = (user)=>{
  return{
    type:'users/ui/editableTable/onCellChange',
    payload:user
  }
}

export const onDelete = (user)=>{
  return{
    type:'users/ui/editableTable/onDelete',
    payload:user
  }
}

export const handleAdd = (user)=>{
  return{
    type:'users/ui/editableTable/handleAdd',
    payload:user
  }
}

export const getUsers = ()=>{
  return {
    type:'users/db/getUsers',
    payload:{},
  }
}
