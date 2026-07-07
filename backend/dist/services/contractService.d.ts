export declare const contractService: {
    getContracts(query?: any): Promise<any>;
    getContractById(id: number): Promise<any>;
    createContract(data: any): Promise<any>;
    aiDraft(type: string, elements: any): Promise<any>;
    aiCompare(v1: string, v2: string): Promise<any>;
    aiReview(contractId: number): Promise<any>;
    generateReport(contractId: number): Promise<any>;
};
export default contractService;
