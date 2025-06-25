# Dockerfile
# 1. Partir d'une image Nginx légère
FROM nginx:alpine

# 2. Vider le contenu par défaut servi par Nginx
RUN rm -rf /usr/share/nginx/html/*

# 3. Copier le build statique Next.js (dossier out/) dans le dossier racine de Nginx
COPY out/ /usr/share/nginx/html/

# 4. Exposer le port 80 (HTTP)
EXPOSE 80

# (Optionnel) si tu veux customiser la config Nginx,
# tu peux copier un fichier nginx.conf modifié dans /etc/nginx/nginx.conf
# mais le simple "serve static" suffit pour Next.js export.
