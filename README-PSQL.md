# PostgreSQL Data Storage Reference

## Storage Location

The PostgreSQL database stores its data in a **Docker named volume**.

### Host System Path
```
/var/lib/docker/volumes/f1-prediction-poule_postgres_data/_data
```

### Configuration Details

From `docker-compose.yml:14`:
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

**Volume Configuration:**
- **Volume Name**: `f1-prediction-poule_postgres_data` (prefixed with project name)
- **Container Path**: `/var/lib/postgresql/data` (inside the postgres container)
- **Host Mount**: `/var/lib/docker/volumes/f1-prediction-poule_postgres_data/_data`

## Data Persistence

✅ **Data survives container restarts and rebuilds**
✅ **Managed by Docker** - Docker handles the volume lifecycle
✅ **Automatic persistence** - Volume persists even if containers are removed (unless explicitly deleted)

## Important Notes

1. **Data is safe** when you run `docker compose down` - the volume persists
2. **To delete data**, you need to explicitly run: `docker compose down -v` (with `-v` flag)
3. **Inspect volume**: `docker volume inspect f1-prediction-poule_postgres_data`

## Database Content

The volume stores all application data:
- User accounts
- Predictions
- Race data
- Driver standings
- Leaderboard points

## Backup & Restore

### Create Backup

**Method 1: SQL Dump**
```bash
docker exec f1-postgres pg_dump -U f1user f1_predictions > backup-$(date +%Y%m%d).sql
```

**Method 2: Volume Backup**
```bash
docker run --rm \
  -v f1-prediction-poule_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore from Backup

**Method 1: SQL Restore**
```bash
docker exec -i f1-postgres psql -U f1user f1_predictions < backup-20250101.sql
```

**Method 2: Volume Restore**
```bash
# Stop containers first
docker compose down

# Restore volume data
docker run --rm \
  -v f1-prediction-poule_postgres_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres-backup-20250101.tar.gz"

# Start containers
docker compose up -d
```

## Database Access

### Connect to PostgreSQL CLI
```bash
docker exec -it f1-postgres psql -U f1user -d f1_predictions
```

### Useful SQL Commands
```sql
-- List all tables
\dt

-- View users
SELECT id, nickname, email, total_points FROM users;

-- View driver standings
SELECT driver_number, name, team, total_points FROM drivers WHERE season = 2025 ORDER BY total_points DESC;

-- View leaderboard
SELECT nickname, total_points FROM users ORDER BY total_points DESC LIMIT 10;

-- Exit
\q
```

## Connection Details

- **Host** (from container): `postgres`
- **Host** (from host machine): `localhost:5432`
- **Database**: `f1_predictions`
- **Username**: `f1user`
- **Password**: `f1password`
- **Connection String**: `postgresql://f1user:f1password@postgres:5432/f1_predictions`

## Troubleshooting

### Check if volume exists
```bash
docker volume ls | grep postgres
```

### View volume usage
```bash
docker system df -v
```

### Check database container logs
```bash
docker logs f1-postgres
```

### Verify database is running
```bash
docker exec f1-postgres pg_isready -U f1user
```

## Migration & Updates

When updating the database schema:
1. Create backup first (see above)
2. Run migrations via the app or manually
3. Test thoroughly
4. Keep backup until confirmed working

## Security Notes

⚠️ **Production Recommendations:**
- Change default password in `docker-compose.yml`
- Restrict port `5432` exposure (remove from ports if not needed externally)
- Use environment variables for credentials
- Regular automated backups
- Monitor disk space usage

## Volume Management

### List all volumes
```bash
docker volume ls
```

### Remove unused volumes (⚠️ DANGER)
```bash
docker volume prune
```

### Delete specific volume (⚠️ DANGER - ALL DATA LOST)
```bash
docker compose down -v
# OR
docker volume rm f1-prediction-poule_postgres_data
```
