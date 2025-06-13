export class CreateUserInputDto {
  login: string;
  email: string;
  password: string;
}

export class LoginDto {
  loginOrEmail: string;
  password: string;
}
