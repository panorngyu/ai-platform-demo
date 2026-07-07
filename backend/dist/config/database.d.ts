import { Sequelize } from 'sequelize';
export declare const sequelize: Sequelize;
export declare function testConnection(): Promise<boolean>;
export declare let dbConnected: boolean;
export declare function initDatabase(): Promise<boolean>;
export default sequelize;
