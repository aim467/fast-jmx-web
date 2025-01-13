<template>
    <div class="container">
        <div class="content-wrapper">
            <!-- Left panel -->
            <div class="mbean-list">
                <el-card class="left-panel" shadow="hover">
                    <div class="panel-header">
                        <h3>MBean列表</h3>
                        <div class="button-group">
                            <el-button type="primary" size="small" plain @click="setAllFold">
                                <el-icon><Fold /></el-icon> 折叠
                            </el-button>
                            <el-button type="primary" size="small" plain @click="setAllExpand">
                                <el-icon><Expand /></el-icon> 展开
                            </el-button>
                            <el-button type="primary" size="small" plain @click="refreshMBean">
                                刷新
                            </el-button>
                        </div>
                    </div>
                    <el-divider></el-divider>
                    <div class="tree-container" style="max-height: calc(100vh - 200px); overflow-y: auto;">
                        <el-tree ref="mbeanTree" 
                            :data="mbeanTree" 
                            :props="defaultProps"
                            highlight-current
                            @node-click="handleNodeClick"
                            :default-expand-all="false">
                        </el-tree>
                    </div>
                </el-card>
            </div>

            <!-- Right panel -->
            <div class="mbean-detail">
                <el-card v-if="selectedNode" class="right-panel" shadow="hover">
                    <div class="panel-header">
                        <h3>{{ selectedNode.name }} - 详细信息</h3>
                    </div>
                    <el-divider></el-divider>
                    <div style="max-height: calc(100vh - 200px); overflow-y: auto;">
                        <el-table :data="filteredAttributes" 
                            style="width: 100%"
                            :header-cell-style="{ background: '#f5f7fa' }">
                            <el-table-column prop="key" label="属性名" width="200" />
                            <el-table-column label="属性值">
                                <template #default="{ row }">
                                    <template v-if="isComplexValue(row.value)">
                                        <el-button type="primary" link @click="openDialog(row.value)">
                                            查看详情 <el-icon><ArrowRight /></el-icon>
                                        </el-button>
                                    </template>
                                    <template v-else>
                                        <el-tooltip :content="row.value" placement="top" effect="light">
                                            <div class="attribute-value" v-html="row.value"></div>
                                        </el-tooltip>
                                    </template>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-card>
                <el-empty v-else description="请选择左侧MBean节点查看详情"></el-empty>
            </div>
        </div>

        <!-- Dialog -->
        <el-dialog v-model="dialogVisible" 
            title="属性详情"
            width="80%"
            destroy-on-close>
            <vue-json-pretty 
                :data="dialogContent" 
                :deep="2"
                :show-double-quotes="true"
                :show-length="true"
                :show-line="true"
                :show-icon="true"
                :highlight-selected-node="true"
                class="json-viewer"/>
            <template #footer>
                <el-button @click="dialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { mbeanList, mbeanDetail } from '@/api/mbean';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { ArrowRight, Fold, Expand } from '@element-plus/icons-vue'

export default {
    components: {
        VueJsonPretty,
        ArrowRight,
        Fold,
        Expand
    },
    data() {
        return {
            monitorId: '',
            mbeanTree: [],
            defaultProps: {
                children: 'nodes',
                label: 'name',
                className: (node) => (node.nodes ? 'is-parent' : 'is-child'), // 这里根据节点类型添加类
            },
            selectedNode: null,
            filteredAttributes: null,
            dialogVisible: false,  // 弹窗是否可见
            dialogContent: null,   // 弹窗显示的内容
        }
    },
    methods: {
        isComplexValue(value) {
            return typeof value === 'object' && value !== null;
        },
        openDialog(value) {
            this.dialogContent = value;
            this.dialogVisible = true;
        },
        refreshMBean() {
            this.getMBeanByMointor(this.monitorId);
        },
        // 折叠所有节点
        setAllFold() {
            const allNodes = this.$refs.mbeanTree.store._getAllNodes();
            allNodes.forEach(node => node.expanded = false);
        },
        // 展开所有节点
        setAllExpand() {
            const allNodes = this.$refs.mbeanTree.store._getAllNodes();
            allNodes.forEach(node => node.expanded = true);
        },
        handleNodeClick(nodeData) {
            if (!nodeData.nodes || nodeData.nodes.length === 0) {
                this.selectedNode = nodeData; // 选中节点数
                this.fetchAttributes(nodeData);
            }
        },
        getMBeanByMointor(monitorId) {
            mbeanList(monitorId).then(res => {
                this.mbeanTree = res.data;
            }).catch(error => {
                console.log(error);
            });
        },
        fetchAttributes(nodeData) {
            const mbeanName = nodeData.canonicalName;
            mbeanDetail({ "monitorId": this.monitorId, mbeanName }).then(res => {
                this.filteredAttributes = Object.entries(res.data).map(([key, value]) => ({ key, value }));
            }).catch(error => {
                console.log(error);
            });
        }
    },
    created() {
        this.monitorId = this.$route.query.monitorId || this.$store.state.monitorId;
        this.getMBeanByMointor(this.monitorId);
    },
    watch: {
        '$route'(to, from) {
            this.monitorId = to.query.monitorId || this.$store.state.monitorId;
            this.getMBeanByMointor(this.monitorId);
        }
    }
}
</script>

<style scoped>
.container {
    height: calc(100vh - 100px);
    padding: 20px;
    background-color: #f5f7fa;
}

.content-wrapper {
    display: flex;
    gap: 20px;
    height: 100%;
}

.mbean-list {
    width: 30%;
    min-width: 300px;
}

.mbean-detail {
    flex: 1;
    min-width: 0; /* Prevents flex item from overflowing */
}

.left-panel, .right-panel {
    height: 100%;
    border-radius: 8px;
    border: none;
    transition: all 0.3s ease;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
}

.panel-header h3 {
    margin: 0;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
}

.button-group {
    display: flex;
    gap: 8px;
}

.tree-container {
    height: calc(100% - 80px);
    overflow-y: auto;
    padding: 10px;
}

.attribute-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 600px;
    padding: 4px 0;
    color: #606266;
}

.json-viewer {
    max-height: 400px;
    overflow-y: auto;
}

/* Tree node styles */
:deep(.el-tree-node__content) {
    height: 36px;
    border-radius: 4px;
}

:deep(.el-tree-node__content:hover) {
    background-color: #ecf5ff;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: #e6f1fc;
    color: #409eff;
}

/* Scrollbar styles */
.tree-container::-webkit-scrollbar {
    width: 6px;
}

.tree-container::-webkit-scrollbar-thumb {
    background-color: #dcdfe6;
    border-radius: 3px;
}

.tree-container::-webkit-scrollbar-track {
    background-color: #f5f7fa;
}

/* Table styles */
:deep(.el-table) {
    --el-table-border-color: #ebeef5;
    --el-table-header-bg-color: #f5f7fa;
}

:deep(.el-table th) {
    font-weight: 600;
}
</style>
