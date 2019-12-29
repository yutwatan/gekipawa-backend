export class User {
  id: number;
  name: string;

  constructor(user: any) {
    this.id = user.id;
    this.name = user.name;
  }
}
