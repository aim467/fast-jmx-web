import service from './request';

export const getMemoryInfo = (monitorId) => {
    return service({
        method: 'get',
        url: "/jmx/memory/",
        params: {monitorId}
    })
}