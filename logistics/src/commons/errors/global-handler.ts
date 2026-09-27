import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

export default fp(async function errorHandlingPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: any, req: FastifyRequest, rep: FastifyReply) => {
    fastify.log.error(error)

    if (error.validation) {
      return rep.status(400).send({
        error: "Validation Failed",
        message: "The requested payload properties are invalid.",
        details: error.validation
      })
    }

    if (error.message === 'EmailExists') {
      return rep.status(400).send({
        error: "Email already registered.",
      })
    }

    if (error.message === 'InvalidCredentials') {
      return rep.status(401).send({
        error: 'Invalid email or password'
      })
    }

    if (error.code === 'P2002') {
      return rep.status(409).send({
        error: "Conflict",
        message: "A unique database record constraint was violated.",
      })
    }

    return rep.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred. " + error.message,
    })
  })
})