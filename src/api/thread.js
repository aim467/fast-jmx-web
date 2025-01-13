import service from "./request";


export const getThreadList = (monitorId) => {
    return service({
        method: 'get',
        url: "/jmx/thread/list",
        params: {monitorId}
    })
}

export const getThreadStack = (params) => {
    return service({
        method: 'get',
        url: "/jmx/thread/stack",
        params: params
    })
}


export const getThreadDump = (monitorId) => {
    return service({
        method: 'get',
        url: "/jmx/thread/dump",
        params: {monitorId}
    })
}

export const threadStatics = (monitorId) => {
    return service({
        method: 'get',
        url: "/jmx/thread/info",
        params: {monitorId}
    })
}

export const checkDeadLock = (monitorId) => {
    return service({
        method: 'get',
        url: "/jmx/thread/deadLock",
        params: {monitorId}
    })
}