import { Routes, Route } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import Layout from './components/Layout'
import Home from './pages/Home'
import All from './pages/All'
import LessonView from './pages/LessonView'
import SeriesPage from './pages/SeriesPage'
import StackCheck from './pages/StackCheck'
import { Sim } from './components/Sim'
import { TeX } from './components/TeX'
import { C, Waypoint, Predict } from './components/Prose'

// Components made available to every lesson's MDX without an explicit import.
const mdxComponents = { Sim, TeX, C, Waypoint, Predict }

export default function App() {
  return (
    <MDXProvider components={mdxComponents}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/all" element={<All />} />
          <Route path="/lesson/:id" element={<LessonView />} />
          <Route path="/series/:id" element={<SeriesPage />} />
          <Route path="/stack-check" element={<StackCheck />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </MDXProvider>
  )
}
