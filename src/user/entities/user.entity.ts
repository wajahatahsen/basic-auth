import { ObjectId, Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity()
class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;
}

export default User;
