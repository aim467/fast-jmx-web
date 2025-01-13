import service from "./request";

export const mbeanDetail = (params) => {
    return service({
        url: '/jmx/mbean/detail',
        method: 'GET',
        params: params
    })
}

export const mbeanList = (monitorId) => {
    return service({
        url: '/jmx/mbean/list',
        params: { monitorId },
        method: 'GET'
    })
}