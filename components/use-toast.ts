const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type ActionType = typeof actionTypes

//Example usage (This is not part of the update, just an example)
type ToastAction = {
  type: ActionType[keyof ActionType]
  payload?: any
}

const addToastAction: ToastAction = {
  type: actionTypes.ADD_TOAST,
  payload: { message: "Hello World!" },
}

console.log(addToastAction)

