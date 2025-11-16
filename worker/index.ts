import { Hono } from 'hono'
const app = new Hono()

app.get('/api/', (c) => c.json({ name: 'Hono!' }))

app.get('/api/made-for-you', (c) => {
  const data = [
    {
      id: "1",
      name: "Structural Column - Wide Flange",
      category: "Structural Columns",
      usageCount: 1250,
    },
    {
      id: "2",
      name: "Office Desk - Rectangular",
      category: "Furniture",
      usageCount: 843,
    },
    {
      id: "3",
      name: "VAV Box - Standard",
      category: "Mechanical Equipment",
      usageCount: 567,
    },
    {
      id: "4",
      name: "Door - Single Swing",
      category: "Doors",
      usageCount: 2134,
    },
    {
      id: "5",
      name: "Window - Fixed",
      category: "Windows",
      usageCount: 1876,
    },
    {
      id: "6",
      name: "Electrical Panel - 480V",
      category: "Electrical Equipment",
      usageCount: 234,
    },
    {
      id: "7",
      name: "Toilet - Wall Mounted",
      category: "Plumbing Fixtures",
      usageCount: 456,
    },
    {
      id: "8",
      name: "LED Fixture - Recessed",
      category: "Lighting",
      usageCount: 3421,
    },
  ];


  return c.json({
    data: data.slice(0, 5)
  })
})

app.get('/api/recently-used', (c) => {
  const data = [
    {
      id: "1",
      name: "Structural Column - Wide Flange",
      category: "Structural Columns",
      usageCount: 1250,
    },
    {
      id: "2",
      name: "Office Desk - Rectangular",
      category: "Furniture",
      usageCount: 843,
    },
    {
      id: "3",
      name: "VAV Box - Standard",
      category: "Mechanical Equipment",
      usageCount: 567,
    },
    {
      id: "4",
      name: "Door - Single Swing",
      category: "Doors",
      usageCount: 2134,
    },
    {
      id: "5",
      name: "Window - Fixed",
      category: "Windows",
      usageCount: 1876,
    },
    {
      id: "6",
      name: "Electrical Panel - 480V",
      category: "Electrical Equipment",
      usageCount: 234,
    },
    {
      id: "7",
      name: "Toilet - Wall Mounted",
      category: "Plumbing Fixtures",
      usageCount: 456,
    },
    {
      id: "8",
      name: "LED Fixture - Recessed",
      category: "Lighting",
      usageCount: 3421,
    },
  ]

  return c.json({
    data: data.slice(0, 5)
  })
})

export default app