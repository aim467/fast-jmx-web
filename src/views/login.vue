<template>
  <div class="login-container">
    <!-- 动态粒子背景 -->
    <canvas id="canvas" ref="canvasRef" class="particle-canvas"></canvas>

    <!-- 左侧品牌区 -->
    <div class="brand-panel">
      <div class="brand-content">
        <div class="brand-logo-wrap">
          <img src="@/assets/icon/logo.png" alt="Logo" class="brand-logo">
        </div>
        <h1 class="brand-title">Fast-JMX</h1>
        <p class="brand-subtitle">实时监控 &middot; 智能诊断 &middot; 全链路追踪</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon :size="20"><Monitor /></el-icon>
            <span>JVM 运行时监控</span>
          </div>
          <div class="feature-item">
            <el-icon :size="20"><Connection /></el-icon>
            <span>线程与内存分析</span>
          </div>
          <div class="feature-item">
            <el-icon :size="20"><Management /></el-icon>
            <span>MBean 动态管理</span>
          </div>
        </div>
      </div>
      <div class="brand-footer">Fast-JMX &copy; 2026</div>
    </div>

    <!-- 右侧登录区 -->
    <div class="login-panel">
      <div class="login-box">
        <div class="login-header">
          <h2>欢迎回来</h2>
          <p>请登录您的账号以继续</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          label-position="top"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username" label="用户名">
            <el-input
              v-model.trim="loginForm.username"
              placeholder="请输入用户名"
              clearable
              :disabled="loading"
              tabindex="1"
              size="large"
              prefix-icon="User"
              @keyup.enter="$refs.passwordInput?.focus()"
            />
          </el-form-item>

          <el-form-item prop="password" label="密码">
            <el-input
              ref="passwordInput"
              v-model.trim="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
              :disabled="loading"
              tabindex="2"
              size="large"
              prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item class="login-action">
            <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
              tabindex="3"
              size="large"
            >
              <span v-if="!loading">登 录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { getLogin } from '@/api/api'

export default {
  name: 'Login',

  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loading: false,
      animationFrame: null,
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ]
      }
    }
  },

  methods: {
    handleLogin() {
      if (!this.$refs.loginFormRef) return

      this.$refs.loginFormRef.validate(valid => {
        if (valid) {
          this.loading = true
          getLogin(this.loginForm.username, this.loginForm.password)
            .then(res => {
              if (res.code === 200) {
                this.$store.commit("setToken", res.data)
                this.$message.success('登录成功')
                const redirect = this.$route.query.redirect
                this.$router.push(redirect || '/')
              } else {
              }
            })
            .catch((error) => {
            })
            .finally(() => {
              this.loading = false
            })
        }
      })
    },

    initBackground() {
      const canvas = this.$refs.canvasRef
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      let particles = []

      const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        initParticles()
      }

      const initParticles = () => {
        particles = []
        const particleCount = 80

        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: Math.random() * 0.6 - 0.3,
            speedY: Math.random() * 0.6 - 0.3,
            opacity: Math.random() * 0.5 + 0.2
          })
        }
      }

      const drawParticles = () => {
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 绘制粒子之间的连线
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 150) {
              ctx.beginPath()
              ctx.strokeStyle = `rgba(30, 128, 255, ${0.12 * (1 - dist / 150)})`
              ctx.lineWidth = 0.5
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.stroke()
            }
          }
        }

        // 绘制粒子
        particles.forEach((particle) => {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(30, 128, 255, ${particle.opacity})`
          ctx.fill()

          particle.x += particle.speedX
          particle.y += particle.speedY

          if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
          if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1
        })

        this.animationFrame = requestAnimationFrame(drawParticles)
      }

      window.addEventListener('resize', resize)
      resize()
      drawParticles()

      this.cleanupResize = () => {
        window.removeEventListener('resize', resize)
      }
    }
  },

  mounted() {
    this.initBackground()
  },

  beforeDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    if (this.cleanupResize) {
      this.cleanupResize()
    }
  }
}
</script>

<style scoped>
/* ========== 布局容器 ========== */
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

.particle-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ========== 左侧品牌面板 ========== */
.brand-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
  padding: 60px 48px;
  background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #1e80ff 100%);
}

.brand-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
}

.brand-logo-wrap {
  width: 88px;
  height: 88px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.brand-logo {
  width: 56px;
  height: auto;
  object-fit: contain;
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2px;
  margin-bottom: 12px;
  text-shadow: 0 2px 12px rgba(30, 128, 255, 0.4);
}

.brand-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 3px;
  margin-bottom: 48px;
  font-weight: 300;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateX(4px);
}

.feature-item .el-icon {
  color: #93c5fd;
}

.brand-footer {
  position: absolute;
  bottom: 32px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  letter-spacing: 1px;
}

/* ========== 右侧登录面板 ========== */
.login-panel {
  width: 520px;
  min-width: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  background: #ffffff;
  padding: 40px;
}

.login-box {
  width: 100%;
  max-width: 380px;
}

.login-header {
  margin-bottom: 36px;
}

.login-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.login-header p {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 400;
}

/* ========== 表单样式 ========== */
.login-form {
  width: 100%;
}

:deep(.el-form-item__label) {
  color: #374151;
  font-weight: 500;
  font-size: 13px;
  padding-bottom: 6px;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e5e7eb inset;
  padding: 4px 12px;
  transition: all 0.25s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #1e80ff inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1e80ff inset, 0 0 0 3px rgba(30, 128, 255, 0.15);
}

:deep(.el-input__inner) {
  font-size: 14px;
}

:deep(.el-input__prefix .el-icon) {
  color: #9ca3af;
  font-size: 16px;
}

.login-action {
  margin-top: 8px;
}

.login-button {
  width: 100%;
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #1e80ff 0%, #2563eb 100%);
  box-shadow: 0 4px 14px rgba(30, 128, 255, 0.35);
  transition: all 0.3s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e80ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(30, 128, 255, 0.45);
}

.login-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(30, 128, 255, 0.3);
}

/* ========== 响应式 ========== */
@media screen and (max-width: 960px) {
  .login-container {
    flex-direction: column;
  }

  .brand-panel {
    flex: none;
    width: 100%;
    padding: 40px 24px 32px;
    border-bottom-right-radius: 32px;
  }

  .brand-content {
    max-width: 100%;
  }

  .brand-title {
    font-size: 26px;
  }

  .brand-subtitle {
    margin-bottom: 24px;
  }

  .brand-features {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .feature-item {
    padding: 8px 14px;
    font-size: 12px;
  }

  .brand-footer {
    display: none;
  }

  .login-panel {
    width: 100%;
    min-width: unset;
    flex: 1;
    padding: 24px;
  }

  .login-box {
    max-width: 400px;
  }
}

@media screen and (max-width: 480px) {
  .brand-panel {
    padding: 28px 16px 20px;
  }

  .brand-logo-wrap {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    margin-bottom: 16px;
  }

  .brand-logo {
    width: 40px;
  }

  .brand-title {
    font-size: 22px;
  }

  .brand-subtitle {
    font-size: 12px;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }

  .feature-item {
    padding: 6px 10px;
    font-size: 11px;
  }

  .login-panel {
    padding: 16px;
  }

  .login-header h2 {
    font-size: 22px;
  }

  .login-header {
    margin-bottom: 24px;
  }
}
</style>