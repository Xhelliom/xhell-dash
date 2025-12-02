# Xhell Dashboard

Configurable single-page dashboard to manage shortcuts to your various applications (Plex, Sonarr, Radarr, Home Assistant, etc.).

## Features

- 🎯 **Single-page dashboard** : Overview of all your applications
- ⚙️ **Simple configuration** : Intuitive interface to add/modify/delete applications
- 🎨 **Flexible logos** : Use Lucide React icons or image URLs
- 📊 **Configurable statistics** : Display stats from external APIs
- 💾 **JSONDB persistence** : Data saved in a simple JSON file
- 🐳 **Docker ready** : Ready to deploy with Docker Compose

## Technologies Used

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **Docker** for containerization

## Installation and Usage

### Local Development

1. **Install dependencies** :
```bash
npm install
```

2. **Start the development server** :
```bash
npm run dev
```

3. **Open in browser** :
```
http://localhost:3000
```

### Production with Docker

1. **Build and start with Docker Compose** :
```bash
docker-compose up -d --build
```

2. **Access the application** :
```
http://localhost:3000
```

3. **View logs** :
```bash
docker-compose logs -f
```

4. **Stop the application** :
```bash
docker-compose down
```

## Project Structure

```
Xhell-Dash/
├── app/
│   ├── api/              # Next.js API routes
│   │   └── apps/         # Application CRUD
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main dashboard page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── AppCard.tsx       # Application card
│   ├── AppForm.tsx       # Add/edit form
│   └── ConfigPanel.tsx   # Configuration panel
├── lib/
│   ├── db.ts             # JSONDB management
│   └── types.ts          # TypeScript types
├── data/
│   └── apps.json         # Persistence file (created automatically)
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Docker orchestration
```

## Usage

### Adding an Application

1. Click the **"Configuration"** button in the top right
2. Click **"Add an application"**
3. Fill out the form:
   - **Name** : Application name (e.g., "Plex", "Sonarr")
   - **URL** : Full URL to the application
   - **Logo type** : Choose between "Lucide Icon" or "Image URL"
   - **Logo** : 
     - If icon: Select an icon from the list
     - If URL: Enter the image URL
   - **Statistics API URL** (optional) : URL to fetch stats from
   - **Statistics label** (optional) : Text to display (e.g., "Movies", "Users")

4. Click **"Add"**

### Editing an Application

1. Open the configuration panel
2. Click the pencil icon on the application card
3. Modify the desired fields
4. Click **"Edit"**

### Deleting an Application

1. Open the configuration panel
2. Click the trash icon on the application card
3. Confirm the deletion

## Statistics Configuration

To display statistics on an application card:

1. Configure the **Statistics API URL** when adding/editing
2. Configure the **Statistics label** (e.g., "Movies", "Users")
3. The API should return a JSON value (number or string) or an object with a `value`, `count`, or `total` property

**Expected API response example** :
```json
42
```
or
```json
{
  "value": 42
}
```

Statistics are automatically refreshed every 30 seconds.

## Application Examples

Here are some example applications you can add:

- **Plex** : `https://plex.example.com`
- **Sonarr** : `https://sonarr.example.com`
- **Radarr** : `https://radarr.example.com`
- **Lidarr** : `https://lidarr.example.com`
- **Home Assistant** : `http://homeassistant.local:8123`
- **Longhorn** : `https://longhorn.example.com`
- **Kubernetes Dashboard** : `https://k8s.example.com`
- **Open WebUI** : `https://openwebui.example.com`
- **Paperless-ngx** : `https://paperless.example.com`
- **Pi-hole** : `http://pi-hole.local/admin`
- **Gotify** : `https://gotify.example.com`

## Data Persistence

Applications are saved in `data/apps.json`. This file is automatically created on first use.

**With Docker** : The `data/` folder is mounted as a volume to persist data between container restarts.

## Available Scripts

- `npm run dev` : Start the development server
- `npm run build` : Build the application for production
- `npm run start` : Start the production server
- `npm run lint` : Check code with ESLint

## License

MIT
