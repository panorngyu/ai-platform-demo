export declare const approvalService: {
    getApprovalDetail(todoId: number): Promise<any>;
    buildDocumentContent(todo: any): string;
    approve(todoId: number, approverId: number, approverName: string, action: string, opinion: string): Promise<any>;
    getApprovalHistory(todoId: number): Promise<any[]>;
    getOpinionTemplates(): Promise<any[]>;
};
export default approvalService;
