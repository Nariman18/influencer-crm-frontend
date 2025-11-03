"use client";

import { Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreateContractForm } from "@/components/contract/create-contract-form";
import { CreateContractLoading } from "@/components/contract/create-contract-loading";

export default function CreateContractPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<CreateContractLoading />}>
        <CreateContractForm />
      </Suspense>
    </DashboardLayout>
  );
}
