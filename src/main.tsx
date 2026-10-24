import ReactDOM from 'react-dom/client'
import { App } from './App'
// @ts-expect-error CSS side-effect imports are handled by the bundler.
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Build Binder root element was not found.')
}

ReactDOM.createRoot(rootElement).render(<App />)
