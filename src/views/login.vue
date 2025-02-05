<template>
  <div class="login-container">
    <!-- 动态背景 -->
    <div class="background">
      <canvas id="canvas" ref="canvasRef"></canvas>
    </div>
    
    <!-- 登录卡片 -->
    <div class="login-box">
      <el-card class="login-card" shadow="always">
        <template #header>
          <div class="login-header">
            <div class="logo-container">
              <img src="@/assets/icon/logo.png" alt="Logo" class="logo">
              <h2>Fast-Jmx 监控系统</h2>
            </div>
          </div>
        </template>
        
        <el-form 
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          label-position="top"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginForm.username"
              placeholder="请输入用户名"
              clearable
              :disabled="loading"
              tabindex="1"
              @keyup.enter="$refs.passwordInput?.focus()"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              ref="passwordInput"
              v-model.trim="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
              :disabled="loading"
              tabindex="2"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
              tabindex="3"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
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
        const particleCount = 100
        
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedX: Math.random() * 2 - 1,
            speedY: Math.random() * 2 - 1
          })
        }
      }

      const drawParticles = () => {
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        
        particles.forEach((particle) => {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
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

      // 保存 resize 事件清理函数
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
.login-container {
  height: 100vh;
  width: 100vw;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  overflow: hidden;
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

#canvas {
  width: 100%;
  height: 100%;
}

.login-box {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  margin: 0 20px;
}

.login-card {
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  width: 100px;
  height: 70px;
  margin-bottom: 16px;
}

.login-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

:deep(.el-form-item__label) {
  color: #2c3e50;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border: none;
  margin-top: 20px;
}

.login-button:hover {
  background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media screen and (max-width: 480px) {
  .login-box {
    margin: 0 16px;
  }
  
  .login-header h2 {
    font-size: 20px;
  }
  
  .logo {
    width: 60px;
    height: 60px;
  }
}
</style>