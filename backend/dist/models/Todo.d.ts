import { Model } from 'sequelize';
export declare class Todo extends Model {
    id: number;
    title: string;
    source: string;
    type: string;
    priority: string;
    amount: number;
    applicantId: number;
    applicantName: string;
    department: string;
    status: string;
    isTimeout: boolean;
    isUrgent: boolean;
    createdAt: Date;
    submittedAt: Date;
    dueAt: Date;
    updatedAt: Date;
}
export default Todo;
