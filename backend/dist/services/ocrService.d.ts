export declare const ocrService: {
    recognizeInvoice(imagePath: string): Promise<any>;
    mockInvoice(imagePath: string): any;
    recognizeContract(imagePath: string): Promise<any>;
    mockContract(imagePath: string): any;
};
export default ocrService;
