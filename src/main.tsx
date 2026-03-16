import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const shell = document.getElementById('app-prerender-shell')
const root = createRoot(document.getElementById('root')!)

root.render(<App />)

if (shell) {
	requestAnimationFrame(() => {
		shell.remove()
	})
}
