import { Model } from 'sequelize';
export declare class Contract extends Model {
    id: number;
    title: string;
    type: string;
    partyA: string;
    partyB: string;
    amount: number;
    signDate: Date;
    startDate: Date;
    endDate: Date;
    content: string;
    status: string;
    riskLevel: string;
    auditResult: any;
    createdAt: Date;
    updatedAt: Date;
}
export default Contract;
