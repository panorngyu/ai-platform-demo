import { Model } from 'sequelize';
export declare class ApprovalRecord extends Model {
    id: number;
    todoId: number;
    approverId: number;
    approverName: string;
    action: string;
    opinion: string;
    aiOpinion: string;
    aiRiskLevel: string;
    aiSummary: string;
    createdAt: Date;
}
export default ApprovalRecord;
