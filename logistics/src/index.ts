import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/health', async () => {
  return { status: 'ok', service: 'logistics-microservice' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 8000, host: '0.0.0.0' });
    console.log('Logistics service running on port 8000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();