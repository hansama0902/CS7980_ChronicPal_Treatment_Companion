export interface IRegisterDto {
  email: string;
  password: string;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface ITokenPayload {
  sub: string;  // user id
  email: string;
}

export interface IAuthenticatedUser {
  id: string;
  email: string;
}
