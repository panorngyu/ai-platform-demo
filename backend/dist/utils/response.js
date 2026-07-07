// 统一响应格式工具
export function success(data, message) {
    return {
        code: 200,
        success: true,
        data,
        message
    };
}
export function fail(message, code) {
    return {
        code: code || 400,
        success: false,
        message
    };
}
// 分页响应
export function paginate(list, total, page, pageSize) {
    return {
        code: 200,
        success: true,
        data: {
            list,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        }
    };
}
export default { success, fail, paginate };
