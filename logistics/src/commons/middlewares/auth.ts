const verifyInboundAuth = async (req: any, rep: any) => {
  const apiKey = req.headers['x-api-key'] as string
  const incomingSignature = req.headers['x-signature'] as string

  if (!apiKey || !incomingSignature) {
    return rep.status(401).send({ error: 'Unauthorized: Missing security headers.' })
  }

  const client = await prisma.client.findUnique({
    where: { apiKey }
  })

  if (!client || !client.isActive) {
    return rep.status(401).send({ error: 'Unauthorized: Invalid or deactivated API Client' })
  }

  const plainTextSecret = decryptSecret(client.apiSecret)
  const rawBodyString = JSON.stringify(req.body)

  const expectedSignature = calculateDigest(rawBodyString, plainTextSecret)

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(incomingSignature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  )

  if (!isMatch) {
    return rep.status(401).send({ error: 'Unauthorized: Signature mismatch.' })
  }

  return req.clientId = client.id
}

const verifyLogisticsKey = async (req: any, rep: any) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.LOGISTICS_KEY

  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return rep.status(401).send({
      error: 'Unauthorized',
      message: 'Access Denied: Missing or invalid Authorization Token.'
    })
  }
}

const verifyUserAuth = async (req: any, rep: any) => {
  try {
    await req.jwtVerify();

    const userId = req.user.id

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