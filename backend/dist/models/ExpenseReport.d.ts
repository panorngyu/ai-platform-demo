import { Model } from 'sequelize';
export declare class ExpenseReport extends Model {
    id: number;
    applicantId: number;
    applicantName: string;
    department: string;
    type: string;
    amount: number;
    date: Date;
    description: string;
    invoices: any;
    aiParsed: any;
    status: string;
    budgetBefore: number;
    budgetAfter: number;
    createdAt: Date;
    updatedAt: Date;
}
export default ExpenseReport;
