import fastify from "fastify";
import main from "./app.js";

const server = fastify({ logger: true });

const start = async () => {
  try {
    await server.register(main)

    const port = Number(process.env.PORT) || 3000

    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Logistics service running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();