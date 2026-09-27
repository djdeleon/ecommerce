import { FastifyReply, FastifyRequest } from "fastify";

export async function userAuth(req: FastifyRequest, rep: FastifyReply) {
  try {
    const { prisma } = req.server

    await req.jwtVerify();

    const userId = (req.user as any).id

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { courier: true }
    })

    req.user = user
  } catch (err) {
    return rep.status(401).send({
      error: 'Unauthorized: Invalid or missing token'
    })
  }
}