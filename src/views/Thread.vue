<template>
    <div class="container" v-loading="loading" element-loading-text="加载中..."
        element-loading-background="rgba(255, 255, 255, 0.7)">
        <!-- 使用 el-descriptions 替换原有的面板信息 -->
        <el-card class="thread-info-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>线程状态统计信息</span>
                    <el-tag type="info">最后更新: {{ lastUpdateTime || '-' }}</el-tag>
                </div>
            </template>
            
            <el-descriptions :column="2" border>
                <el-descriptions-item label="线程总数">
                    <el-statistic :value="threadStatics?.threadCount">
                        <template #suffix>个</template>
                    </el-statistic>
                </el-descriptions-item>
                
                <el-descriptions-item label="峰值线程数">
                    <el-statistic :value="threadStatics?.peakThreadCount">
                        <template #suffix>个</template>
                    </el-statistic>
                </el-descriptions-item>
                
                <el-descriptions-item label="启动线程总数">
                    <el-statistic :value="threadStatics?.totalStartedThreadCount">
                        <template #suffix>个</template>
                    </el-statistic>
                </el-descriptions-item>
                
                <el-descriptions-item label="守护线程数">
                    <el-statistic :value="threadStatics?.daemonThreadCount">
                        <template #suffix>个</template>
                    </el-statistic>
                </el-descriptions-item>
                
                <el-descriptions-item label="存活线程数">
                    <el-statistic :value="threadStatics?.liveThreadCount">
                        <template #suffix>个</template>
                    </el-statistic>
                </el-descriptions-item>
                
                <el-descriptions-item label="线程CPU时间">
                    <el-statistic :value="formatTime(threadStatics?.threadCpuTime)" value-style="font-size: 14px;" />
                </el-descriptions-item>
                
                <el-descriptions-item label="线程用户时间">
                    <el-statistic :value="formatTime(threadStatics?.threadUserTime)" value-style="font-size: 14px;" />
                </el-descriptions-item>
            </el-descriptions>
        </el-card>
        <el-row class="operation-bar" :gutter="20" type="flex" align="middle" justify="start">
            <el-col :span="6">
                <div class="refresh-control">
                    <el-select v-model="refreshInterval" @change="setRefreshInterval" placeholder="选择刷新间隔" size="default">
                        <el-option label="关闭自动刷新" :value="0"></el-option>
                        <el-option label="1秒" :value="1000"></el-option>
                        <el-option label="5秒" :value="5000"></el-option>
                        <el-option label="10秒" :value="10000"></el-option>
                        <el-option label="15秒" :value="15000"></el-option>
                        <el-option label="30秒" :value="30000"></el-option>
                    </el-select>
                    <!-- <span class="refresh-status">{{ autoRefreshStatus }}</span> -->
                </div>
            </el-col>
            <el-col :span="12">
                <div class="operation-buttons">
                    <el-button type="primary" @click="refreshThreads" size="default">
                        <el-icon><Refresh /></el-icon>
                        刷新
                    </el-button>
                    <el-button type="primary" @click="printThreadStack" size="default">
                        <el-icon><Document /></el-icon>
                        显示线程堆栈
                    </el-button>
                    <el-button type="primary" @click="findDeadLock" size="default">
                        <el-icon><Warning /></el-icon>
                        检测死锁
                    </el-button>
                </div>
            </el-col>
        </el-row>
        <el-row :span="24" class="thread-list">
            <el-table :data="threads" style="width: 100%" stripe height="700"
                :header-cell-style="{ background: '#eef1f6', color: '#606266' }" @sort-change="handleSortChange">
                <el-table-column prop="threadId" label="线程ID" width="100" sortable="custom" />
                <el-table-column prop="threadName" label="线程名称" width="200" sortable="custom">
                    <!--超过10字符显示省略号，并且tooltip显示全部内容-->
                    <template #default="scope">
                        <el-tooltip :content="scope.row.threadName" placement="top-start">
                            <span v-if="scope.row.threadName.length > 10">{{ scope.row.threadName.substring(0, 20) +
                                '...' }}</span>
                            <span v-else>{{ scope.row.threadName }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column prop="threadState" label="线程状态" width="120" sortable="custom">
                    <template #default="scope">
                        <el-tag :type="getThreadStateType(scope.row.threadState)">
                            {{ scope.row.threadState }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="blockedCount" label="阻塞次数" />
                <el-table-column prop="blockedTime" label="阻塞时间" />
                <el-table-column prop="blockedCount" label="阻塞总数" />
                <el-table-column prop="waitedTime" label="等待时间" />
                <el-table-column prop="waitedCount" label="等待总数" />
                <el-table-column prop="isSuspended" label="挂起" />
                <el-table-column prop="isNative" label="原生方法" />
                <el-table-column prop="isDeadLock" label="死锁" width="80">
                    <template #default="scope">
                        <el-tag :type="scope.row.isDeadLock ? 'danger' : 'success'">
                            {{ scope.row.isDeadLock ? '是' : '否' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                    <template #default="scope">
                        <el-button type="primary" @click="showStackTraceDialog(scope.row)">查看调用栈</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-row>

        <!-- 原始堆栈信息弹窗 -->
        <el-dialog v-model="threadStackDialogVisible" title="原始堆栈信息" width="90%" class="stack-dialog">
            <div class="stack-data">
                <pre><code>{{ stackData }}</code></pre>
            </div>
            <template #footer>
                <el-button @click="threadStackDialogVisible = false" type="primary" plain>关闭</el-button>
            </template>
        </el-dialog>

        <!-- 堆栈信息弹窗 -->
        <el-dialog v-model="stackTraceDialogVisible" title="线程堆栈信息" width="80%" class="stack-trace-dialog">
            <div class="stack-trace-container">
                <el-table 
                    :data="currentStackTrace" 
                    width="100%"
                    border
                    stripe
                    height="calc(70vh - 108px)"
                    :cell-style="{ padding: '8px 16px' }"
                >
                    <el-table-column label="" :show-header="false">
                        <template #default="scope">
                            <div class="stack-trace-row">
                                <el-tooltip 
                                    :content="scope.row.declaringClass + '.' + scope.row.methodName" 
                                    placement="top"
                                    :show-after="1000"
                                >
                                    <div class="stack-info">
                                        <span class="line-number">行号: {{ scope.row.lineNumber >= 0 ? scope.row.lineNumber : '不可用' }}</span>
                                        <el-divider direction="vertical" />
                                        <div class="method-signature text-ellipsis">
                                            <span class="class-name">{{ scope.row.declaringClass }}</span><span class="method-name">.{{ scope.row.methodName }}</span>
                                        </div>
                                        <el-divider direction="vertical" />
                                        <el-tag 
                                            :type="scope.row.native ? 'danger' : 'success'"
                                            size="small"
                                        >
                                            {{ scope.row.native ? '本地方法' : '非本地方法' }}
                                        </el-tag>
                                    </div>
                                </el-tooltip>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <template #footer>
                <el-button type="primary" @click="stackTraceDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { getThreadList, getThreadStack, getThreadDump, threadStatics, checkDeadLock } from '@/api/thread';
import { ElMessage } from 'element-plus'
export default {
    data() {
        return {
            timer: null,
            monitorId: '',
            threads: [], // 用于存储线程列表
            dialogVisible: false, // 控制详情弹窗的显示
            threadDetails: null, // 当前选中的线程详情
            refreshInterval: 10000, // 默认刷新间隔为10秒
            refreshTimer: null, // 用于存储定时器
            stackTraceDialogVisible: false, // 控制堆栈信息弹窗的显示
            threadStackDialogVisible: false,
            currentStackTrace: [], // 当前选中线程的堆栈信息
            stackData: "", // 修改为字符串类型，用于存储点击打印线程堆栈时获取到的数据,
            threadStatics: null,
            loading: false,
            sortBy: '',
            sortOrder: '',
        };
    },
    mounted() {
        this.timer = setInterval(() => {
        }, 1000);
    },
    beforeDestroy() {
        // 在组件销毁前，清除定时器，避免内存泄漏
        if (this.timer) {
            clearInterval(this.timer); // 清除定时器
            this.timer = null;
        }
    },
    beforeRouteLeave(to, from, next) {
        // 当离开当前路由时清除定时器
        clearInterval(this.timer);
        next();
    },
    computed: {
        autoRefreshStatus() {
            if (this.refreshInterval === 0) return '自动刷新已关闭'
            return `自动刷新间隔: ${this.refreshInterval / 1000}秒`
        }
    },
    methods: {
        // 获取线程列表
        async fetchThreads(monitorId) {
            this.loading = true
            try {
                const [threadsResponse, staticsResponse] = await Promise.all([
                    getThreadList(monitorId),
                    threadStatics(monitorId)
                ])
                this.threads = this.sortThreads(threadsResponse.data)
                this.threadStatics = staticsResponse.data
            } catch (error) {
            } finally {
                this.loading = false
            }
        },
        printThreadStack() {
            getThreadDump(this.monitorId).then(response => {
                this.stackData = response.data;
                this.threadStackDialogVisible = true;
            }).catch(error => {
            });
        },
        fetchThreadStatics(monitorId) {
            threadStatics(monitorId).then(response => {
                this.threadStatics = response.data;
            }).catch(error => {
            });
        },

        async findDeadLock() {
            try {
                const response = await checkDeadLock(this.monitorId)
                const deadLocks = response.data

                // 重置所有线程的死锁状态
                this.threads.forEach(thread => {
                    thread.isDeadLock = deadLocks.includes(thread.threadId)
                })

                if (deadLocks.length > 0) {
                    ElMessage.warning(`检测到 ${deadLocks.length} 个线程存在死锁`)
                } else {
                    ElMessage.success('未检测到死锁')
                }
            } catch (error) {
                ElMessage.error('死锁检测失败：' + error.message)
            }
        },
        // 刷新线程列表
        refreshThreads() {
            this.fetchThreads(this.monitorId);
        },
        // 设置刷新间隔
        setRefreshInterval() {
            if (this.timer) {
                clearInterval(this.timer)
                this.timer = null
            }

            if (this.refreshInterval > 0) {
                this.timer = setInterval(() => {
                    this.refreshThreads()
                }, this.refreshInterval)
            }
        },
        // 显示堆栈信息弹窗
        showStackTraceDialog(row) {
            getThreadStack({ monitorId: this.monitorId, threadId: row.threadId }).then(response => {
                this.currentStackTrace = response.data;
                this.stackTraceDialogVisible = true;
            }).catch(error => {
                // 移除 console.error
            });
        },
        // 格式化时间显示
        formatTime(ms) {
            if (!ms) return '0'
            if (ms < 1000) return ms + 'ms'
            const seconds = Math.floor(ms / 1000)
            if (seconds < 60) return seconds + 's'
            const minutes = Math.floor(seconds / 60)
            return minutes + 'm ' + (seconds % 60) + 's'
        },

        // 获取线程状态对应的标签类型
        getThreadStateType(state) {
            const stateMap = {
                RUNNABLE: 'success',
                BLOCKED: 'danger',
                WAITING: 'warning',
                TIMED_WAITING: 'info',
                TERMINATED: 'info',
                NEW: 'primary'
            }
            return stateMap[state] || ''
        },

        // 处理表格排序
        handleSortChange({ prop, order }) {
            this.sortBy = prop
            this.sortOrder = order
            this.threads = this.sortThreads(this.threads)
        },

        // 排序线程列表
        sortThreads(threads) {
            if (!this.sortBy || !this.sortOrder) return threads

            return [...threads].sort((a, b) => {
                const factor = this.sortOrder === 'ascending' ? 1 : -1
                if (a[this.sortBy] < b[this.sortBy]) return -1 * factor
                if (a[this.sortBy] > b[this.sortBy]) return 1 * factor
                return 0
            })
        },
    },
    created() {
        let monitorId = this.$route.query.monitorId || this.$store.state.monitorId;
        this.monitorId = monitorId;
        this.fetchThreads(monitorId);
    },
    watch: {
        '$route'(to, from) {
            let monitorId = to.query.monitorId || this.$store.state.monitorId;
            this.monitorId = monitorId;
            this.fetchThreads(monitorId);
        }
    }
};
</script>

<style scoped>
/* 移除原有的 panel-info 相关样式，添加新的样式 */
.thread-info-card {
    margin: 20px;
    transition: all 0.3s ease;
}

.thread-info-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
}

:deep(.el-descriptions__label) {
    width: 120px;
    color: #606266;
    font-weight: 500;
}

:deep(.el-descriptions__content) {
    padding: 12px 16px;
}

:deep(.el-descriptions__body) {
    background-color: #ffffff;
}

:deep(.el-descriptions__cell) {
    padding: 16px !important;
}

:deep(.el-statistic__number) {
    font-size: 20px !important;
    font-weight: 600;
    color: #409EFF;
}

:deep(.el-statistic__suffix) {
    font-size: 14px;
    margin-left: 4px;
    color: #909399;
}

.btn-class {
    padding-left: 10px;
}

.container {
    /* padding: 20px; */
}

.thread-list {
    background-color: #f9f9f9;
    /* padding: 15px; */
    margin: 10px;
    /* margin-bottom: 20px; */
    /* 与下方元素隔开一定距离 */
    border-radius: 8px;
    /* 增加圆角，与卡片风格统一 */
}

.operation-bar {
    padding: 10px;
    /* margin-left: 10px; */
    /* margin:0, 0,0 10px; */
}


.el-table {
    font-size: 14px;
    /* 调整字体大小 */
    color: #333;
    /* 表头文字颜色 */
}

.el-table th {
    text-align: left;
    /* 表头文字左对齐 */
    background-color: #f0f0f0;
    /* 表头背景色 */
}

.el-table tr:hover {
    background-color: #f5f5f5;
    /* 鼠标悬停行的背景色 */
}

.stack-data {
    height: 60vh;
    overflow-y: scroll;
    /* 以下是新增或修改的样式 */
    font-family: "Consolas", "Courier New", monospace;
    /* 设置等宽字体 */
    color: #abb2bf;
    /* 代码文字颜色，可按需调整 */
    white-space: pre-wrap;
}

/* 添加新的样式 */
.refresh-status {
    color: #606266;
    font-size: 14px;
    line-height: 32px;
}

.el-tag {
    margin-right: 5px;
}

/* 改进堆栈信息显示样式 */
.stack-data {
    height: 60vh;
    overflow-y: auto;
    padding: 15px;
    background-color: #1e1e1e;
    border-radius: 4px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
}

/* 添加响应式布局支持 */
@media screen and (max-width: 768px) {
    .operation-bar {
        flex-direction: column;
    }

    .operation-bar .el-col {
        margin-bottom: 10px;
    }
}

/* 更新堆栈信息显示样式 */
.stack-dialog :deep(.el-dialog__body) {
    padding: 0;
}

.stack-data {
    height: 70vh;
    overflow-y: auto;
    background-color: #282c34;
    border-radius: 8px;
    margin: 0;
    padding: 20px;
}

.stack-data pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.stack-data code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #abb2bf;
}

/* 自定义滚动条样式 */
.stack-data::-webkit-scrollbar {
    width: 8px;
}

.stack-data::-webkit-scrollbar-track {
    background: #21252b;
    border-radius: 4px;
}

.stack-data::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
}

.stack-data::-webkit-scrollbar-thumb:hover {
    background: #606770;
}

.stack-trace-dialog :deep(.el-dialog__body) {
    padding: 20px;
}

.stack-trace-container {
    width: 100%;
}

.stack-trace-row {
    width: 100%;
}

.stack-info {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    overflow: hidden;
}

.line-number {
    min-width: 100px;
    color: #606266;
}

.class-name {
    color: #409EFF;
    flex: 1;
}

.method-name {
    color: #67C23A;
    margin-right: 8px;
}

.text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 自定义滚动条样式 */
.stack-trace-container :deep(.el-table__body-wrapper::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
}

.stack-trace-container :deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
    background: #f0f2f5;
    border-radius: 4px;
}

.stack-trace-container :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
    background: #909399;
    border-radius: 4px;
}

.stack-trace-container :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
    background: #606266;
}

.method-signature {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.class-name {
    color: #409EFF;
}

.method-name {
    color: #67C23A;
}
</style>