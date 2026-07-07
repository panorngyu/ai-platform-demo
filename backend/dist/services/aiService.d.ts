export declare const aiService: {
    chat(prompt: string, options?: any): Promise<any>;
    mockChat(prompt: string, _options?: any): Promise<any>;
    generateSummary(documentContent: string): Promise<any>;
    mockSummary(documentContent: string): any;
    analyzeRisk(documentContent: string, rules: any[]): Promise<any>;
    mockRisk(_documentContent: string, _rules: any[]): any;
    generateOpinion(documentContent: string, riskResult: any): Promise<any>;
    mockOpinion(_documentContent: string, riskResult: any): any;
    parseExpenseCommand(naturalLanguage: string): Promise<any>;
    mockParseExpense(naturalLanguage: string): any;
    draftContract(contractType: string, elements: any): Promise<any>;
    mockDraftContract(contractType: string, elements: any): any;
    compareContracts(version1: string, version2: string): Promise<any>;
    mockCompare(_v1: string, _v2: string): any;
    reviewContract(content: string, rules: any[]): Promise<any>;
    mockReview(_content: string, _rules: any[]): any;
};
export default aiService;
