export declare function success(data?: any, message?: string): {
    code: number;
    success: boolean;
    data: any;
    message: string | undefined;
};
export declare function fail(message: string, code?: number): {
    code: number;
    success: boolean;
    message: string;
};
export declare function paginate(list: any[], total: number, page: number, pageSize: number): {
    code: number;
    success: boolean;
    data: {
        list: any[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
};
declare const _default: {
    success: typeof success;
    fail: typeof fail;
    paginate: typeof paginate;
};
export default _default;
