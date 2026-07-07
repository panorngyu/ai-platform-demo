import { Model } from 'sequelize';
export declare class SystemLog extends Model {
    id: number;
    userId: number;
    userName: string;
    action: string;
    module: string;
    detail: string;
    ip: string;
    createdAt: Date;
}
export default SystemLog;
