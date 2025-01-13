<template>
  <div class="memory-usage-container">
    <!-- 控制面板 -->
    <div class="control-panel">
      <el-row :gutter="20" align="middle">
        <el-col :span="6">
          <el-select 
            v-model="refreshInterval" 
            placeholder="刷新频率"
            class="refresh-select"
          >
            <el-option label="5秒" :value="5000" />
            <el-option label="10秒" :value="10000" />
            <el-option label="30秒" :value="30000" />
            <el-option label="手动刷新" :value="0" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button 
            type="primary" 
            :icon="Refresh"
            :loading="isLoading"
            @click="manualRefresh"
          >
            刷新数据
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 内存使用情况卡片 -->
    <el-card class="memory-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>堆内存使用情况</span>
          <el-tag type="info">最后更新: {{ lastUpdateTime }}</el-tag>
        </div>
      </template>
      
      <div v-for="item in memoryData" :key="item.poolName" class="memory-item">
        <div class="memory-info">
          <div class="pool-name">{{ item.poolName }}</div>
          <div class="memory-stats">
            <span>已用: {{ formatMemory(item.used) }}</span>
            <span>总量: {{ formatMemory(item.max === -1 ? item.committed : item.max) }}</span>
          </div>
        </div>
        
        <el-progress 
          :percentage="calculateUsagePercentage(item.used, item.max === -1 ? item.committed : item.max)"
          :status="getUsageStatus(item.used, item.max === -1 ? item.committed : item.max)"
          :stroke-width="20"
          :format="(percentage) => percentage + '%'"
        />
        
        <div class="detail-stats">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="初始大小">{{ formatMemory(item.init) }}</el-descriptions-item>
            <el-descriptions-item label="已提交">{{ formatMemory(item.committed) }}</el-descriptions-item>
            <el-descriptions-item label="已使用">{{ formatMemory(item.used) }}</el-descriptions-item>
            <el-descriptions-item label="最大值">{{ item.max === -1 ? '无限制' : formatMemory(item.max) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { getMemoryInfo } from '@/api/memory'
import dayjs from 'dayjs'
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'Memory',
  components: {
    Refresh
  },
  data() {
    return {
      memoryData: [],
      isLoading: false,
      refreshInterval: 5000,
      timer: null,
      lastUpdateTime: '-'
    }
  },
  mounted() {
    this.fetchData()
    this.startAutoRefresh()
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  watch: {
    refreshInterval(newVal) {
      this.stopAutoRefresh()
      if (newVal > 0) {
        this.startAutoRefresh()
      }
    }
  },
  methods: {
    startAutoRefresh() {
      if (this.refreshInterval > 0) {
        this.timer = setInterval(() => {
          this.fetchData()
        }, this.refreshInterval)
      }
    },
    stopAutoRefresh() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    async manualRefresh() {
      this.isLoading = true
      await this.fetchData()
      this.isLoading = false
    },
    async fetchData() {
      try {
        let monitorId = this.$route.query.monitorId || this.$store.state.monitorId
        const response = await getMemoryInfo(monitorId)
        this.memoryData = response.data
        this.lastUpdateTime = dayjs().format('HH:mm:ss')
      } catch (error) {
      }
    },
    formatMemory(value) {
      if (value === -1) return '无限制'
      if (value === 0) return '0 MB'
      return `${(value / 1024 / 1024).toFixed(2)} MB`
    },
    calculateUsagePercentage(used, total) {
      if (total <= 0) return 0
      return Math.round((used / total) * 100)
    },
    getUsageStatus(used, total) {
      const percentage = this.calculateUsagePercentage(used, total)
      if (percentage >= 90) return 'exception'
      if (percentage >= 70) return 'warning'
      return 'success'
    }
  }
}
</script>

<style scoped>
.memory-usage-container {
  padding: 20px;
}

.control-panel {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.refresh-select {
  width: 100%;
}

.memory-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.memory-item {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.memory-item:last-child {
  border-bottom: none;
}

.memory-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pool-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.memory-stats {
  display: flex;
  gap: 20px;
  color: #606266;
}

.detail-stats {
  margin-top: 15px;
}

:deep(.el-progress-bar__inner) {
  transition: width 0.6s ease;
}

:deep(.el-descriptions__cell) {
  padding: 8px !important;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

@media (max-width: 768px) {
  .memory-usage-container {
    padding: 10px;
  }
  
  .memory-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .memory-stats {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
