import { Model } from 'sequelize';
export declare class Department extends Model {
    id: number;
    name: string;
    parentId: number;
    sort: number;
    createdAt: Date;
    updatedAt: Date;
}
export default Department;
