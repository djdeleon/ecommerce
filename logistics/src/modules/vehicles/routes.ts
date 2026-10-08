import { FastifyInstance } from "fastify";
import { CreateVehicleProfile, CreateVehicleSchema, DeleteVehicleParams, DeleteVehicleSchema, UpdateVehicleBody, UpdateVehicleParams, UpdateVehicleSchema, VEHICLE_PROFILE_PATHS } from "./schemas/vehicle-profile.schema.js";
import { VehicleType } from "@prisma/client";
import parseId from "#commons/utils/id-parser.js";
import { CreatePhysicalVehicleBody, CreatePhysicalVehicleSchema, DeletePhysicalVehicleParams, DeletePhysicalVehicleSchema, PHYSICAL_VEHICLE_PATHS, UpdatePhysicalVehicleBody, UpdatePhysicalVehicleParams, UpdatePhysicalVehicleSchema } from "./schemas/physical-vehicle.schema.js";
import { COURIER_SCHEDULE_PATHS, CreateCourierScheduleBody, CreateCourierScheduleSchema, DeleteCourierScheduleParams, DeleteCourierScheduleSchema, UpdateCourierScheduleBody, UpdateCourierScheduleParams, UpdateCourierScheduleSchema } from "./schemas/courier-schedule.schema.js";
import { createVehicleProfile, deleteVehicleProfile, updateVehicleProfile } from "./services/vehicle-profile.service.js";
import { createPhysicalVehicle, deletePhysicalVehicle, updatePhysicalVehicle } from "./services/physical-vehicle.service.js";
import { createCourierSchedule, deleteCourierSchedule, updateCourierSchedule } from "./services/courier-schedule.service.js";
import { CreateDispatchLogBody, DISPATCH_LOG_PATHS, CreateDispatchLogSchema, UpdateDispatchLogBody, UpdateDispatchLogParams, UpdateDispatchLogSchema, DeleteDispatchLogParams, DeleteDispatchLogSchema } from "./schemas/dispatch-log.schema.js";
import { createDispatchLog, updateDispatchLog, deleteDispatchLog } from "./services/dispatch-log.service.js";

export async function vehicleProfileRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateVehicleProfile }>(VEHICLE_PROFILE_PATHS.store, { schema: CreateVehicleSchema }, async (req, rep) => {
    const vehicleProfile = await createVehicleProfile(fastify, req.body)

    return rep.code(201).send({
      message: 'Vehicle profile created successfully',
      data: vehicleProfile,
    })
  })

  fastify.put<{ Body: UpdateVehicleBody; Params: UpdateVehicleParams }>(
    VEHICLE_PROFILE_PATHS.update,
    { schema: UpdateVehicleSchema },
    async (req, rep) => {
      const { vehicleProfileId } = req.params

      const updatedProfile = await updateVehicleProfile(fastify, vehicleProfileId, req.body)

      return rep.code(200).send({
        message: 'Vehicle profile updated successfully',
        data: updatedProfile,
      })
    }
  )

  fastify.delete<{ Params: DeleteVehicleParams }>(
    VEHICLE_PROFILE_PATHS.delete,
    { schema: DeleteVehicleSchema },
    async (req, rep) => {
      const { vehicleProfileId } = req.params

      await deleteVehicleProfile(fastify, vehicleProfileId)

      return rep.code(200).send({
        message: 'Vehicle profile deleted successfully',
      })
    }
  )
}

export async function physicalVehicleRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreatePhysicalVehicleBody }>(
    PHYSICAL_VEHICLE_PATHS.store,
    { schema: CreatePhysicalVehicleSchema },
    async (req, rep) => {
      const physicalVehicle = await createPhysicalVehicle(fastify, req.body)

      return rep.code(201).send({
        message: 'Physical vehicle created successfully',
        data: physicalVehicle,
      })
    }
  )

  fastify.put<{ Body: UpdatePhysicalVehicleBody; Params: UpdatePhysicalVehicleParams }>(
    PHYSICAL_VEHICLE_PATHS.update,
    { schema: UpdatePhysicalVehicleSchema },
    async (req, rep) => {
      const { physicalVehicleId } = req.params

      const updatedVehicle = await updatePhysicalVehicle(fastify, physicalVehicleId, req.body)

      return rep.code(200).send({
        message: 'Physical vehicle updated successfully',
        data: updatedVehicle,
      })
    }
  )

  fastify.delete<{ Params: DeletePhysicalVehicleParams }>(
    PHYSICAL_VEHICLE_PATHS.delete,
    { schema: DeletePhysicalVehicleSchema },
    async (req, rep) => {
      const { physicalVehicleId } = req.params

      await deletePhysicalVehicle(fastify, physicalVehicleId)

      return rep.code(200).send({
        message: 'Physical vehicle deleted successfully',
      })
    }
  )
}

export async function courierScheduleRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateCourierScheduleBody }>(
    COURIER_SCHEDULE_PATHS.store,
    { schema: CreateCourierScheduleSchema },
    async (req, rep) => {
      const courierSchedule = await createCourierSchedule(fastify, req.body)

      return rep.code(201).send({
        message: 'Courier schedule created successfully.',
        data: courierSchedule,
      })
    }
  )

  fastify.put<{ Body: UpdateCourierScheduleBody; Params: UpdateCourierScheduleParams }>(
    COURIER_SCHEDULE_PATHS.update,
    { schema: UpdateCourierScheduleSchema },
    async (req, rep) => {
      const { courierScheduleId } = req.params

      const updatedCourierSchedule = await updateCourierSchedule(fastify, courierScheduleId, req.body)

      return rep.code(200).send({
        message: 'Courier schedule updated successfully.',
        data: updatedCourierSchedule,
      })
    }
  )

  fastify.delete<{ Params: DeleteCourierScheduleParams }>(
    COURIER_SCHEDULE_PATHS.delete,
    { schema: DeleteCourierScheduleSchema },
    async (req, rep) => {
      const { courierScheduleId } = req.params

      await deleteCourierSchedule(fastify, courierScheduleId)

      return rep.code(200).send({
        message: 'Courier schedule deleted successfully.',
      })
    }
  )
}

export async function dispatchLogRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateDispatchLogBody }>(
    DISPATCH_LOG_PATHS.store,
    { schema: CreateDispatchLogSchema },
    async (req, rep) => {
      const dispatchLog = await createDispatchLog(fastify, req.body)

      return rep.code(201).send({
        message: 'Dispatch log created successfully.',
        data: dispatchLog,
      })
    }
  )

  fastify.put<{ Body: UpdateDispatchLogBody; Params: UpdateDispatchLogParams }>(
    DISPATCH_LOG_PATHS.update,
    { schema: UpdateDispatchLogSchema },
    async (req, rep) => {
      const { dispatchLogId } = req.params

      const updatedDispatchLog = await updateDispatchLog(fastify, dispatchLogId, req.body)

      return rep.code(200).send({
        message: 'Dispatch log updated successfully.',
        data: updatedDispatchLog,
      })
    }
  )

  fastify.delete<{ Params: DeleteDispatchLogParams }>(
    DISPATCH_LOG_PATHS.delete,
    { schema: DeleteDispatchLogSchema },
    async (req, rep) => {
      const { dispatchLogId } = req.params

      await deleteDispatchLog(fastify, dispatchLogId)

      return rep.code(200).send({
        message: 'Dispatch log deleted successfully.',
      })
    }
  )
}