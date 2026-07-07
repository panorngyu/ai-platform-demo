import { Sequelize } from 'sequelize';
import { config } from './index.js';
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log('[SQL]', msg) : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    },
    timezone: '+08:00'
});
// 测试连接（不阻塞启动）
export async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('[Database] 数据库连接成功');
        return true;
    }
    catch (error) {
        console.warn('[Database] 数据库连接失败，将使用 Mock 数据:', error.message);
        return false;
    }
}
// 数据库是否可用
export let dbConnected = false;
export async function initDatabase() {
    dbConnected = await testConnection();
    if (dbConnected) {
        try {
            // 同步模型（开发环境，生产环境应使用 migration）
            const { syncModels } = await import('../models/index.js');
            await syncModels();
            // 初始化种子数据
            const { seedData } = await import('../models/index.js');
            await seedData();
        }
        catch (error) {
            console.warn('[Database] 模型同步失败:', error.message);
            dbConnected = false;
        }
    }
    return dbConnected;
}
export default sequelize;
