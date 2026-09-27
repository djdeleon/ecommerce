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