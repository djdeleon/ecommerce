  interface JntRatesBody {
    origin_zone: string;
    destination_zone: string;
    weight_kg: number
  }

  fastify.post<{ Body: JntRatesBody }>('/jnt/shipping-fee', {
    preHandler: [verifyLogisticsKey]
  }, async (req, rep) => {
    const { origin_zone, destination_zone, weight_kg } = req.body

    const baseRatings = await getBaseRatings(origin_zone, destination_zone)

    const shippingFee = await calculateShippingFee(baseRatings, weight_kg)

    const data = { baseRatings, shippingFee }

    return { status: 200, data }
  })