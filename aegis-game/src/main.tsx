import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 注意：不使用 StrictMode —— 开发模式双执行 useEffect 会导致
// Phaser 实例在 boot/READY 间隙被销毁，触发内部 systemScene 崩溃
createRoot(document.getElementById('root')!).render(<App />)
