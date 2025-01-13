<template>
  <div class="basic-info">

    <!-- 刷新按钮 -->
    <div class="refresh-container">
      <el-button 
        class="refresh-button" 
        type="primary" 
        plain
        @click="refreshData"
      >
        <el-icon><Refresh /></el-icon>
        刷新系统信息
      </el-button>
    </div>

    <el-collapse v-model="activeNames">
      <!-- 操作系统信息展示 -->
      <el-collapse-item title="操作系统信息" name="1">
        <el-descriptions :column="2" border size="large">
          <el-descriptions-item label="系统名称">{{ operatingSystemInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="系统版本">{{ operatingSystemInfo.version }}</el-descriptions-item>
          <el-descriptions-item label="系统架构">{{ operatingSystemInfo.arch }}</el-descriptions-item>
          <el-descriptions-item label="处理器数量">{{ operatingSystemInfo.availableProcessors }}</el-descriptions-item>
          <el-descriptions-item label="系统CPU负载">{{ formatPercentage(operatingSystemInfo.systemCpuLoad)
            }}</el-descriptions-item>
          <el-descriptions-item label="进程CPU负载">{{ formatPercentage(operatingSystemInfo.processCpuLoad)
            }}</el-descriptions-item>
          <el-descriptions-item label="进程CPU时间">{{ formatCpuTime(operatingSystemInfo.processCpuTime)
            }}</el-descriptions-item>
          <el-descriptions-item label="系统平均负载">{{ operatingSystemInfo.systemLoadAverage }}</el-descriptions-item>
          <el-descriptions-item label="已提交虚拟内存">{{ formatBytes(operatingSystemInfo.committedVirtualMemorySize) }}</el-descriptions-item>
          
        </el-descriptions>

        <!-- 内存使用情况 -->
        <div class="sub-section">
          <h4>系统内存使用情况</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-progress :percentage="calculateMemoryPercentage(
                stringToLong(operatingSystemInfo.totalPhysicalMemorySize) - stringToLong(operatingSystemInfo.freePhysicalMemorySize),
                stringToLong(operatingSystemInfo.totalPhysicalMemorySize)
              )" :format="format" type="dashboard" :width="150">
                <template #default="{ percentage }">
                  <div class="progress-label">
                    <div>物理内存</div>
                    <div>{{ formatBytes(stringToLong(operatingSystemInfo.totalPhysicalMemorySize) -
                      stringToLong(operatingSystemInfo.freePhysicalMemorySize)) }} / {{
                        formatBytes(stringToLong(operatingSystemInfo.totalPhysicalMemorySize)) }}</div>
                  </div>
                </template>
              </el-progress>
            </el-col>
            <el-col :span="12">
              <el-progress :percentage="calculateMemoryPercentage(
                stringToLong(operatingSystemInfo.totalSwapSpaceSize) - stringToLong(operatingSystemInfo.freeSwapSpaceSize),
                stringToLong(operatingSystemInfo.totalSwapSpaceSize)
              )" :format="format" type="dashboard" :width="150">
                <template #default="{ percentage }">
                  <div class="progress-label">
                    <div>交换空间</div>
                    <div>{{ formatBytes(stringToLong(operatingSystemInfo.totalSwapSpaceSize) - stringToLong(operatingSystemInfo.freeSwapSpaceSize))
                      }} / {{ formatBytes(stringToLong(operatingSystemInfo.totalSwapSpaceSize)) }}</div>
                  </div>
                </template>
              </el-progress>
            </el-col>
          </el-row>
        </div>
      </el-collapse-item>

      <!-- JVM信息展示 -->
      <el-collapse-item title="JVM运行时信息" name="2">
        <el-descriptions :column="2" border size="large">
          <el-descriptions-item label="JVM名称">{{ jvmRuntimeInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="类路径">
            <el-tooltip :content="jvmRuntimeInfo.classPath" placement="top" :hide-after="0">
              <span class="truncate-text">{{ jvmRuntimeInfo.classPath }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="库路径">
            <el-tooltip :content="jvmRuntimeInfo.libraryPath" placement="top" :hide-after="0">
              <span class="truncate-text">{{ jvmRuntimeInfo.libraryPath }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="输入参数">
            <el-popover placement="right" :width="400" trigger="hover">
              <template #reference>
                <el-tag size="small">查看详情</el-tag>
              </template>
              <div class="args-list">
                <div v-for="(arg, index) in jvmRuntimeInfo.inputArguments" :key="index">
                  {{ arg }}
                </div>
              </div>
            </el-popover>
          </el-descriptions-item>
          <el-descriptions-item label="系统属性">
            <el-collapse>
              <el-collapse-item title="查看系统属性">
                <div class="system-properties">
                  <div v-for="(value, key) in jvmRuntimeInfo.systemProperties" :key="key" class="property-item">
                    <span class="property-key">{{ key }}:</span>
                    <span class="property-value">{{ value }}</span>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-descriptions-item>
          <el-descriptions-item label="启动类路径">
            <el-tooltip :content="jvmRuntimeInfo.bootClassPath" placement="top" :hide-after="0">
              <span class="truncate-text">{{ jvmRuntimeInfo.bootClassPath }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="虚拟机名称">{{ jvmRuntimeInfo.vmName }}</el-descriptions-item>
          <el-descriptions-item label="虚拟机供应商">{{ jvmRuntimeInfo.vmVendor }}</el-descriptions-item>
          <el-descriptions-item label="虚拟机版本">{{ jvmRuntimeInfo.vmVersion }}</el-descriptions-item>
          <el-descriptions-item label="规范名称">{{ jvmRuntimeInfo.specName }}</el-descriptions-item>
          <el-descriptions-item label="规范供应商">{{ jvmRuntimeInfo.specVendor }}</el-descriptions-item>
          <el-descriptions-item label="规范版本">{{ jvmRuntimeInfo.specVersion }}</el-descriptions-item>
          <el-descriptions-item label="启动时间">{{ formatTime(jvmRuntimeInfo.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="运行时长">{{ formatUptime(jvmRuntimeInfo.uptime) }}</el-descriptions-item>
        </el-descriptions>

        <!-- JVM 内存信息 -->
        <div class="sub-section">
          <h4>JVM内存使用情况</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-progress
                :percentage="calculateMemoryPercentage(memoryInfo.heapMemoryUsage.used, memoryInfo.heapMemoryUsage.max)"
                :format="format" type="dashboard" :width="150">
                <template #default="{ percentage }">
                  <div class="progress-label">
                    <div>堆内存</div>
                    <div>{{ formatBytes(memoryInfo.heapMemoryUsage.used) }} / {{
                      formatBytes(memoryInfo.heapMemoryUsage.max) }}</div>
                  </div>
                </template>
              </el-progress>
            </el-col>
            <el-col :span="12">
              <el-progress
                :percentage="calculateMemoryPercentage(memoryInfo.nonHeapMemoryUsage.used, memoryInfo.nonHeapMemoryUsage.committed)"
                :format="format" type="dashboard" :width="150">
                <template #default="{ percentage }">
                  <div class="progress-label">
                    <div>非堆内存</div>
                    <div>{{ formatBytes(memoryInfo.nonHeapMemoryUsage.used) }} / {{
                      formatBytes(memoryInfo.nonHeapMemoryUsage.committed) }}</div>
                  </div>
                </template>
              </el-progress>
            </el-col>
          </el-row>
        </div>
      </el-collapse-item>

      <!-- 类加载信息展示 -->
      <el-collapse-item title="类加载信息" name="3">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>类加载统计</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">已加载类数</div>
                <div class="stat-value">{{ classLoaderInfo.loadedClassCount }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">总加载类数</div>
                <div class="stat-value">{{ classLoaderInfo.totalLoadedClassCount }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">已卸载类数</div>
                <div class="stat-value">{{ classLoaderInfo.unloadedClassCount }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-collapse-item>

      <!-- 编译信息展示 -->
      <el-collapse-item title="编译信息" name="4">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="编译器名称">{{ compilationInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="总编译时间">{{ formatCompilationTime(compilationInfo.totalCompilationTime)
            }}</el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
import { getBasicInfo } from '@/api/api'
export default {
  name: 'Basic',
  data() {
    return {
      activeNames: ['1', '2', '3', '4'],
      operatingSystemInfo: {
        name: "Windows 11",
        arch: "amd64",
        availableProcessors: "12",
        committedVirtualMemorySize: "708186112",
        freePhysicalMemorySize: "5305028608",
        freeSwapSpaceSize: "7542538240",
        physicalMemoryUsagePercent: null,
        processCpuLoad: "4.8950566548201796E-5",
        processCpuTime: "1531250000",
        systemCpuLoad: "0.060857213271659605",
        systemLoadAverage: "-1.0",
        totalPhysicalMemorySize: "34095157248",
        usedPhysicalMemorySize: null,
        totalSwapSpaceSize: "62185578496",
        version: "10.0"
      },
      memoryInfo: {
        heapMemoryUsage: {
          poolName: null,
          init: 534773760,
          used: 48283944,
          committed: 534773760,
          max: 734003200,
          type: null
        },
        nonHeapMemoryUsage: {
          poolName: null,
          init: 7667712,
          used: 41851608,
          committed: 45875200,
          max: -1,
          type: null
        }
      },
      jvmRuntimeInfo: {
        bootClassPath: null,
        bootClassPathSupported: "false",
        classPath: "D:/Softwares/IntelliJ IDEA 2023.2.4/plugins/java/lib/jps-launcher.jar",
        inputArguments: [
          "-Xmx700m",
          "-Djava.awt.headless=true",
          "-Djna.boot.library.path=D:\\Softwares\\IntelliJ IDEA 2023.2.4/lib/jna/amd64",
          "-Djna.nosys=true",
          "-Djna.noclasspath=true",
          "-Dpreload.project.path=E:/sunrise/fast-jmx-api",
          "-Dpreload.config.path=C:/Users/root2z/AppData/Roaming/JetBrains/IntelliJIdea2024.1/options",
          "-Dexternal.project.config=C:\\Users\\root2z\\AppData\\Local\\JetBrains\\IntelliJIdea2024.1\\projects\\fast-jmx-api.53a37965\\external_build_system",
          "-Dcompile.parallel=false",
          "-Drebuild.on.dependency.change=true",
          "-Didea.IntToIntBtree.page.size=32768",
          "-Djdt.compiler.useSingleThread=true",
          "-Daether.connector.resumeDownloads=false",
          "-Dio.netty.initialSeedUniquifier=-6944331284634914058",
          "-Dfile.encoding=GBK",
          "-Duser.language=zh",
          "-Duser.country=CN",
          "-Didea.paths.selector=IntelliJIdea2024.1",
          "-Didea.home.path=D:/Softwares/IntelliJ IDEA 2023.2.4",
          "-Didea.config.path=C:/Users/root2z/AppData/Roaming/JetBrains/IntelliJIdea2024.1",
          "-Didea.plugins.path=C:/Users/root2z/AppData/Roaming/JetBrains/IntelliJIdea2024.1/plugins",
          "-Djps.log.dir=C:/Users/root2z/AppData/Local/JetBrains/IntelliJIdea2024.1/log/build-log",
          "-Djps.fallback.jdk.home=D:/Softwares/IntelliJ IDEA 2023.2.4/jbr",
          "-Djps.fallback.jdk.version=17.0.10",
          "-Dio.netty.noUnsafe=true",
          "-Djava.io.tmpdir=C:/Users/root2z/AppData/Local/JetBrains/IntelliJIdea2024.1/compile-server/fast-jmx-api_58248bc8/_temp_",
          "-Djps.backward.ref.index.builder=true",
          "-Dide.propagate.context=false"
        ],
        libraryPath: "C:\\Program Files\\OpenJDK\\jdk-11.0.17.8-hotspot\\bin;C:\\Windows\\Sun\\Java\\bin;C:\\Windows\\system32;C:\\Windows;C:\\Program Files\\Common Files\\Oracle\\Java\\javapath;C:\\Program Files (x86)\\Common Files\\Oracle\\Java\\javapath;D:\\DocumentTest\\chandao\\ZenTao\\zbox\\nssm\\win64;D:\\Softwares\\vm workstation\\bin\\;C:\\Program Files\\OpenJDK\\jdk-8.0.352.08-hotspot\\bin;C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\;C:\\Windows\\System32\\OpenSSH\\;C:\\Program Files\\TortoiseSVN\\bin;C:\\Program Files\\Bandizip\\;C:\\ProgramData\\chocolatey\\bin;C:\\Program Files\\Git\\cmd;D:\\Softwares\\apache-maven-3.8.6\\bin;C:\\Program Files\\dotnet\\;C:\\Program Files\\Go\\bin;D:\\Softwares\\ffmpeg\\bin;C:\\MinGWPosx\\bin;D:\\Softwares\\opencv\\build\\x64\\vc14\\bin;D:\\Softwares\\Anaconda3;D:\\Softwares\\Anaconda3\\Scripts;D:\\Softwares\\Anaconda3\\Library\\bin;C:\\Python27;C:\\Users\\root2z\\AppData\\Roaming\\nvm;C:\\Program Files\\nodejs;C:\\Users\\root2z\\AppData\\Local\\Microsoft\\WindowsApps;D:\\Softwares\\IntelliJ IDEA 2022.2.1\\bin;D:\\Softwares\\Microsoft VS Code\\bin;C:\\Users\\root2z\\AppData\\Local\\JetBrains\\Toolbo;D:\\Softwares\\bin;D:\\Softwares\\gradle\\bin;D:\\Softwares\\flutter\\bin;C:\\Program Files\\Redis\\;D:\\Softwares\\springboot-cli\\bin;C:\\Program Files\\Docker;C:\\Program Files\\python;C:\\Program Files\\python\\Scripts;D:\\Softwares\\BtSoft\\panel\\script;D:\\Softwares\\php-win;;C:\\Program Files\\Docker\\Docker\\resources\\bin;E:\\Software\\sniffnet\\;C:\\Users\\root2z\\AppData\\Local\\pnpm;C:\\Users\\root2z\\AppData\\Local\\Microsoft\\WindowsApps;D:\\Softwares\\IntelliJ IDEA 2022.2.1\\bin;C:\\Users\\root2z\\AppData\\Local\\JetBrains\\Toolbox\\scripts;C:\\Users\\root2z\\AppData\\Local\\Programs\\oh-my-posh\\bin;C:\\Users\\root2z\\go\\bin;%PyCharm%;C:\\Users\\root2z\\AppData\\Roaming\\nvm;C:\\Program Files\\nodejs;C:\\Users\\root2z\\AppData\\Local\\Microsoft\\WindowsApps;;D:\\Softwares\\IntelliJ IDEA 2023.2.4\\bin;;C:\\Users\\root2z\\AppData\\Local\\Programs\\Ollama;D:\\Softwares\\spring\\;%DevEco Studio%;C:\\Program Files\\mitmproxy\\bin;C:\\Users\\root2z\\AppData\\Roaming\\npm;E:\\Software\\Microsoft VS Code\\bin;.",
        managementSpecVersion: "2.0",
        name: "34004@matrix",
        specName: "Java Virtual Machine Specification",
        specVendor: "Oracle Corporation",
        specVersion: "11",
        startTime: "1736325196347",
        systemProperties: {
          "io.netty.processId": "240",
          "java.vm.version": "11.0.17+8-adhoc..jdk11u",
          "java.rmi.server.randomIDs": "true",
          "sun.io.unicode.encoding": "UnicodeLittle",
          "io.netty.machineId": "28:f0:76:ff:fe:16:65:0e",
          "java.class.version": "55.0"
        },
        uptime: "1962409",
        vmName: "OpenJDK 64-Bit Server VM",
        vmVendor: "OpenLogic",
        vmVersion: "11.0.17+8-adhoc..jdk11u"
      },
      classLoaderInfo: {
        loadedClassCount: 4623,
        totalLoadedClassCount: 4623,
        unloadedClassCount: 0
      },
      compilationInfo: {
        name: "HotSpot 64-Bit Tiered Compilers",
        totalCompilationTime: "2265"
      },
      monitorId: null
    }
  },
  created() {
    let monitorId = this.$route.query.monitorId || this.$store.state.monitorId;
    this.monitorId = monitorId;
    getBasicInfo(monitorId).then(res => {
      this.operatingSystemInfo = res.data.operatingSystemInfo
      this.memoryInfo = res.data.memoryInfo
      this.jvmRuntimeInfo = res.data.jvmRuntimeInfo
      this.classLoaderInfo = res.data.classLoaderInfo
      this.compilationInfo = res.data.compilationInfo
    })
  },
  watch: {
    '$route'(to, from) {
      let monitorId = to.query.monitorId || this.$store.state.monitorId;
      this.monitorId = monitorId;
      getBasicInfo(monitorId).then(res => {
        this.operatingSystemInfo = res.data.operatingSystemInfo
        this.memoryInfo = res.data.memoryInfo
        this.jvmRuntimeInfo = res.data.jvmRuntimeInfo
        this.classLoaderInfo = res.data.classLoaderInfo
        this.compilationInfo = res.data.compilationInfo
      })
    }
  },
  methods: {
    refreshData() {
      getBasicInfo(this.monitorId).then(res => {
        this.operatingSystemInfo = res.data.operatingSystemInfo
        this.memoryInfo = res.data.memoryInfo
        this.jvmRuntimeInfo = res.data.jvmRuntimeInfo
        this.classLoaderInfo = res.data.classLoaderInfo
        this.compilationInfo = res.data.compilationInfo
      })
    },
    formatTime(timestamp) {
      return new Date(parseInt(timestamp)).toLocaleString()
    },
    formatUptime(uptime) {
      const seconds = Math.floor(parseInt(uptime) / 1000)
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60
      return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`
    },
    formatBytes(bytes) {
      if (bytes === -1) return 'Unlimited'
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      if (bytes === 0) return '0 B'
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
      return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
    },
    formatPercentage(value) {
      return (value * 100).toFixed(2) + '%'
    },
    calculateMemoryPercentage(used, total) {
      console.log(used, total);
      if (total <= 0 || used < 0) {
        return 0
      }
      return Math.round((used / total) * 100)
    },
    format(percentage) {
      return percentage + '%'
    },
    formatCpuTime(time) {
      return (time / 1000000000).toFixed(2) + ' seconds'
    },
    formatCompilationTime(time) {
      return (time / 1000).toFixed(2) + ' seconds'
    },
    stringToLong(str) {
      return str ? parseInt(str, 10) : 0;
    }
  }
}
</script>

<style scoped>
.refresh-container {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
}

.basic-info {
  padding: 20px;
}

.sub-section {
  margin-top: 20px;
}

.sub-section h4 {
  margin-bottom: 20px;
  color: #606266;
}

.progress-label {
  text-align: center;
  font-size: 15px;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  color: #303133;
  font-weight: bold;
}

:deep(.el-progress__text) {
  min-width: 120px !important;
}

:deep(.el-descriptions__label) {
  width: 180px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.truncate-text {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.args-list {
  max-height: 400px;
  overflow-y: auto;
}

.args-list > div {
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.system-properties {
  max-height: 300px;
  overflow-y: auto;
}

.property-item {
  padding: 4px 0;
  display: flex;
  gap: 8px;
}

.property-key {
  color: #409EFF;
  font-weight: bold;
}

.property-value {
  word-break: break-all;
}
</style>