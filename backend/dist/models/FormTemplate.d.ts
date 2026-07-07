import { Model } from 'sequelize';
export declare class FormTemplate extends Model {
    id: number;
    name: string;
    type: string;
    schema: any;
    version: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export default FormTemplate;
