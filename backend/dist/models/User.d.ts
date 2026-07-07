import { Model } from 'sequelize';
export declare class User extends Model {
    id: number;
    username: string;
    password: string;
    realName: string;
    avatar: string;
    email: string;
    phone: string;
    departmentId: number;
    role: string;
    status: string;
    wecomUserId: string;
    createdAt: Date;
    updatedAt: Date;
}
export default User;
