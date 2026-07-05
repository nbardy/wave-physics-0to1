import { useParams, Link } from 'react-router-dom'
import { lessonById } from '../lessons/registry'

export default function LessonView() {
  const { id } = useParams<{ id: string }>()
  const lesson = id ? lessonById(id) : undefined

  if (!lesson) {
    return (
      <div className="prose lesson-not-found">
        <h1>Lesson not found</h1>
        <p>
          No lesson with id “{id}”. <Link to="/">Back to the curriculum.</Link>
        </p>
      </div>
    )
  }

  const { Content } = lesson
  return (
    <article className="prose lesson">
      <Content />
    </article>
  )
}
