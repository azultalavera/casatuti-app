# Reglas del Proyecto (casatuti-app)

- **Ramas (Branches):** Siempre trabajar en una branch nueva con el formato `feature/nombre-cambio`.
- **Commits:** Nunca hacer commits directos a las ramas `test` ni a `main`.
- **Pull Requests:** Al terminar un cambio, se debe hacer un PR a la rama `test`.
- **Base de Datos:** Los cambios de base de datos siempre van como archivos SQL en la carpeta `supabase/migrations/` con el formato de nombre `YYYYMMDDHHMMSS_descripcion.sql`.
