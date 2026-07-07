export declare const ruleEngineService: {
    executeRules(data: any, ruleType: string): Promise<any>;
    getRules(type?: string): Promise<any[]>;
    createRule(ruleData: any): Promise<any>;
};
export default ruleEngineService;
