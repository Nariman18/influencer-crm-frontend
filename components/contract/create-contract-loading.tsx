import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

export function CreateContractLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Contract</h1>
            <p className="text-muted-foreground">
              Create a new contract for an influencer
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    </div>
  );
}
