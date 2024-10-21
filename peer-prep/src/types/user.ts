export type User = {
  email: string,
  password?: string,
  displayName: string,
  isAdmin: boolean,
<<<<<<< HEAD
  id: string,
=======
  _id: string,
>>>>>>> upstream/main
}

export interface UserResponseData {
  user: User;
}