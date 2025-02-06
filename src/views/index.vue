<template>
    <el-menu class="nav-menu" router :default-active="this.$router.path" mode="horizontal" :ellipsis="false">
        <el-menu-item index="0" class="logo-menu-item">
            <img src="../assets/icon/logo.png" alt="Fast JMX Logo" />
            <span>Fast JMX</span>
        </el-menu-item>

        <div style="display: flex; align-items: center; height: 100%;">
            <el-menu-item class="nav-item" index="/">
                <el-icon>
                    <House />
                </el-icon>
                <span>首页</span>
            </el-menu-item>

            <el-sub-menu index="2">
                <template #title>
                    <el-icon>
                        <Monitor />
                    </el-icon>
                    <span>仪表盘</span>
                </template>
                <el-menu-item @click="navigateTo('/basic')">
                    <el-icon>
                        <Cpu />
                    </el-icon>
                    <span>JVM信息</span>
                </el-menu-item>
                <el-menu-item @click="navigateTo('/thread')">
                    <el-icon>
                        <Connection />
                    </el-icon>
                    <span>线程监控</span>
                </el-menu-item>
                <el-menu-item @click="navigateTo('/memory')">
                    <el-icon>
                        <Histogram />
                    </el-icon>
                    <span>内存监控</span>
                </el-menu-item>
                <el-menu-item @click="navigateTo('/mbean')">
                    <el-icon>
                        <Management />
                    </el-icon>
                    <span>MBean管理</span>
                </el-menu-item>
            </el-sub-menu>
        </div>

        <div class="user-container">
            <el-dropdown trigger="click">
                <span class="user-dropdown-link">
                    <!-- <el-avatar size="small" icon="el-icon-user" /> -->
                    <span class="username">admin</span>
                    <el-icon class="el-icon--right">
                        <arrow-down />
                    </el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="handleLogout">
                            <el-icon><SwitchButton /></el-icon>
                            <span>退出登录</span>
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </el-menu>

    <el-button class="drawer-trigger" type="primary" @click="drawer = true">
        <el-icon>
            <Setting />
        </el-icon>
        <span>Jmx 管理</span>
    </el-button>
    <el-drawer v-model="drawer" :direction="direction" :before-close="handleClose" size="65%" class="modern-drawer">
        <template #header>
            <div class="drawer-header">
                <el-icon class="drawer-icon"><Setting /></el-icon>
                <div>
                    <h3 class="drawer-title">JMX 连接管理</h3>
                    <p class="drawer-subtitle">管理本地/远程 JMX 连接配置</p>
                </div>
            </div>
        </template>

        <div class="drawer-content">
            <el-table :data="monitorList" class="clean-table" stripe>
                <el-table-column prop="monitorId" label="监控ID" min-width="220" />
                <el-table-column prop="name" label="连接名称" :show-overflow-tooltip="true" min-width="280" />
                <el-table-column prop="jmxUrl" label="JMX 地址" :show-overflow-tooltip="true" min-width="400" />
                <el-table-column prop="pid" label="进程ID" width="100" align="center" />
                <el-table-column prop="type" label="类型" width="100" align="center">
                    <template v-slot="scope">
                        <el-tag :type="scope.row.type === 1 ? 'success' : 'warning'" effect="dark">
                            {{ getTypeLabel(scope.row.type) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="140" align="center">
                    <template #default="{ row }">
                        <el-button type="success" size="small" round @click="connectMonitor(row)">
                            <el-icon><Connection /></el-icon>
                            连接
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="add-monitor">
                <h4 class="form-title">新增 JMX 连接</h4>
                <el-form ref="monitorForm" :model="monitorForm" :inline="false" :rules="jmxRule" label-position="top">
                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-form-item label="连接名称" prop="name">
                                <el-input 
                                    v-model="monitorForm.name" 
                                    placeholder="请输入连接名称"
                                    prefix-icon="Connection"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="14">
                            <el-form-item label="JMX 地址" prop="jmxUrl">
                                <el-input 
                                    v-model="monitorForm.jmxUrl" 
                                    placeholder="例：service:jmx:rmi:///jndi/rmi://127.0.0.1:9010/jmxrmi"
                                    prefix-icon="Link"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="2">
                            <el-form-item>
                                <el-button 
                                    type="primary" 
                                    style="margin-top: 24px"
                                    @click="addRemoteJmx"
                                >
                                    <el-icon><Plus /></el-icon>
                                    添加
                                </el-button>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </div>
        </div>
    </el-drawer>

    <div class="main-container">
        <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
                <keep-alive :include="isCached">
                    <component :is="Component" />
                </keep-alive>
            </transition>
        </router-view>

        <template v-if="$route.path === '/'">
            <div class="refresh-container">
                <el-button class="refresh-button" :loading="isRefreshing" @click="refreshSystemInfo" type="primary"
                    plain>
                    <el-icon>
                        <Refresh />
                    </el-icon>
                    刷新系统信息
                </el-button>
            </div>

            <el-row :gutter="20" class="info-row">
                <el-col :span="8">
                    <el-card class="info-card">
                        <template #header>
                            <div class="card-header">
                                <el-icon>
                                    <Monitor />
                                </el-icon>
                                <span>系统信息</span>
                            </div>
                        </template>
                        <div class="info-list">
                            <div class="info-item">
                                <span class="label">操作系统：</span>
                                <span class="value">{{ osInfo.os }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">系统架构：</span>
                                <span class="value">{{ osInfo.osArch }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Java版本：</span>
                                <span class="value">{{ osInfo.javaVersion }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">CPU核心数：</span>
                                <span class="value">{{ osInfo.cpuCount }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">主机名：</span>
                                <span class="value">{{ osInfo.hostName }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">主机IP：</span>
                                <span class="value">{{ osInfo.host }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">用户目录：</span>
                                <span class="value">{{ osInfo.userDir }}</span>
                            </div>

                            <div class="info-item">
                                <span class="label">运行时长：</span>
                                <span class="value">{{ osInfo.bootTime }}</span>
                            </div>
                        </div>
                    </el-card>
                </el-col>

                <el-col :span="8">
                    <el-card class="info-card">
                        <template #header>
                            <div class="card-header">
                                <el-icon>
                                    <Cpu />
                                </el-icon>
                                <span>CPU信息</span>
                            </div>
                        </template>
                        <div class="cpu-info">
                            <el-progress type="dashboard" :percentage="Math.round(osRuntimeInfo.cpuUsage * 100)"
                                :color="cpuColors">
                                <template #default="{ percentage }">
                                    <div class="progress-content">
                                        <span class="progress-label">CPU使用率</span>
                                        <span class="progress-value">{{ percentage }}%</span>
                                    </div>
                                </template>
                            </el-progress>
                            <div class="cpu-details">
                                <div class="info-item">
                                    <span class="label">最大频率：</span>
                                    <span class="value">{{ osRuntimeInfo.cpuMaxFreq }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">当前频率：</span>
                                    <span class="value">{{ osRuntimeInfo.cpuCurrentFreq }}</span>
                                </div>
                            </div>
                        </div>
                    </el-card>
                </el-col>

                <el-col :span="8">
                    <el-card class="info-card">
                        <template #header>
                            <div class="card-header">
                                <el-icon>
                                    <Histogram />
                                </el-icon>
                                <span>内存信息</span>
                            </div>
                        </template>
                        <div class="memory-info">
                            <div class="memory-section">
                                <div class="memory-label">物理内存</div>
                                <el-progress
                                    :percentage="getMemoryPercentage(osRuntimeInfo.usedMemory, osRuntimeInfo.totalMemory)"
                                    :format="format" :color="memoryColors" />
                                <div class="memory-details">
                                    <span>已用: {{ formatBytes(osRuntimeInfo.usedMemory) }}</span>
                                    <span>总计: {{ formatBytes(osRuntimeInfo.totalMemory) }}</span>
                                </div>
                            </div>
                            <div class="memory-section">
                                <div class="memory-label">交换内存</div>
                                <el-progress
                                    :percentage="getMemoryPercentage(osRuntimeInfo.swapUsedMemory, osRuntimeInfo.swapTotalMemory)"
                                    :format="format" :color="memoryColors" />
                                <div class="memory-details">
                                    <span>已用: {{ formatBytes(osRuntimeInfo.swapUsedMemory) }}</span>
                                    <span>总计: {{ formatBytes(osRuntimeInfo.swapTotalMemory) }}</span>
                                </div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </template>
    </div>
</template>


<script>
import { getMonitorList, connectJmx, addMonitor, getSystemInfo, logout } from '@/api/api';
import { House, Monitor, Cpu, Connection, Histogram, Management, Setting, Refresh, ArrowDown, SwitchButton, Plus } from '@element-plus/icons-vue'

export default {
    components: {
        House,
        Monitor,
        Cpu,
        Connection,
        Histogram,
        Management,
        Setting,
        Refresh,
        ArrowDown,
        SwitchButton,
        Plus
    },
    data() {
        return {
            osInfo: {
                os: '',
                osArch: '',
                javaVersion: '',
                userDir: '',
                cpuCount: null,
                host: '',
                hostName: '',
                bootTime: ''
            },
            osRuntimeInfo: {
                cpuUsage: null,
                cpuMaxFreq: '',
                cpuCurrentFreq: '',
                totalMemory: null,
                usedMemory: null,
                swapTotalMemory: null,
                swapUsedMemory: null
            },
            drawer: false,
            drawerVisible: false,
            direction: 'btt',
            isCached: [],
            monitorList: [],
            monitorForm: {
                name: null,
                jmxUrl: null
            },
            currentMonitorId: null,
            jmxRule: {
                name: [
                    { required: true, message: '请输入连接名', trigger: 'blur' }
                ],
                jmxUrl: [
                    { required: true, message: '请输入Jmx地址', trigger: 'blur' }
                ]
            },
            cpuColors: [
                { color: '#67C23A', percentage: 60 },
                { color: '#E6A23C', percentage: 80 },
                { color: '#F56C6C', percentage: 100 }
            ],
            memoryColors: [
                { color: '#67C23A', percentage: 60 },
                { color: '#E6A23C', percentage: 80 },
                { color: '#F56C6C', percentage: 100 }
            ],
            isRefreshing: false
        }
    },
    mounted() {

    },
    methods: {
        initSystemInfo() {
            return getSystemInfo().then(res => {
                this.osInfo = res.data.osInfo;
                this.osRuntimeInfo = res.data.osRuntimeInfo;
            }).catch(error => {
                console.error(error);
            });
        },
        navigateTo(path) {
            if (this.currentMonitorId !== null) {
                this.$router.push({ path: path, query: { monitorId: this.currentMonitorId } });
                return;
            }

            this.$router.push({ path: path, query: { monitorId: this.$store.state.monitorId } });
        },
        handleClose() {
            this.monitorForm = {
                name: null,
                jmxUrl: null
            };
            this.drawer = false;
        },
        connectMonitor(row) {
            connectJmx({ "monitorId": row.monitorId }).then(res => {
                this.$message.success(res.message);
                this.currentMonitorId = row.monitorId;
                this.getMonitors();
                this.handleClose();
                this.$store.commit("setMonitorId", row.monitorId);
                this.$router.push({ path: '/basic', query: { monitorId: this.currentMonitorId } });
            }).catch(error => {
                console.log(error);
            })
        },
        addRemoteJmx() {
            this.$refs.monitorForm.validate(valid => {
                if (valid) {
                    addMonitor(this.monitorForm).then(res => {
                        this.$message.success(res.message);
                        this.getMonitors();
                        this.handleClose();
                        this.$store.commit("setMonitorId", res.data);
                        this.$router.push({ path: '/basic', query: { monitorId: res.data } });
                    }).catch(error => {
                        console.log(error);
                    })
                } else {
                    this.$message.error("验证失败");
                }
            });
        },
        getTypeLabel(type) {
            return type === 1 ? '本地' : type === 2 ? '远程' : '未知';
        },
        getMonitors() {
            getMonitorList().then(res => {
                this.monitorList = res.data;
            });
        },
        getMemoryPercentage(used, total) {
            return Math.round((used / total) * 100);
        },
        formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        format(percentage) {
            return percentage + '%';
        },
        refreshSystemInfo() {
            this.isRefreshing = true;
            this.initSystemInfo().finally(() => {
                this.isRefreshing = false;
            });
        },
        handleLogout() {
            logout().then(() => {
                this.$store.commit('setToken', '')
                this.$router.push('/login')
                this.$message.success('退出成功')
            }).catch(error => {
                console.error('退出失败:', error)
                this.$message.error('退出失败')
            })
        }
    },
    created() {
        this.getMonitors();
        this.initSystemInfo();
    }
};
</script>

<style scoped>
.nav-menu {
    background-color: #1a1f2c !important;
}

.add-monitor {
    margin: 10px;
}

.drawer-trigger {
    position: fixed;
    top: 15%;
    right: 20px;
    transform: translateY(-50%);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    background-color: #1e80ff;
    color: white;
    border-radius: 50px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease;
}

.drawer-trigger:hover {
    background-color: #2563eb;
}

.main-container {
    margin: 20px;
}

/* Modern navigation styles */
:deep(.el-menu) {
    background-color: #1e80ff !important;
    border: none !important;
    box-shadow: 0 2px 12px 0 rgba(30, 128, 255, 0.2);
    padding: 0 20px;
}

:deep(.el-menu--horizontal) {
    height: 60px;
    display: flex;
    align-items: center;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
    height: 60px !important;
    line-height: 60px !important;
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 15px;
    transition: all 0.3s ease;
    padding: 0 20px !important;
    display: flex;
    align-items: center;
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
    margin-right: 6px;
    font-size: 18px;
}

:deep(.el-menu-item.is-active) {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    font-weight: 500;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
}

/* Logo styles */
.logo-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px !important;
    background-color: transparent !important;
    pointer-events: none;
    margin-right: 20px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-menu-item img {
    height: 40px;
    width: auto;
}

.logo-menu-item span {
    font-weight: 600;
    color: white;
    font-size: 18px;
}

/* 子菜单样式 */
:deep(.el-menu--popup) {
    background-color: white !important;
    padding: 5px 0;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-menu--popup .el-menu-item) {
    height: 40px !important;
    line-height: 40px !important;
    color: #333 !important;
    padding: 0 16px !important;
}

:deep(.el-menu--popup .el-menu-item:hover) {
    background-color: #f5f7fa !important;
    color: #1e80ff !important;
}

:deep(.el-menu--popup .el-menu-item .el-icon) {
    color: #666;
}

:deep(.el-menu--popup .el-menu-item:hover .el-icon) {
    color: #1e80ff;
}

/* 修复导航项对齐问题 */
.nav-item {
    display: flex;
    align-items: center;
}

:deep(.el-sub-menu) {
    display: flex;
    align-items: center;
}

/* Transition styles */
.fade-transform-enter-active,
.fade-transform-leave-active {
    transition: all 0.3s;
}

.fade-transform-enter-from,
.fade-transform-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

/* Dialog styles */
:deep(.el-dialog__body) {
    padding: 20px;
}

:deep(.el-dialog) {
    background: #F8FAFC;
    border-radius: 12px;
    margin-top: 7vh !important;
}

:deep(.el-dialog__header) {
    padding-top: 10px;
    position: relative;
    font-size: 20px;
    padding-left: 37px;
    font-weight: bold;
    padding-bottom: 15px;
    border-bottom: 1px solid #e2e8f0;
}

:deep(.el-dialog__title)::after {
    content: "";
    position: absolute;
    left: 20px;
    width: 4px;
    height: 24px;
    bottom: 16px;
    background: #2563eb !important;
    border-radius: 2px;
}

.info-row {
    margin-bottom: 20px;
}

.info-card {
    height: 100%;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
}

.info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
    border-bottom: none;
}

.label {
    color: #606266;
    font-size: 14px;
}

.value {
    color: #303133;
    font-weight: 500;
}

.cpu-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.progress-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.progress-label {
    font-size: 14px;
    color: #606266;
}

.progress-value {
    font-size: 20px;
    font-weight: bold;
    color: #303133;
}

.cpu-details {
    width: 100%;
    margin-top: 20px;
}

.memory-info {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.memory-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.memory-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
}

.memory-details {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #909399;
}

:deep(.el-progress-bar__outer) {
    background-color: #f0f2f5;
}

:deep(.el-card__header) {
    padding: 15px 20px;
    border-bottom: 1px solid #f0f0f0;
}

.refresh-container {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 16px;
}

.refresh-button {
    display: flex;
    align-items: center;
    gap: 6px;
}

.refresh-button :deep(.el-icon) {
    transition: transform 0.3s ease;
}

.refresh-button:hover :deep(.el-icon) {
    transform: rotate(180deg);
}

/* 当按钮处于加载状态时，禁用hover效果 */
.refresh-button.is-loading:hover :deep(.el-icon) {
    transform: none;
}

.user-container {
    margin-left: auto;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 20px;
}

.user-dropdown-link {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #fff;
    font-size: 14px;
}

.username {
    margin: 0 8px;
}

:deep(.el-dropdown-menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;
}

:deep(.el-dropdown-menu__item .el-icon) {
    margin-right: 4px;
}

/* 新增样式 */
.drawer-header {
    display: flex;
    align-items: center;
    padding: 0px 16px 10px 0px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom:  0px !important;
}

.drawer-icon {
    font-size: 28px;
    color: #1e80ff;
    margin-right: 16px;
}

.drawer-title {
    margin: 0;
    color: #1f2937;
    font-size: 18px;
}

.drawer-subtitle {
    margin: 4px 0 0;
    color: #6b7280;
    font-size: 12px;
}

.drawer-content {
    background: #ffffff;
}

.form-title {
    margin: 10px 0 15px;
    color: #1f2937;
    font-size: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
}

.add-monitor {
    margin-top: 10px;
    padding-top: 10px;
    border-radius: 6px;
}

/* 优化表格样式 */
:deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-table__header th) {
    background-color: #f3f4f6 !important;
    color: #374151;
    font-weight: 600;
}

:deep(.el-table__row:hover) {
    background-color: #f8fafc !important;
}

/* 优化输入框样式 */
:deep(.el-input__inner) {
    border-radius: 8px;
    transition: all 0.3s ease;
}

:deep(.el-input__inner:focus) {
    border-color: #1e80ff;
    box-shadow: 0 0 0 2px rgba(30, 128, 255, 0.2);
}

/* 优化抽屉样式 */
:deep(.el-drawer) {
    box-shadow: none !important;
    border-left: 1px solid #f0f2f5;
}

:deep(.el-drawer__header) {
    margin-bottom: 0 !important;
    padding: 16px 24px;
}

.clean-table {
    margin: 12px 0 20px;
    border: 1px solid #f0f2f5;
}

/* 调整表格间距 */
:deep(.el-table__header th) {
    padding: 12px 0 !important;
}

:deep(.el-table__body td) {
    padding: 8px 0 !important;
}

/* 简化输入框样式 */
:deep(.el-input__inner) {
    box-shadow: none !important;
    border-color: #e4e7ed;
}

:deep(.el-input__inner:focus) {
    border-color: #1e80ff;
    box-shadow: 0 0 0 1px rgba(30, 128, 255, 0.2) !important;
}
</style>
