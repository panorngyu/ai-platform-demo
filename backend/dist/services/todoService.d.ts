export declare const todoService: {
    getTodos(query: any): Promise<{
        list: any[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getTodoById(id: number): Promise<any>;
    batchApprove(ids: number[], action: string, approverId: number, approverName: string, opinion: string): Promise<any>;
    updateTodoStatus(id: number, status: string): Promise<any>;
    checkTimeout(): Promise<number>;
};
export default todoService;
