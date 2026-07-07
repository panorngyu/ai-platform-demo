export declare const expenseService: {
    getExpenses(query?: any): Promise<any>;
    createExpense(data: any): Promise<any>;
    aiParse(command: string): Promise<any>;
    aiAutoFill(historyData: any): Promise<any>;
    checkCompliance(expenseData: any): Promise<any>;
    getBudget(department: string, category: string): Promise<any>;
    deductBudget(department: string, category: string, amount: number): Promise<any>;
};
export default expenseService;
