import service from "./request";


export const getMonitorList = () => {
    return service({
        url: '/jmx/list',
        method: 'get'
    })
}

export const addMonitor = (data) => {
    return service({
        url: '/jmx/add',
        method: 'post',
        data: data
    })
}


export const connectJmx = (params) => {
    return service({
        url: '/jmx/connect',
        method: 'GET',
        params: params
    })
}

export const getOSRuntimeList = () => {
    return service({
        url: "/runtimeInfo"
    })
}

export const getThreadDump = (monitorId) => {
    return service({
        url: "/jmx/thread/dump",
        params: {monitorId}
    })
}

export const getSystemInfo = () => {
    return service({
        url: "/systemInfo"
    })
}

export const getBasicInfo = (monitorId) => {
    return service({
        url: "/jmx/basic",
        params: {monitorId}
    })
}


export const getLogin = (username, password) => {
    return service({
        url: "/login",
        method: 'post',
        data: {username, password}
    })
}

export const logout = () => {
    return service({
        url: '/logout',
        method: 'get'
    })
}

