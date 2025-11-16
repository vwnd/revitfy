import { Hono } from 'hono'
const app = new Hono()

app.get('/api/', (c) => c.json({ name: 'Hono!' }))

export default app