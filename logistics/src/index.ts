import { buildApp } from "./app";

const server = buildApp();

const start = async () => {
  try {
    await server.listen({ port: 8000, host: '0.0.0.0' });
    console.log('Logistics service running on port 8000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();