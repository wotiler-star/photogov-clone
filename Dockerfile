# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# install dependencies (leverage layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# build the Nuxt/Nitro app -> .output
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# only the built output + production deps are needed
COPY --from=build /app/.output /app/.output
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
