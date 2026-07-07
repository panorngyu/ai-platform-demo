export declare const authService: {
    login(username: string, password: string): Promise<{
        token: string;
        user: any;
    }>;
    verifyToken(token: string): any;
    getUserInfo(userId: number): Promise<any>;
    wecomCallback(code: string): Promise<{
        token: string;
        user: any;
    }>;
};
export default authService;
