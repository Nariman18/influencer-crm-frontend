import { CreateContractForm } from "@/components/contract/create-contract-form";
import { CreateContractLoading } from "@/components/contract/create-contract-loading";
import DashboardLayout from "@/components/layout/DashboardLayout";
import React, { Suspense } from "react";

function CreateContractPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<CreateContractLoading />}>
        <CreateContractForm />
      </Suspense>
    </DashboardLayout>
  );
}

export default CreateContractPage;
