import { Model } from 'sequelize';
export declare class AuditRule extends Model {
    id: number;
    name: string;
    type: string;
    condition: any;
    action: string;
    priority: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export default AuditRule;
