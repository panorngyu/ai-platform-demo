import { Model } from 'sequelize';
export declare class Budget extends Model {
    id: number;
    department: string;
    category: string;
    totalAmount: number;
    usedAmount: number;
    period: string;
    createdAt: Date;
    updatedAt: Date;
}
export default Budget;
