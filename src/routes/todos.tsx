import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@/utils/supabase/server'

const fetchTodos = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = createClient()
    const { data: todos, error } = await supabase.from('todos').select()
    
    if (error) {
      throw new Error(error.message)
    }

    return todos
  })

export const Route = createFileRoute('/todos')({
  component: TodosPage,
  loader: () => fetchTodos(),
})

function TodosPage() {
  const todos = Route.useLoaderData()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Todos</h1>
      <ul>
        {todos?.map((todo: any) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </div>
  )
}
