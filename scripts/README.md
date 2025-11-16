# Ingest Scripts

## ingest-usage-export.ts

This script ingests family usage export data from Revit projects into the database.

### Usage

You can run this script using one of the following methods:

**Using tsx (recommended):**
```bash
npx tsx scripts/ingest-usage-export.ts <path-to-json-file>
```

**Using ts-node:**
```bash
npx ts-node scripts/ingest-usage-export.ts <path-to-json-file>
```

**After compiling:**
```bash
tsc scripts/ingest-usage-export.ts --outDir dist --module esnext --target es2020
node dist/ingest-usage-export.js <path-to-json-file>
```

### Example

```bash
npx tsx scripts/ingest-usage-export.ts "scripts/example/Allen Institute/family_usage_export_log.json"
```

### Required Environment Variables

The script requires the following environment variables to be set:

- `DATABASE_URL` - PostgreSQL database connection string (or use `HYPERDRIVE`)
- `HYPERDRIVE` - Optional JSON object with `connectionString` property (alternative to `DATABASE_URL`)
- `R2_ACCESS_KEY_ID` - Cloudflare R2 access key ID
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 secret access key
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `USER_ID` - User ID for creating families and playlists

### What the Script Does

1. **Reads the JSON export file** containing family usage data
2. **For each family in the export**:
   - Finds the family in the database by name (or creates it if it doesn't exist)
   - Uploads the `.rfa` file to R2 storage (if found in the same folder)
   - Uploads preview images (PNG) to R2 storage (if found)
   - Creates or updates the family record with storage keys
3. **Creates or updates the project** record
4. **Creates or updates family usage records** for each family-project combination
5. **Creates a playlist** containing all families used in the project

### File Structure Expected

The script expects the JSON file to be in a folder that also contains:
- `.rfa` files named `{familyName}.rfa`
- Preview images (PNG) that contain the family name in the filename

Example folder structure:
```
Allen Institute/
  ├── family_usage_export_log.json
  ├── PWA_DOR_BiFoldDouble.rfa
  ├── PWA_DOR_BiFoldDouble_iso - 3D View - Thumb_PWA_DOR_BiFoldDouble.png
  ├── PWA_DOR_Revolving.rfa
  └── ...
```

### Category Inference

The script automatically infers categories from family names:
- `*_DOR_*` → "Doors"
- `*_WIN_*` → "Windows"
- `*_WAL_*` → "Walls"
- `*_FLO_*` → "Floors"
- `*_ROO_*` → "Roofs"
- `*_FUR_*` → "Furniture"
- `*_MEP_*` → "MEP"
- `*_STR_*` → "Structural"
- Default → "Other"

### Output

The script provides detailed console output showing:
- Project information
- Each family being processed
- File uploads
- Playlist creation
- Summary of processed items

