import { AwsClient } from 'aws4fetch'
import { Hono } from 'hono'
import { getDb } from './db'
import familyRoutes, { updateFamilyPreviewImage } from './family'

export interface Context {
  Bindings: {
    R2_ACCESS_KEY_ID: string
    R2_SECRET_ACCESS_KEY: string
    CLOUDFLARE_ACCOUNT_ID: string
    DATABASE_URL?: string
    HYPERDRIVE?: { connectionString: string }
  }
  Variables: {
    db: ReturnType<typeof getDb>
  }
}

const app = new Hono<Context>()

// Database helper middleware
app.use('*', async (c, next) => {
  c.set('db', getDb(c.env))
  await next()
})

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

// Mount family routes
app.route('/api/family', familyRoutes)

app.post('/api/create-upload-url', async (c) => {
  const { familyId, fileName, objectType, objectId } = await c.req.json()
const db = c.get('db')
  
  const client = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  })

  // Replace with your bucket name and account ID
  const bucketName = "revitfy-storage";
  const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;

  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`,
  );

  // Include filename with extension if provided, otherwise just use familyId
  const filePath = fileName ? `${familyId}/${fileName}` : `${familyId}/preview`;
  url.pathname = `/${filePath}`;
  url.searchParams.set('X-Amz-Expires', '3600');

  const signed = await client.sign(new Request(url, {method: 'PUT'}), { aws: { signQuery: true }})

  if (objectType === "family") {
    try {
      await updateFamilyPreviewImage(db, objectId, filePath)
    } catch (error) {
      if (error instanceof Error && error.message === 'Family not found') {
        return c.json({ error: 'Family not found' }, 404)
      }
      throw error
    }
  }

  return c.json({
    uploadUrl: signed.url,
  })
})

export default app