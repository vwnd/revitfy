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

app.get('/api/family/:id', (c) => {
  const { id } = c.req.param()
  
  const data = [
    {
      id: "1",
      name: "Structural Column - Wide Flange",
      category: "Structural Columns",
      usageCount: 1250,
      likesCount: 342,
      dislikesCount: 18,
      lastUsed: "2 days ago",
      types: [
        { id: "1", name: "Type A - 12x12", usageCount: 450 },
        { id: "2", name: "Type B - 18x18", usageCount: 320 },
        { id: "3", name: "Type C - 24x24", usageCount: 280 },
        { id: "4", name: "Type D - 30x30", usageCount: 200 },
      ],
      usageStatistics: {
        relatedProjects: [
          {
            "projectId": "1",
            "projectName": "Tower A",
            "usedCount": 560,
          },
          {
            "projectId": "2",
            "projectName": "Campus B",
            "usedCount": 420,
          },
          {
            "projectId": "3",
            "projectName": "Residential",
            "usedCount": 270,
          }
        ],
        relatedLocations: [
          {
            "cityName": "New York",
            "usageCount": 750,
          },
          {
            "cityName": "San Francisco",
            "usageCount": 350,
          },
          {
            "cityName": "London",
            "usageCount": 150,
          }
        ],
        relatedPeriods: {
          lastMonth: 200,
          lastQuarter: 450,
          lastYear: 1800,
        },
      }
    },
  ]


  return c.json({
    data: data.find((item) => item.id === id)
  })
})

export default app