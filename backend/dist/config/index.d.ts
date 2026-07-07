export declare const config: {
    port: number;
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
    };
    redis: {
        host: string;
        port: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    llm: {
        provider: string;
        wenxin: {
            apiKey: string;
            secretKey: string;
        };
        qianwen: {
            apiKey: string;
        };
    };
    ocr: {
        provider: string;
        baidu: {
            apiKey: string;
            secretKey: string;
        };
    };
    wecom: {
        corpId: string;
        agentId: string;
        secret: string;
    };
    minio: {
        endpoint: string;
        port: number;
        accessKey: string;
        secretKey: string;
    };
};
export default config;
