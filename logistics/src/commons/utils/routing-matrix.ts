interface OperationalRouting {
  hubCode: string;
  branchCode: string;
  deliveryZone: string;
}

export const ROUTING_MATRIX: Record<string, Record<string, Record<string, OperationalRouting>>> = {
  "Bulacan": {
    "City of San Jose Del Monte": {
      "San Manuel": { hubCode: "BUL-HUB", branchCode: "SJDM-01", deliveryZone: "Z-05" },
      "Muzon": { hubCode: "BUL-HUB", branchCode: "SJDM-01", deliveryZone: "Z-02" },
      "Gumaoc": { hubCode: "BUL-HUB", branchCode: "SJDM-02", deliveryZone: "Z-01" },
    },
    "Marilao": {
      "San Miguel": { hubCode: "BUL-HUB", branchCode: "MRL-01", deliveryZone: "Z-08" }
    }
  },
  "Metro Manila": {
    "Quezon City": {
      "Pinyahan": { hubCode: "NCR-HUB", branchCode: "QC-04", deliveryZone: "Z-12" },
      "Diliman": { hubCode: "NCR-HUB", branchCode: "QC-04", deliveryZone: "Z-10" }
    }
  }
}