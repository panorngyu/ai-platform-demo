import { Model } from 'sequelize';
export declare class Workflow extends Model {
    id: number;
    name: string;
    type: string;
    nodes: any;
    routes: any;
    status: string;
    version: string;
    createdAt: Date;
    updatedAt: Date;
}
export default Workflow;
