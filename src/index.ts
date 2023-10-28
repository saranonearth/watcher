import { fastify } from "fastify";
import { Container } from "typedi";
import { bootstrap } from "fastify-decorators";
import { useContainer } from "@fastify-decorators/typedi";

useContainer(Container);
export const app = fastify({ pluginTimeout: 90_000 });

app.register(bootstrap, {
    directory: import.meta.url,
});
